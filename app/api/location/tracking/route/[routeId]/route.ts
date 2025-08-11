import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { routeId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const driverId = searchParams.get('driverId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000;

    const { routeId } = params;

    if (!routeId) {
      return NextResponse.json(
        { success: false, error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Validate route exists
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id, route_number, route_name')
      .eq('id', routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    // Build query
    let query = supabase
      .from('location_tracking')
      .select(`
        id,
        tracking_date,
        tracking_timestamp,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        location_source,
        data_quality,
        created_at,
        drivers!inner (
          id,
          name,
          license_number
        ),
        vehicles (
          id,
          registration_number,
          model
        )
      `)
      .eq('route_id', routeId)
      .eq('is_active', true)
      .order('tracking_timestamp', { ascending: false })
      .limit(limit);

    // Add date filters
    if (startDate) {
      query = query.gte('tracking_date', startDate);
    }

    if (endDate) {
      query = query.lte('tracking_date', endDate);
    }

    // Add driver filter
    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data: trackingData, error } = await query;

    if (error) {
      console.error('Error fetching route tracking data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking data' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      totalRecords: trackingData?.length || 0,
      uniqueDrivers: new Set(trackingData?.map(item => item.drivers.id) || []).size,
      uniqueVehicles: new Set(trackingData?.map(item => item.vehicles?.id).filter(Boolean) || []).size,
      dateRange: {
        start: trackingData?.length ? trackingData[trackingData.length - 1]?.tracking_date : null,
        end: trackingData?.length ? trackingData[0]?.tracking_date : null
      },
      avgSpeed: trackingData?.length ? 
        trackingData.reduce((sum, item) => sum + (item.speed || 0), 0) / trackingData.length : 0,
      avgAccuracy: trackingData?.length ? 
        trackingData.reduce((sum, item) => sum + (item.accuracy || 0), 0) / trackingData.length : 0,
      maxSpeed: trackingData?.length ? 
        Math.max(...trackingData.map(item => item.speed || 0)) : 0
    };

    // Group by date for daily summaries
    const dailySummaries = trackingData?.reduce((acc, item) => {
      const date = item.tracking_date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalRecords: 0,
          avgSpeed: 0,
          avgAccuracy: 0,
          firstRecord: null,
          lastRecord: null
        };
      }
      
      acc[date].totalRecords++;
      acc[date].avgSpeed += item.speed || 0;
      acc[date].avgAccuracy += item.accuracy || 0;
      
      if (!acc[date].firstRecord || item.tracking_timestamp < acc[date].firstRecord) {
        acc[date].firstRecord = item.tracking_timestamp;
      }
      
      if (!acc[date].lastRecord || item.tracking_timestamp > acc[date].lastRecord) {
        acc[date].lastRecord = item.tracking_timestamp;
      }
      
      return acc;
    }, {} as Record<string, any>) || {};

    // Calculate averages for daily summaries
    Object.values(dailySummaries).forEach((summary: any) => {
      summary.avgSpeed = summary.totalRecords > 0 ? summary.avgSpeed / summary.totalRecords : 0;
      summary.avgAccuracy = summary.totalRecords > 0 ? summary.avgAccuracy / summary.totalRecords : 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        route: {
          id: route.id,
          routeNumber: route.route_number,
          routeName: route.route_name
        },
        summary,
        dailySummaries: Object.values(dailySummaries),
        records: trackingData || [],
        totalRecords: trackingData?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in route tracking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

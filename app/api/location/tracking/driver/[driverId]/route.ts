import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const routeId = searchParams.get('routeId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 1000;

    const { driverId } = params;

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Validate driver exists
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name, license_number')
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
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
        routes!inner (
          id,
          route_number,
          route_name
        ),
        vehicles (
          id,
          registration_number,
          model
        )
      `)
      .eq('driver_id', driverId)
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

    // Add route filter
    if (routeId) {
      query = query.eq('route_id', routeId);
    }

    const { data: trackingData, error } = await query;

    if (error) {
      console.error('Error fetching driver tracking data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking data' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      totalRecords: trackingData?.length || 0,
      uniqueRoutes: new Set(trackingData?.map(item => item.routes.id) || []).size,
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
        Math.max(...trackingData.map(item => item.speed || 0)) : 0,
      totalDistance: 0 // TODO: Calculate total distance from coordinates
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
          lastRecord: null,
          routes: new Set()
        };
      }
      
      acc[date].totalRecords++;
      acc[date].avgSpeed += item.speed || 0;
      acc[date].avgAccuracy += item.accuracy || 0;
      acc[date].routes.add(item.routes.id);
      
      if (!acc[date].firstRecord || item.tracking_timestamp < acc[date].firstRecord) {
        acc[date].firstRecord = item.tracking_timestamp;
      }
      
      if (!acc[date].lastRecord || item.tracking_timestamp > acc[date].lastRecord) {
        acc[date].lastRecord = item.tracking_timestamp;
      }
      
      return acc;
    }, {} as Record<string, any>) || {};

    // Calculate averages and convert sets to arrays for daily summaries
    Object.values(dailySummaries).forEach((summary: any) => {
      summary.avgSpeed = summary.totalRecords > 0 ? summary.avgSpeed / summary.totalRecords : 0;
      summary.avgAccuracy = summary.totalRecords > 0 ? summary.avgAccuracy / summary.totalRecords : 0;
      summary.routes = Array.from(summary.routes);
      summary.uniqueRoutes = summary.routes.length;
    });

    // Group by route for route summaries
    const routeSummaries = trackingData?.reduce((acc, item) => {
      const routeId = item.routes.id;
      if (!acc[routeId]) {
        acc[routeId] = {
          routeId,
          routeNumber: item.routes.route_number,
          routeName: item.routes.route_name,
          totalRecords: 0,
          avgSpeed: 0,
          avgAccuracy: 0,
          firstRecord: null,
          lastRecord: null
        };
      }
      
      acc[routeId].totalRecords++;
      acc[routeId].avgSpeed += item.speed || 0;
      acc[routeId].avgAccuracy += item.accuracy || 0;
      
      if (!acc[routeId].firstRecord || item.tracking_timestamp < acc[routeId].firstRecord) {
        acc[routeId].firstRecord = item.tracking_timestamp;
      }
      
      if (!acc[routeId].lastRecord || item.tracking_timestamp > acc[routeId].lastRecord) {
        acc[routeId].lastRecord = item.tracking_timestamp;
      }
      
      return acc;
    }, {} as Record<string, any>) || {};

    // Calculate averages for route summaries
    Object.values(routeSummaries).forEach((summary: any) => {
      summary.avgSpeed = summary.totalRecords > 0 ? summary.avgSpeed / summary.totalRecords : 0;
      summary.avgAccuracy = summary.totalRecords > 0 ? summary.avgAccuracy / summary.totalRecords : 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        driver: {
          id: driver.id,
          name: driver.name,
          licenseNumber: driver.license_number
        },
        summary,
        dailySummaries: Object.values(dailySummaries),
        routeSummaries: Object.values(routeSummaries),
        records: trackingData || [],
        totalRecords: trackingData?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in driver tracking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

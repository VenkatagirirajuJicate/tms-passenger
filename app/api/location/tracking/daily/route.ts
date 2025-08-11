import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const routeId = searchParams.get('routeId');
    const driverId = searchParams.get('driverId');
    const vehicleId = searchParams.get('vehicleId');

    // Validate date parameter
    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
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
      .eq('tracking_date', date)
      .eq('is_active', true)
      .order('tracking_timestamp', { ascending: true });

    // Add filters
    if (routeId) {
      query = query.eq('route_id', routeId);
    }

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    if (vehicleId) {
      query = query.eq('vehicle_id', vehicleId);
    }

    const { data: trackingData, error } = await query;

    if (error) {
      console.error('Error fetching daily tracking data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tracking data' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const summary = {
      totalRecords: trackingData?.length || 0,
      uniqueRoutes: new Set(trackingData?.map(item => item.routes.id) || []).size,
      uniqueDrivers: new Set(trackingData?.map(item => item.drivers.id) || []).size,
      uniqueVehicles: new Set(trackingData?.map(item => item.vehicles?.id).filter(Boolean) || []).size,
      avgSpeed: trackingData?.length ? 
        trackingData.reduce((sum, item) => sum + (item.speed || 0), 0) / trackingData.length : 0,
      avgAccuracy: trackingData?.length ? 
        trackingData.reduce((sum, item) => sum + (item.accuracy || 0), 0) / trackingData.length : 0,
      firstRecord: trackingData?.length ? trackingData[0]?.tracking_timestamp : null,
      lastRecord: trackingData?.length ? trackingData[trackingData.length - 1]?.tracking_timestamp : null
    };

    return NextResponse.json({
      success: true,
      data: {
        date,
        summary,
        records: trackingData || [],
        totalRecords: trackingData?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in daily tracking API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

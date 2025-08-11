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
    const routeId = searchParams.get('routeId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;

    const { driverId } = params;

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Validate driver exists and has location sharing enabled
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select(`
        id,
        name,
        current_latitude,
        current_longitude,
        location_accuracy,
        location_timestamp,
        last_location_update,
        location_sharing_enabled,
        location_enabled,
        location_tracking_status
      `)
      .eq('id', driverId)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Check if location sharing is enabled for this driver
    if (!driver.location_sharing_enabled) {
      return NextResponse.json(
        { success: false, error: 'Location sharing is disabled for this driver' },
        { status: 403 }
      );
    }

    // Get recent location tracking data if routeId is provided
    let trackingData = null;
    if (routeId) {
      const { data: tracking, error: trackingError } = await supabase
        .from('location_tracking')
        .select(`
          id,
          tracking_date,
          tracking_timestamp,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          location_source,
          data_quality
        `)
        .eq('driver_id', driverId)
        .eq('route_id', routeId)
        .eq('is_active', true)
        .order('tracking_timestamp', { ascending: false })
        .limit(limit);

      if (!trackingError && tracking) {
        trackingData = tracking;
      }
    }

    return NextResponse.json({
      success: true,
      driver: {
        id: driver.id,
        name: driver.name,
        currentLocation: {
          latitude: driver.current_latitude,
          longitude: driver.current_longitude,
          accuracy: driver.location_accuracy,
          timestamp: driver.location_timestamp,
          lastUpdate: driver.last_location_update
        },
        trackingStatus: driver.location_tracking_status,
        sharingEnabled: driver.location_sharing_enabled,
        trackingEnabled: driver.location_enabled
      },
      trackingHistory: trackingData || []
    });

  } catch (error) {
    console.error('Error in driver location get API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

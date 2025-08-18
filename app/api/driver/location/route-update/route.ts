import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      driverId, 
      routeId, 
      latitude, 
      longitude, 
      accuracy, 
      speed, 
      heading, 
      timestamp 
    } = body;

    // Validate required fields
    if (!driverId || !routeId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: driverId, routeId, latitude, longitude' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        { success: false, error: 'Invalid latitude value' },
        { status: 400 }
      );
    }

    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { success: false, error: 'Invalid longitude value' },
        { status: 400 }
      );
    }

    // Check if driver exists and has location sharing enabled
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, location_sharing_enabled, location_enabled, name')
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

    // Check if route exists and driver is assigned to it
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('id, driver_id, live_tracking_enabled')
      .eq('id', routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { success: false, error: 'Route not found' },
        { status: 404 }
      );
    }

    if (route.driver_id !== driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver is not assigned to this route' },
        { status: 403 }
      );
    }

    const currentTime = new Date().toISOString();
    const locationTimestamp = timestamp ? new Date(timestamp).toISOString() : currentTime;

    // Update driver location
    const { error: driverUpdateError } = await supabase
      .from('drivers')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        location_accuracy: accuracy ? Math.round(accuracy) : null,
        location_timestamp: locationTimestamp,
        last_location_update: currentTime,
        location_tracking_status: 'active'
      })
      .eq('id', driverId);

    if (driverUpdateError) {
      console.error('Error updating driver location:', driverUpdateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update driver location' },
        { status: 500 }
      );
    }

    // Update route GPS data if live tracking is enabled
    if (route.live_tracking_enabled) {
      const { error: routeUpdateError } = await supabase
        .from('routes')
        .update({
          current_latitude: latitude,
          current_longitude: longitude,
          gps_accuracy: accuracy ? Math.round(accuracy) : null,
          gps_speed: speed || null,
          gps_heading: heading || null,
          last_gps_update: locationTimestamp
        })
        .eq('id', routeId);

      if (routeUpdateError) {
        console.error('Error updating route GPS data:', routeUpdateError);
        // Don't fail the entire request if route update fails
      }
    }

    // Store location in location_tracking table
    const trackingDate = new Date().toISOString().split('T')[0];
    
    const { error: trackingError } = await supabase
      .from('location_tracking')
      .insert([{
        tracking_date: trackingDate,
        route_id: routeId,
        driver_id: driverId,
        latitude,
        longitude,
        accuracy: accuracy ? Math.round(accuracy) : null,
        speed: speed || null,
        heading: heading || null,
        tracking_timestamp: locationTimestamp,
        location_source: 'driver_app',
        data_quality: 'good',
        is_active: true
      }]);

    if (trackingError) {
      console.error('Error storing location tracking:', trackingError);
      // Don't fail the entire request if tracking storage fails
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully for route tracking',
      location: {
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp: locationTimestamp,
        routeId,
        driverName: driver.name
      }
    });

  } catch (error) {
    console.error('Error in driver route location update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const driverId = searchParams.get('driverId');

    if (!routeId || !driverId) {
      return NextResponse.json(
        { success: false, error: 'Route ID and Driver ID are required' },
        { status: 400 }
      );
    }

    // Get current location for driver and route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        current_latitude,
        current_longitude,
        gps_accuracy,
        gps_speed,
        gps_heading,
        last_gps_update,
        live_tracking_enabled,
        drivers!inner (
          id,
          name,
          current_latitude,
          current_longitude,
          location_accuracy,
          location_timestamp,
          last_location_update,
          location_sharing_enabled,
          location_tracking_status
        )
      `)
      .eq('id', routeId)
      .eq('drivers.id', driverId)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { success: false, error: 'Route or driver not found' },
        { status: 404 }
      );
    }

    const driver = route.drivers?.[0];

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        routeNumber: route.route_number,
        routeName: route.route_name,
        currentLatitude: route.current_latitude,
        currentLongitude: route.current_longitude,
        gpsAccuracy: route.gps_accuracy,
        gpsSpeed: route.gps_speed,
        gpsHeading: route.gps_heading,
        lastGpsUpdate: route.last_gps_update,
        liveTrackingEnabled: route.live_tracking_enabled
      },
      driver: driver ? {
        id: driver.id,
        name: driver.name,
        currentLatitude: driver.current_latitude,
        currentLongitude: driver.current_longitude,
        locationAccuracy: driver.location_accuracy,
        locationTimestamp: driver.location_timestamp,
        lastLocationUpdate: driver.last_location_update,
        locationSharingEnabled: driver.location_sharing_enabled,
        trackingStatus: driver.location_tracking_status
      } : null
    });

  } catch (error) {
    console.error('Error in driver route location get API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

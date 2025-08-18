import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, latitude, longitude, accuracy, timestamp, routeId, vehicleId } = body;

    // Validate required fields
    if (!driverId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: driverId, latitude, longitude' },
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

    const currentTime = new Date().toISOString();
    const locationTimestamp = timestamp ? new Date(timestamp).toISOString() : currentTime;

    // Update driver location - use driverId directly
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error('Error updating driver location:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update location' },
        { status: 500 }
      );
    }

    // Store location in location_tracking table and update route GPS data if routeId is provided
    if (routeId) {
      try {
        // First check if the route exists
        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('id, live_tracking_enabled')
          .eq('id', routeId)
          .single();

        if (routeError || !route) {
          console.error('Route not found for location tracking:', routeId);
          // Don't fail the entire request if route doesn't exist
        } else {
          const trackingDate = new Date().toISOString().split('T')[0];
          
          // Update route's GPS data for live tracking
          if (route.live_tracking_enabled) {
            const { error: routeUpdateError } = await supabase
              .from('routes')
              .update({
                current_latitude: latitude,
                current_longitude: longitude,
                gps_accuracy: accuracy ? Math.round(accuracy) : null,
                last_gps_update: locationTimestamp,
                gps_speed: null, // Will be calculated if needed
                gps_heading: null // Will be calculated if needed
              })
              .eq('id', routeId);

            if (routeUpdateError) {
              console.error('Error updating route GPS data:', routeUpdateError);
              // Don't fail the entire request if route update fails
            }
          }
          
          const { error: trackingError } = await supabase
            .from('location_tracking')
            .insert([{
              tracking_date: trackingDate,
              route_id: routeId,
              driver_id: driverId,
              vehicle_id: vehicleId || null,
              latitude,
              longitude,
              accuracy: accuracy ? Math.round(accuracy) : null,
              tracking_timestamp: locationTimestamp,
              location_source: 'driver_app',
              data_quality: 'good',
              is_active: true
            }]);

          if (trackingError) {
            console.error('Error storing location tracking:', trackingError);
            // Don't fail the entire request if tracking storage fails
          }
        }
      } catch (trackingError) {
        console.error('Error storing location tracking:', trackingError);
        // Don't fail the entire request if tracking storage fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        latitude,
        longitude,
        accuracy,
        timestamp: locationTimestamp
      }
    });

  } catch (error) {
    console.error('Error in driver location update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    // Get current location for driver
    const { data: driver, error } = await supabase
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

    if (error || !driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        latitude: driver.current_latitude,
        longitude: driver.current_longitude,
        accuracy: driver.location_accuracy,
        timestamp: driver.location_timestamp,
        lastUpdate: driver.last_location_update,
        sharingEnabled: driver.location_sharing_enabled,
        trackingEnabled: driver.location_enabled,
        trackingStatus: driver.location_tracking_status,
        driverName: driver.name
      }
    });

  } catch (error) {
    console.error('Error in driver location get API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

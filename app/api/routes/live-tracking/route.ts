import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get live tracking information for student's route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const routeId = searchParams.get('route_id');

    if (!studentId && !routeId) {
      return NextResponse.json(
        { error: 'Student ID or Route ID is required' },
        { status: 400 }
      );
    }

    let targetRouteId = routeId;

    // If only student ID provided, find their allocated route
    if (studentId && !routeId) {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('allocated_route_id')
        .eq('id', studentId)
        .single();

      if (studentError || !student?.allocated_route_id) {
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No route allocated to student'
        });
      }

      targetRouteId = student.allocated_route_id;
    }

    // Get route live tracking data with vehicle GPS information and driver location
    // Using explicit relationship to avoid ambiguity
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        status,
        departure_time,
        arrival_time,
        distance,
        duration,
        current_latitude,
        current_longitude,
        gps_speed,
        gps_heading,
        gps_accuracy,
        last_gps_update,
        live_tracking_enabled,
        vehicle_id,
        driver_id,
        vehicles!fk_routes_vehicle (
          id,
          registration_number,
          model,
          current_latitude,
          current_longitude,
          last_gps_update,
          gps_speed,
          gps_heading,
          gps_accuracy,
          live_tracking_enabled,
          gps_devices!fk_vehicles_gps_device (
            device_id,
            device_name,
            status,
            last_heartbeat
          )
        ),
        drivers!fk_routes_driver (
          id,
          name,
          current_latitude,
          current_longitude,
          location_accuracy,
          location_timestamp,
          last_location_update,
          location_sharing_enabled,
          location_tracking_status
        ),
        route_stops (
          id,
          stop_name,
          stop_time,
          sequence_order,
          latitude,
          longitude,
          is_major_stop
        )
      `)
      .eq('id', targetRouteId)
      .single();

    if (routeError) {
      console.error('Error fetching route data:', routeError);
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Get vehicle GPS data and driver location data
    let vehicle = routeData.vehicles?.[0]; // Get first vehicle if assigned
    let driver = routeData.drivers?.[0]; // Get assigned driver
    
    // If relationship query didn't work, fetch driver and vehicle data separately
    if (!driver && routeData.driver_id) {
      const { data: driverData, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', routeData.driver_id)
        .single();
      
      if (!driverError && driverData) {
        driver = driverData;
      }
    }
    
    if (!vehicle && routeData.vehicle_id) {
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', routeData.vehicle_id)
        .single();
      
      if (!vehicleError && vehicleData) {
        vehicle = vehicleData;
      }
    }
    
    // Calculate GPS status from vehicle data and driver location
    let gpsStatus = 'offline';
    let timeSinceUpdate = null;
    let locationSource = 'none';
    let locationStatus = 'no_location';
    let statusMessage = 'Location tracking not available';
    
    // Check vehicle GPS first (highest priority)
    if (vehicle?.last_gps_update) {
      const lastUpdate = new Date(vehicle.last_gps_update);
      const now = new Date();
      const minutesDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);
      timeSinceUpdate = minutesDiff;
      
      if (minutesDiff <= 2) {
        gpsStatus = 'online';
        statusMessage = 'Vehicle GPS is live';
      } else if (minutesDiff <= 5) {
        gpsStatus = 'recent';
        statusMessage = 'Vehicle GPS recently active';
      } else {
        gpsStatus = 'offline';
        statusMessage = 'Vehicle GPS offline';
      }
      
      locationSource = 'vehicle_gps';
      locationStatus = 'vehicle_gps';
    }
    // Fallback to driver location if vehicle GPS is not available
    else if (driver?.last_location_update && driver?.location_sharing_enabled) {
      const lastUpdate = new Date(driver.last_location_update);
      const now = new Date();
      const minutesDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);
      timeSinceUpdate = minutesDiff;
      
      if (minutesDiff <= 2) {
        gpsStatus = 'online';
        statusMessage = 'Driver location is live';
      } else if (minutesDiff <= 5) {
        gpsStatus = 'recent';
        statusMessage = 'Driver location recently active';
      } else {
        gpsStatus = 'offline';
        statusMessage = 'Driver location offline';
      }
      
      locationSource = 'driver_app';
      locationStatus = 'driver_app';
    }
    // Fallback to route-level GPS (driver device updates)
    else if (routeData.last_gps_update) {
      const lastUpdate = new Date(routeData.last_gps_update);
      const now = new Date();
      const minutesDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);
      timeSinceUpdate = minutesDiff;
      
      if (minutesDiff <= 2) {
        gpsStatus = 'online';
        statusMessage = 'Route GPS is live';
      } else if (minutesDiff <= 5) {
        gpsStatus = 'recent';
        statusMessage = 'Route GPS recently active';
      } else {
        gpsStatus = 'offline';
        statusMessage = 'Route GPS offline';
      }
      
      locationSource = 'route_gps';
      locationStatus = 'route_gps';
    }
    // No location data available
    else {
      gpsStatus = 'offline';
      locationStatus = 'no_location';
      statusMessage = 'No location data available';
      
      // Check if driver exists but location sharing is disabled
      if (driver && !driver.location_sharing_enabled) {
        statusMessage = 'Driver location sharing is disabled';
        locationStatus = 'sharing_disabled';
      }
      // Check if no driver is assigned
      else if (!driver) {
        statusMessage = 'No driver assigned to this route';
        locationStatus = 'no_driver';
      }
      // Check if no vehicle is assigned
      else if (!vehicle) {
        statusMessage = 'No vehicle assigned to this route';
        locationStatus = 'no_vehicle';
      }
    }

    // Calculate estimated arrival time if GPS is active and student has boarding point
    let estimatedArrival = null;
    if (studentId && gpsStatus !== 'offline' && vehicle?.current_latitude && vehicle?.current_longitude) {
      // Get student's boarding point
      const { data: studentDetails } = await supabase
        .from('students')
        .select('boarding_point')
        .eq('id', studentId)
        .single();

      if (studentDetails?.boarding_point) {
        // Find the stop that matches student's boarding point
        const boardingStop = routeData.route_stops?.find(
          (stop: any) => stop.stop_name.toLowerCase() === studentDetails.boarding_point.toLowerCase()
        );

        if (boardingStop) {
          // Simple estimation based on average speed and distance
          // This can be enhanced with more sophisticated algorithms
          const avgSpeed = vehicle?.gps_speed || 30; // km/h default
          const estimatedMinutes = Math.round((boardingStop.sequence_order * 5) + (timeSinceUpdate || 0));
          
          estimatedArrival = {
            boardingStop: boardingStop.stop_name,
            estimatedMinutes,
            estimatedTime: new Date(Date.now() + estimatedMinutes * 60000).toLocaleTimeString(),
            confidence: gpsStatus === 'online' ? 'high' : gpsStatus === 'recent' ? 'medium' : 'low'
          };
        }
      }
    }

    // Determine current location with priority: Vehicle GPS > Driver Location > Route GPS
    let currentLocation = null;
    
    // Priority 1: Vehicle GPS (most accurate)
    if (vehicle?.current_latitude && vehicle?.current_longitude) {
      currentLocation = {
        latitude: vehicle.current_latitude,
        longitude: vehicle.current_longitude,
        accuracy: vehicle.gps_accuracy,
        speed: vehicle.gps_speed,
        heading: vehicle.gps_heading,
        lastUpdate: vehicle.last_gps_update,
        source: 'vehicle_gps'
      };
    }
    // Priority 2: Driver location (from driver app)
    else if (driver?.current_latitude && driver?.current_longitude && driver?.location_sharing_enabled) {
      currentLocation = {
        latitude: driver.current_latitude,
        longitude: driver.current_longitude,
        accuracy: driver.location_accuracy,
        speed: null, // Driver app doesn't provide speed
        heading: null, // Driver app doesn't provide heading
        lastUpdate: driver.last_location_update,
        source: 'driver_app'
      };
    }
    // Priority 3: Route-level GPS (fallback)
    else if (routeData.current_latitude && routeData.current_longitude) {
      currentLocation = {
        latitude: routeData.current_latitude,
        longitude: routeData.current_longitude,
        accuracy: routeData.gps_accuracy,
        speed: routeData.gps_speed,
        heading: routeData.gps_heading,
        lastUpdate: routeData.last_gps_update,
        source: 'route_gps'
      };
    }

    // Format response
    const trackingData = {
      route: {
        id: routeData.id,
        routeNumber: routeData.route_number,
        routeName: routeData.route_name,
        startLocation: routeData.start_location,
        endLocation: routeData.end_location,
        departureTime: routeData.departure_time,
        arrivalTime: routeData.arrival_time,
        distance: routeData.distance,
        duration: routeData.duration,
        status: routeData.status,
        stops: routeData.route_stops?.sort((a: any, b: any) => a.sequence_order - b.sequence_order) || []
      },
      gps: {
        enabled: vehicle?.live_tracking_enabled || routeData.live_tracking_enabled || false,
        status: gpsStatus,
        locationSource,
        locationStatus,
        statusMessage,
        currentLocation,
        timeSinceUpdate,
        device: vehicle?.gps_devices && vehicle.gps_devices.length > 0 ? {
          id: vehicle.gps_devices[0].device_id,
          name: vehicle.gps_devices[0].device_name,
          status: vehicle.gps_devices[0].status,
          lastHeartbeat: vehicle.gps_devices[0].last_heartbeat
        } : null,
        fallbackInfo: {
          hasVehicle: !!vehicle,
          hasDriver: !!driver,
          driverSharingEnabled: driver?.location_sharing_enabled || false,
          vehicleTrackingEnabled: vehicle?.live_tracking_enabled || false,
          routeTrackingEnabled: routeData.live_tracking_enabled || false
        }
      },
      vehicle: vehicle ? {
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        model: vehicle.model
      } : null,
      driver: driver ? {
        id: driver.id,
        name: driver.name,
        locationSharingEnabled: driver.location_sharing_enabled,
        trackingStatus: driver.location_tracking_status
      } : null,
      estimatedArrival,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: trackingData
    });

  } catch (error) {
    console.error('Live tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
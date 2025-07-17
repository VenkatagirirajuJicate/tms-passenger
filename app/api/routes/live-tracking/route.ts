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

    // Get route live tracking data with vehicle GPS information
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
        vehicle_id,
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
          gps_devices (
            device_id,
            device_name,
            status,
            last_heartbeat
          )
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

    // Get vehicle GPS data
    const vehicle = routeData.vehicles?.[0]; // Get first vehicle if assigned
    
    // Calculate GPS status from vehicle data
    let gpsStatus = 'offline';
    let timeSinceUpdate = null;
    
    if (vehicle?.last_gps_update) {
      const lastUpdate = new Date(vehicle.last_gps_update);
      const now = new Date();
      const minutesDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);
      timeSinceUpdate = minutesDiff;
      
      if (minutesDiff <= 2) gpsStatus = 'online';
      else if (minutesDiff <= 5) gpsStatus = 'recent';
      else gpsStatus = 'offline';
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
        enabled: vehicle?.live_tracking_enabled || false,
        status: gpsStatus,
        currentLocation: vehicle?.current_latitude && vehicle?.current_longitude ? {
          latitude: vehicle.current_latitude,
          longitude: vehicle.current_longitude,
          accuracy: vehicle.gps_accuracy,
          speed: vehicle.gps_speed,
          heading: vehicle.gps_heading,
          lastUpdate: vehicle.last_gps_update,
          timeSinceUpdate
        } : null,
        device: vehicle?.gps_devices && vehicle.gps_devices.length > 0 ? {
          id: vehicle.gps_devices[0].device_id,
          name: vehicle.gps_devices[0].device_name,
          status: vehicle.gps_devices[0].status,
          lastHeartbeat: vehicle.gps_devices[0].last_heartbeat
        } : null
      },
      vehicle: vehicle ? {
        id: vehicle.id,
        registrationNumber: vehicle.registration_number,
        model: vehicle.model
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
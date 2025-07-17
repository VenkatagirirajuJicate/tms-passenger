import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get route progress for a specific route or student's route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const routeId = searchParams.get('route_id');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

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
        .select('allocated_route_id, boarding_point')
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

    // Get route data with stops and vehicle GPS location
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        departure_time,
        arrival_time,
        status,
        vehicle_id,
        vehicles!fk_routes_vehicle (
          id,
          registration_number,
          current_latitude,
          current_longitude,
          last_gps_update,
          gps_speed,
          live_tracking_enabled
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
    
    // Sort stops by sequence order
    const sortedStops = routeData.route_stops?.sort((a: any, b: any) => a.sequence_order - b.sequence_order) || [];
    
    // Calculate progress based on current GPS location
    let currentStopIndex = -1;
    let nextStopIndex = 0;
    let progressPercentage = 0;
    let estimatedTimeToNextStop = null;

    if (vehicle?.current_latitude && vehicle?.current_longitude && sortedStops.length > 0) {
      // Calculate distance to each stop to determine closest completed stop
      const distances = sortedStops.map((stop: any, index: number) => {
        if (!stop.latitude || !stop.longitude) return { index, distance: Infinity };
        
        const lat1 = vehicle.current_latitude;
        const lon1 = vehicle.current_longitude;
        const lat2 = stop.latitude;
        const lon2 = stop.longitude;
        
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return { index, distance };
      });

      // Find the closest stop (likely the next stop or just passed stop)
      const closestStop = distances.reduce((prev, curr) => 
        prev.distance < curr.distance ? prev : curr
      );

      // Determine if bus has passed this stop (based on time and proximity)
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // Check if current time has passed the stop time
      for (let i = 0; i < sortedStops.length; i++) {
        const stop = sortedStops[i];
        const [hours, minutes] = stop.stop_time.split(':').map(Number);
        const stopTime = hours * 60 + minutes;
        
        if (currentTime >= stopTime && closestStop.distance < 0.5) { // Within 500m and time passed
          currentStopIndex = i;
        } else {
          break;
        }
      }

      nextStopIndex = Math.min(currentStopIndex + 1, sortedStops.length - 1);
      progressPercentage = ((currentStopIndex + 1) / sortedStops.length) * 100;

      // Estimate time to next stop
      if (nextStopIndex < sortedStops.length) {
        const nextStop = sortedStops[nextStopIndex];
        const avgSpeed = vehicle?.gps_speed || 25; // km/h default city speed
        
        if (nextStop.latitude && nextStop.longitude) {
          const distanceToNext = distances[nextStopIndex].distance;
          const timeInHours = distanceToNext / avgSpeed;
          estimatedTimeToNextStop = Math.round(timeInHours * 60); // Convert to minutes
        }
      }
    }

    // Enhance stops with completion status
    const enhancedStops = sortedStops.map((stop: any, index: number) => ({
      ...stop,
      completed: index <= currentStopIndex,
      current: index === nextStopIndex,
      upcoming: index > nextStopIndex,
      estimatedArrival: index === nextStopIndex && estimatedTimeToNextStop 
        ? new Date(Date.now() + estimatedTimeToNextStop * 60000).toLocaleTimeString()
        : null
    }));

    // Get student's specific boarding point if student ID provided
    let studentBoardingInfo = null;
    if (studentId) {
      const { data: studentDetails } = await supabase
        .from('students')
        .select('boarding_point')
        .eq('id', studentId)
        .single();

      if (studentDetails?.boarding_point) {
        const boardingStopIndex = enhancedStops.findIndex(
          (stop: any) => stop.stop_name.toLowerCase() === studentDetails.boarding_point.toLowerCase()
        );

        if (boardingStopIndex !== -1) {
          const boardingStop = enhancedStops[boardingStopIndex];
          studentBoardingInfo = {
            stopName: boardingStop.stop_name,
            stopTime: boardingStop.stop_time,
            sequenceOrder: boardingStop.sequence_order,
            completed: boardingStop.completed,
            current: boardingStop.current,
            upcoming: boardingStop.upcoming,
            estimatedArrival: boardingStop.estimatedArrival,
            stopsUntilBoarding: Math.max(0, boardingStopIndex - currentStopIndex - 1)
          };
        }
      }
    }

    // Calculate overall journey progress
    const journeyProgress = {
      totalStops: sortedStops.length,
      completedStops: currentStopIndex + 1,
      remainingStops: Math.max(0, sortedStops.length - currentStopIndex - 1),
      progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
      currentStop: currentStopIndex >= 0 ? enhancedStops[currentStopIndex] : null,
      nextStop: nextStopIndex < sortedStops.length ? enhancedStops[nextStopIndex] : null,
      estimatedTimeToCompletion: estimatedTimeToNextStop && sortedStops.length > nextStopIndex
        ? estimatedTimeToNextStop + ((sortedStops.length - nextStopIndex - 1) * 5) // Rough estimate
        : null
    };

    // GPS status
    let gpsStatus = 'offline';
    if (vehicle?.last_gps_update) {
      const lastUpdate = new Date(vehicle.last_gps_update);
      const now = new Date();
      const minutesDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);
      
      if (minutesDiff <= 2) gpsStatus = 'online';
      else if (minutesDiff <= 5) gpsStatus = 'recent';
    }

    const progressData = {
      route: {
        id: routeData.id,
        routeNumber: routeData.route_number,
        routeName: routeData.route_name,
        startLocation: routeData.start_location,
        endLocation: routeData.end_location,
        departureTime: routeData.departure_time,
        arrivalTime: routeData.arrival_time,
        status: routeData.status
      },
      progress: journeyProgress,
      stops: enhancedStops,
      studentBoardingInfo,
      gpsStatus,
      liveTrackingEnabled: vehicle?.live_tracking_enabled || false,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Route progress API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
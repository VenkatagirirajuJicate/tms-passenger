import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const studentId = searchParams.get('studentId');

    if (!routeId && !studentId) {
      return NextResponse.json(
        { error: 'Route ID or Student ID is required' },
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
          success: false,
          message: 'No route allocated to student'
        });
      }

      targetRouteId = student.allocated_route_id;
    }

    // Test live tracking API
    const trackingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/routes/live-tracking?route_id=${targetRouteId}`);
    const trackingData = await trackingResponse.json();

    // Test route progress API
    const progressResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/routes/route-progress?route_id=${targetRouteId}`);
    const progressData = await progressResponse.json();

    return NextResponse.json({
      success: true,
      testResults: {
        routeId: targetRouteId,
        liveTracking: {
          success: trackingData.success,
          hasData: !!trackingData.data,
          gpsEnabled: trackingData.data?.gps?.enabled,
          gpsStatus: trackingData.data?.gps?.status,
          locationSource: trackingData.data?.gps?.locationSource,
          hasLocation: !!trackingData.data?.gps?.currentLocation,
          hasDriver: !!trackingData.data?.driver,
          hasVehicle: !!trackingData.data?.vehicle
        },
        routeProgress: {
          success: progressData.success,
          hasData: !!progressData.data,
          hasBoardingInfo: !!progressData.data?.studentBoardingInfo,
          progressPercentage: progressData.data?.progress?.progressPercentage
        }
      },
      liveTrackingData: trackingData.data,
      progressData: progressData.data
    });

  } catch (error) {
    console.error('Test live tracking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

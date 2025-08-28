import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Available routes API called');
    
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch active routes with their stops
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        departure_time,
        arrival_time,
        distance,
        duration,
        fare,
        total_capacity,
        current_passengers,
        status,
        route_stops (
          id,
          stop_name,
          stop_time,
          sequence_order,
          is_major_stop
        )
      `)
      .eq('status', 'active')
      .order('route_number');

    if (routesError) {
      console.error('Error fetching routes:', routesError);
      throw new Error('Failed to fetch routes from database');
    }

    // Transform the data to match the expected format
    const transformedRoutes = routes?.map(route => {
      // Sort stops by sequence order
      const sortedStops = route.route_stops?.sort((a, b) => a.sequence_order - b.sequence_order) || [];
      
      // Calculate available seats
      const availableSeats = Math.max(0, route.total_capacity - (route.current_passengers || 0));
      
      // Format times for display
      const formatTime = (timeString: string) => {
        if (!timeString) return '';
        const time = new Date(`1970-01-01T${timeString}`);
        return time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
      };

      return {
        id: route.id,
        routeName: route.route_name,
        routeCode: route.route_number,
        startPoint: route.start_location,
        endPoint: route.end_location,
        distance: `${route.distance} km`,
        estimatedTime: route.duration || 'N/A',
        fare: parseFloat(route.fare || '0'),
        stops: sortedStops.map(stop => ({
          id: stop.id,
          name: stop.stop_name,
          time: formatTime(stop.stop_time),
          sequence: stop.sequence_order,
          isMajor: stop.is_major_stop
        })),
        schedule: {
          morning: [formatTime(route.departure_time)],
          evening: [formatTime(route.arrival_time)]
        },
        capacity: route.total_capacity,
        availableSeats: availableSeats,
        currentPassengers: route.current_passengers || 0,
        isActive: route.status === 'active'
      };
    }) || [];

    console.log(`✅ Fetched ${transformedRoutes.length} active routes from database`);

    return NextResponse.json({
      success: true,
      routes: transformedRoutes,
      totalRoutes: transformedRoutes.length,
      message: 'Available routes fetched successfully from database'
    });

  } catch (error) {
    console.error('Available routes API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch available routes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

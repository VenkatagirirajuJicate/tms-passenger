import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch all active routes with their stops
    const { data: routes, error: routesError } = await supabaseAdmin
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        departure_time,
        arrival_time,
        duration,
        distance,
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
      return NextResponse.json(
        { error: 'Failed to fetch routes' },
        { status: 500 }
      );
    }

    // Format routes data
    const formattedRoutes = routes.map(route => ({
      id: route.id,
      route_number: route.route_number,
      route_name: route.route_name,
      start_location: route.start_location,
      end_location: route.end_location,
      departure_time: route.departure_time,
      arrival_time: route.arrival_time,
      duration: route.duration,
      distance: route.distance,
      fare: route.fare,
      total_capacity: route.total_capacity,
      current_passengers: route.current_passengers || 0,
      status: route.status,
      route_stops: route.route_stops
        ? route.route_stops.sort((a: { sequence_order: number }, b: { sequence_order: number }) => a.sequence_order - b.sequence_order)
        : []
    }));

    return NextResponse.json({
      success: true,
      routes: formattedRoutes,
      count: formattedRoutes.length
    });

  } catch (error: unknown) {
    console.error('Error in available routes API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
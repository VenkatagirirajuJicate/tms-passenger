import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { routeId } = resolvedParams;

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

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

    // Verify route exists
    const { data: route, error: routeError } = await supabaseAdmin
      .from('routes')
      .select('id, route_number, route_name, status')
      .eq('id', routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Fetch route stops
    const { data: stops, error: stopsError } = await supabaseAdmin
      .from('route_stops')
      .select('id, stop_name, stop_time, sequence_order, is_major_stop')
      .eq('route_id', routeId)
      .order('sequence_order');

    if (stopsError) {
      console.error('Error fetching route stops:', stopsError);
      return NextResponse.json(
        { error: 'Failed to fetch route stops' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        route_number: route.route_number,
        route_name: route.route_name,
        status: route.status
      },
      stops: stops || [],
      count: stops?.length || 0
    });

  } catch (error: any) {
    console.error('Error in route stops API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 
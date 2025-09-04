import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    // Get detailed route information including vehicle and stops
    const { data: route, error } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        start_latitude,
        start_longitude,
        end_latitude,
        end_longitude,
        departure_time,
        arrival_time,
        distance,
        duration,
        total_capacity,
        current_passengers,
        status,
        driver_id,
        vehicle_id,
        vehicles!vehicle_id (
          id,
          registration_number,
          model,
          capacity,
          vehicle_type
        ),
        route_stops (
          id,
          stop_name,
          stop_time,
          sequence_order,
          is_major_stop,
          latitude,
          longitude
        )
      `)
      .eq('id', routeId)
      .single();

    if (error) {
      console.error('Route details fetch error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch route details' }, { status: 500 });
    }

    // Sort route stops by sequence order
    if (route.route_stops) {
      route.route_stops.sort((a: any, b: any) => a.sequence_order - b.sequence_order);
    }

    return NextResponse.json({ 
      success: true, 
      route: route 
    });
  } catch (error) {
    console.error('Route details API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}















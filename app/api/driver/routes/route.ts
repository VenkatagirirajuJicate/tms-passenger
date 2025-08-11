import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!driverId) {
      return NextResponse.json({ error: 'driverId is required' }, { status: 400 });
    }

    // Find active routes assigned to this driver with vehicle information
    const { data: routes, error } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        start_location,
        end_location,
        status,
        total_capacity,
        current_passengers,
        vehicle_id,
        vehicles!vehicle_id (
          id,
          registration_number,
          model,
          capacity
        ),
        route_stops (id, stop_name, stop_time, sequence_order, is_major_stop)
      `)
      .eq('driver_id', driverId)
      .eq('status', 'active')
      .order('route_number');

    if (error) {
      console.error('Driver routes fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, routes: routes || [] });
  } catch (error) {
    console.error('Driver routes API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



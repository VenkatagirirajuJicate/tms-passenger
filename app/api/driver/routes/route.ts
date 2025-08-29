import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const email = searchParams.get('email');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!driverId && !email) {
      return NextResponse.json({ error: 'driverId or email is required' }, { status: 400 });
    }

    let effectiveDriverId = driverId;

    // If driverId is provided but no routes found, try to find driver by email
    if (driverId) {
      // First try to find routes with the provided driverId
      const { data: routesWithId, error: idError } = await supabase
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

      if (!idError && routesWithId && routesWithId.length > 0) {
        return NextResponse.json({ success: true, routes: routesWithId });
      }

      // If no routes found with driverId, try to find driver by email
      if (email) {
        const { data: driverByEmail, error: emailError } = await supabase
          .from('drivers')
          .select('id')
          .eq('email', email)
          .single();

        if (!emailError && driverByEmail) {
          effectiveDriverId = driverByEmail.id;
          console.log('Found driver by email for routes:', email, 'Driver ID:', effectiveDriverId);
        }
      }
    } else if (email) {
      // If only email is provided, find driver by email
      const { data: driverByEmail, error: emailError } = await supabase
        .from('drivers')
        .select('id')
        .eq('email', email)
        .single();

      if (!emailError && driverByEmail) {
        effectiveDriverId = driverByEmail.id;
        console.log('Found driver by email for routes:', email, 'Driver ID:', effectiveDriverId);
      }
    }

    if (!effectiveDriverId) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
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
      .eq('driver_id', effectiveDriverId)
      .eq('status', 'active')
      .order('route_number');

    if (error) {
      console.error('Driver routes fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }

    console.log('Routes found for driver:', effectiveDriverId, 'Count:', routes?.length || 0);
    return NextResponse.json({ success: true, routes: routes || [] });
  } catch (error) {
    console.error('Driver routes API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



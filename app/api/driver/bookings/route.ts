import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const routeNumber = searchParams.get('routeNumber');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Resolve route by number if needed
    let resolvedRouteId = routeId;
    if (!resolvedRouteId && routeNumber) {
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('id')
        .eq('route_number', routeNumber)
        .single();
      if (routeError || !route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }
      resolvedRouteId = route.id as string;
    }

    if (!resolvedRouteId) {
      return NextResponse.json({ error: 'routeId or routeNumber is required' }, { status: 400 });
    }

    // Fetch bookings for given route and date, include stop/route/student info
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        student_id,
        route_id,
        schedule_id,
        trip_date,
        boarding_stop,
        seat_number,
        status,
        payment_status,
        amount,
        students (student_name, roll_number),
        routes (route_number, route_name),
        schedules (departure_time, arrival_time)
      `)
      .eq('route_id', resolvedRouteId)
      .eq('trip_date', date)
      .in('status', ['confirmed', 'completed'])
      .order('boarding_stop', { ascending: true });

    if (error) {
      console.error('Driver bookings fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Group by stop
    const grouped: Record<string, any[]> = {};
    (bookings || []).forEach((b: any) => {
      const stop = b.boarding_stop || 'Unknown Stop';
      if (!grouped[stop]) grouped[stop] = [];
      grouped[stop].push(b);
    });

    return NextResponse.json({ success: true, bookings: bookings || [], stopWise: grouped });
  } catch (error) {
    console.error('Driver bookings API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const routeNumber = searchParams.get('routeNumber');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('drivers')
      .select(`
        id,
        name,
        current_latitude,
        current_longitude,
        location_timestamp,
        location_accuracy,
        location_enabled,
        location_sharing_enabled,
        assigned_route_id,
        routes!assigned_route_id (
          id,
          route_name,
          route_number,
          vehicles!vehicle_id (
            registration_number
          )
        )
      `)
      .eq('location_enabled', true)
      .eq('location_sharing_enabled', true)
      .not('current_latitude', 'is', null)
      .not('current_longitude', 'is', null);

    // Filter by route if specified
    if (routeId) {
      query = query.eq('assigned_route_id', routeId);
    } else if (routeNumber) {
      query = query.eq('routes.route_number', routeNumber);
    }

    const { data: drivers, error } = await query;

    if (error) {
      console.error('Driver locations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch driver locations' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedDrivers = (drivers || []).map(driver => ({
      id: driver.id,
      name: driver.name,
      current_latitude: parseFloat(driver.current_latitude),
      current_longitude: parseFloat(driver.current_longitude),
      location_timestamp: driver.location_timestamp,
      location_accuracy: driver.location_accuracy,
      location_enabled: driver.location_enabled,
      location_sharing_enabled: driver.location_sharing_enabled,
      route_name: driver.routes?.route_name,
      route_number: driver.routes?.route_number,
      vehicle_registration: driver.routes?.vehicles?.registration_number
    }));

    console.log('Driver locations fetched:', transformedDrivers.length);
    return NextResponse.json({ 
      success: true, 
      drivers: transformedDrivers 
    });
  } catch (error) {
    console.error('Driver locations API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

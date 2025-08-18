import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('route_id');

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    console.log('Debug: Fetching route with ID:', routeId);

    // Test 1: Simple query without relationships
    const { data: simpleData, error: simpleError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();

    console.log('Debug: Simple query result:', { data: simpleData, error: simpleError });

    // Test 2: Query with explicit joins
    const { data: joinData, error: joinError } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        driver_id,
        vehicle_id,
        drivers!fk_routes_driver (
          id,
          name,
          location_sharing_enabled
        ),
        vehicles!fk_routes_vehicle (
          id,
          registration_number
        )
      `)
      .eq('id', routeId)
      .single();

    console.log('Debug: Join query result:', { data: joinData, error: joinError });

    // Test 3: Manual join query
    const { data: manualData, error: manualError } = await supabase
      .from('routes')
      .select(`
        id,
        route_number,
        route_name,
        driver_id,
        vehicle_id
      `)
      .eq('id', routeId)
      .single();

    console.log('Debug: Manual query result:', { data: manualData, error: manualError });

    // If we have driver_id, get driver data separately
    let driverData = null;
    let vehicleData = null;

    if (manualData?.driver_id) {
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', manualData.driver_id)
        .single();
      
      driverData = driver;
      console.log('Debug: Driver query result:', { data: driver, error: driverError });
    }

    if (manualData?.vehicle_id) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', manualData.vehicle_id)
        .single();
      
      vehicleData = vehicle;
      console.log('Debug: Vehicle query result:', { data: vehicle, error: vehicleError });
    }

    return NextResponse.json({
      success: true,
      debug: {
        simple: { data: simpleData, error: simpleError },
        join: { data: joinData, error: joinError },
        manual: { data: manualData, error: manualError },
        driver: { data: driverData },
        vehicle: { data: vehicleData }
      }
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

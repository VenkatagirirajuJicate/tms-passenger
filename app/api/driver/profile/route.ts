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

    // Fetch driver profile information
    const { data: profile, error } = await supabase
      .from('drivers')
      .select(`
        id,
        name,
        email,
        phone,
        license_number,
        experience_years,
        rating,
        total_trips,
        status,
        created_at
      `)
      .eq('id', driverId)
      .single();

    if (error) {
      console.error('Driver profile fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: {
        ...profile,
        rating: profile.rating || 0,
        total_trips: profile.total_trips || 0,
        experience_years: profile.experience_years || 0
      }
    });
  } catch (error) {
    console.error('Driver profile API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}




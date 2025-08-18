import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { driverId, name, phone, license_number } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!driverId) {
      return NextResponse.json({ error: 'driverId is required' }, { status: 400 });
    }

    // Validate required fields
    if (!name || !phone || !license_number) {
      return NextResponse.json({ error: 'Name, phone, and license number are required' }, { status: 400 });
    }

    // Update driver profile
    const { data: updatedProfile, error } = await supabase
      .from('drivers')
      .update({
        name: name.trim(),
        phone: phone.trim(),
        license_number: license_number.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', driverId)
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
      .single();

    if (error) {
      console.error('Driver profile update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile: {
        ...updatedProfile,
        rating: updatedProfile.rating || 0,
        total_trips: updatedProfile.total_trips || 0,
        experience_years: updatedProfile.experience_years || 0
      }
    });
  } catch (error) {
    console.error('Driver profile update API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}




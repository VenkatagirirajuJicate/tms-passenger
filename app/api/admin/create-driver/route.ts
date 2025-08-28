import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, licenseNumber, password, adminKey } = await request.json();

    // Simple admin key check (you should use a proper admin authentication)
    if (adminKey !== process.env.ADMIN_SETUP_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!name || !email || !password) {
      return NextResponse.json({ 
        error: 'Name, email, and password are required' 
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Server configuration error' 
      }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if driver already exists
    const { data: existingDriver } = await supabaseAdmin
      .from('drivers')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingDriver) {
      return NextResponse.json({ 
        error: 'Driver with this email already exists' 
      }, { status: 409 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the driver
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .insert({
        name,
        email,
        phone: phone || null,
        license_number: licenseNumber || `LIC${Date.now()}`,
        password_hash: passwordHash,
        status: 'active',
        experience_years: 1,
        rating: 5.0,
        total_trips: 0
      })
      .select()
      .single();

    if (driverError) {
      console.error('Driver creation error:', driverError);
      return NextResponse.json({ 
        error: 'Failed to create driver account' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Driver account created successfully',
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status
      }
    });

  } catch (error) {
    console.error('Create driver error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

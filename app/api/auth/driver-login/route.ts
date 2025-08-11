import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Find driver by email
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select('*')
      .eq('email', email)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (driver.status && driver.status !== 'active') {
      return NextResponse.json({ error: 'Driver account is not active' }, { status: 403 });
    }

    // Verify password
    const passwordHash: string | null = driver.password_hash || null;
    if (!passwordHash) {
      return NextResponse.json({ error: 'Password not set for this driver' }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const session = {
      user: {
        id: driver.id as string,
        email: driver.email as string,
        user_metadata: {
          driver_id: driver.id as string,
          driver_name: (driver.name as string) || 'Driver'
        }
      },
      access_token: 'driver-session-' + driver.id,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
      refresh_token: 'driver-refresh-' + driver.id
    };

    return NextResponse.json({
      success: true,
      user: session.user,
      session,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        rating: driver.rating ?? 0
      }
    });
  } catch (error) {
    console.error('Driver login error:', error);
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



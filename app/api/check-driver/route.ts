import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Check if driver exists
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('drivers')
      .select('id, email, name, status, password_hash')
      .eq('email', email)
      .single();

    if (driverError) {
      return NextResponse.json({
        exists: false,
        message: 'Driver account not found in local database',
        suggestion: 'You may need to create a local driver account or contact administration'
      });
    }

    const hasPassword = !!driver.password_hash;
    const isActive = driver.status === 'active';

    return NextResponse.json({
      exists: true,
      hasPassword,
      isActive,
      name: driver.name,
      status: driver.status,
      message: hasPassword && isActive 
        ? 'Driver account found and ready for login' 
        : !hasPassword 
          ? 'Driver account exists but password not set'
          : 'Driver account exists but is not active'
    });

  } catch (error) {
    console.error('Check driver error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      exists: false 
    }, { status: 500 });
  }
}

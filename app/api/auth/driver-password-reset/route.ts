import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, adminKey } = await request.json();

    // Validate input
    if (!email || !newPassword || !adminKey) {
      return NextResponse.json({ error: 'Missing email, new password, or admin key' }, { status: 400 });
    }

    // Simple admin key validation (you can change this)
    const expectedAdminKey = process.env.ADMIN_RESET_KEY || 'tms-admin-reset-2024';
    if (adminKey !== expectedAdminKey) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
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

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update driver password
    const { error: updateError } = await supabaseAdmin
      .from('drivers')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', driver.id);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email
      }
    });

  } catch (error) {
    console.error('Driver password reset error:', error);
    const message = error instanceof Error ? error.message : 'Password reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

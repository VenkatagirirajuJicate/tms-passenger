import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // Create Supabase admin client (server-side only)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get student by email using admin client (bypasses RLS)
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Check if first login is completed
    if (!student.first_login_completed) {
      return NextResponse.json(
        { error: 'Please complete first time login using your date of birth' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (student.account_locked_until && new Date(student.account_locked_until) > new Date()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked due to multiple failed login attempts' },
        { status: 423 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, student.password_hash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      await supabaseAdmin
        .from('students')
        .update({
          failed_login_attempts: (student.failed_login_attempts || 0) + 1,
          account_locked_until: (student.failed_login_attempts || 0) >= 4 
            ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // Lock for 30 minutes
            : null
        })
        .eq('id', student.id);

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset failed attempts and update last login
    await supabaseAdmin
      .from('students')
      .update({
        failed_login_attempts: 0,
        account_locked_until: null,
        last_login: new Date().toISOString()
      })
      .eq('id', student.id);

    // Create a simple session-like object
    const session = {
      user: {
        id: student.id,
        email: student.email,
        user_metadata: {
          student_id: student.id,
          student_name: student.student_name,
          roll_number: student.roll_number
        }
      },
      access_token: 'custom-session-' + student.id,
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      refresh_token: 'refresh-' + student.id
    };

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: session.user,
      session: session,
      student: {
        id: student.id,
        student_name: student.student_name,
        email: student.email,
        roll_number: student.roll_number
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
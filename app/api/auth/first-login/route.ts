import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, dateOfBirth, newPassword } = await request.json();

    // Validate input
    if (!email || !dateOfBirth || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
        { error: 'Student not found with this email' },
        { status: 404 }
      );
    }

    // Check if already completed first login
    if (student.first_login_completed) {
      return NextResponse.json(
        { error: 'First time login already completed. Please use regular login.' },
        { status: 400 }
      );
    }

    // Verify DOB
    const providedDOB = new Date(dateOfBirth).toDateString();
    const studentDOB = new Date(student.date_of_birth).toDateString();
    
    if (providedDOB !== studentDOB) {
      return NextResponse.json(
        { error: 'Date of birth does not match our records' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update student with new password and mark first login complete using admin client
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({
        password_hash: passwordHash,
        first_login_completed: true,
        last_login: new Date().toISOString(),
        failed_login_attempts: 0
      })
      .eq('id', student.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update password: ' + updateError.message },
        { status: 500 }
      );
    }

    // Return success with student data
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        student_name: student.student_name,
        email: student.email,
        roll_number: student.roll_number
      }
    });

  } catch (error) {
    console.error('First-time login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'First time login failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
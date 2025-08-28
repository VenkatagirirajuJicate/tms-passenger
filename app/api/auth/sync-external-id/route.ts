import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, externalStudentId } = await request.json();

    if (!email || !externalStudentId) {
      return NextResponse.json(
        { error: 'Email and external student ID are required' },
        { status: 400 }
      );
    }

    // Create Supabase client - try service role first, fallback to anon
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use service role key if available, otherwise use anon key
    const supabaseKey = supabaseServiceKey || supabaseAnonKey;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Using Supabase key type:', supabaseServiceKey ? 'service_role' : 'anon');

    // Update the student record with external_student_id
    const { data, error } = await supabase
      .from('students')
      .update({ external_student_id: externalStudentId })
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating external student ID:', error);
      return NextResponse.json(
        { error: 'Failed to update student mapping' },
        { status: 500 }
      );
    }

    console.log('✅ Updated external student ID mapping:', data.email, '->', externalStudentId);

    return NextResponse.json({
      success: true,
      message: 'External student ID mapping updated successfully',
      studentId: data.id,
      email: data.email,
      externalStudentId: data.external_student_id
    });

  } catch (error) {
    console.error('Sync external ID error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

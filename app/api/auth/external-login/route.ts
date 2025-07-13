import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, mobile, newPassword } = await request.json();

    // Validate input
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Create Supabase admin client
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

    // Check if student already exists in local database (including admin-created students)
    const { data: existingStudent, error: existingError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing student:', existingError);
      return NextResponse.json(
        { error: 'Failed to verify student status' },
        { status: 500 }
      );
    }

    if (existingStudent && existingStudent.first_login_completed) {
      return NextResponse.json(
        { error: 'Student already exists. Please use regular login.' },
        { status: 400 }
      );
    }

    // Verify student against external API
    console.log('🔍 External Auth: Verifying student with external API...');
    const apiKey = 'jk_5483dc7eb7f1b7cd730a274ec61765cc_mcka9lzk';
    
    const response = await fetch('https://myadmin.jkkn.ac.in/api/api-management/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to verify with external system' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const students = data.data || data.students || [];
    
    // Find student by email or mobile
    interface ExternalStudent {
      student_email?: string;
      college_email?: string;
      student_mobile?: string;
      father_mobile?: string;
      mother_mobile?: string;
      student_name?: string;
      name?: string;
      roll_number?: string;
      student_id?: string;
      id?: string;
      department_name?: string;
      institution_name?: string;
      program_name?: string;
      degree_name?: string;
      father_name?: string;
      mother_name?: string;
      date_of_birth?: string;
      gender?: string;
      permanent_address_street?: string;
      permanent_address_district?: string;
      permanent_address_state?: string;
      permanent_address_pin_code?: string;
      is_profile_complete?: boolean;
    }

    const foundStudent = students.find((student: ExternalStudent) => {
      const emailMatch = student.student_email?.toLowerCase() === email.toLowerCase() ||
                         student.college_email?.toLowerCase() === email.toLowerCase();
      const mobileMatch = mobile && (
        student.student_mobile === mobile ||
        student.father_mobile === mobile ||
        student.mother_mobile === mobile
      );
      return emailMatch || mobileMatch;
    });

    if (!foundStudent) {
      return NextResponse.json(
        { error: 'Student not found in external system. Please contact admin.' },
        { status: 404 }
      );
    }

    console.log('✅ External Auth: Student verified:', foundStudent.student_name);

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Determine transport enrollment status
    let transportEnrolled = false;
    let enrollmentStatus = 'pending';
    let transportStatus = 'inactive';
    let allocatedRouteId = null;
    let boardingPoint = null;

    // If student exists (admin-created), preserve their transport enrollment
    if (existingStudent) {
      console.log('🔍 Student exists, checking admin enrollment status...');
      transportEnrolled = existingStudent.transport_enrolled || false;
      enrollmentStatus = existingStudent.enrollment_status || 'pending';
      transportStatus = existingStudent.transport_status || 'inactive';
      allocatedRouteId = existingStudent.allocated_route_id || null;
      boardingPoint = existingStudent.boarding_point || null;
      
      console.log('📋 Preserved enrollment status:', {
        transport_enrolled: transportEnrolled,
        enrollment_status: enrollmentStatus,
        transport_status: transportStatus,
        allocated_route_id: allocatedRouteId,
        boarding_point: boardingPoint
      });
    }

    // Prepare student data for local storage
    const studentData = {
      student_name: foundStudent.student_name || foundStudent.name,
      roll_number: foundStudent.roll_number || foundStudent.student_id,
      email: foundStudent.student_email || foundStudent.college_email || email,
      mobile: foundStudent.student_mobile || foundStudent.father_mobile || foundStudent.mother_mobile || mobile,
      password_hash: passwordHash,
      external_student_id: foundStudent.student_id || foundStudent.id,
      external_roll_number: foundStudent.roll_number,
      external_data: foundStudent,
      auth_source: 'external_api',
      first_login_completed: true,
      // Preserve or set transport enrollment status
      transport_enrolled: transportEnrolled,
      enrollment_status: enrollmentStatus,
      transport_status: transportStatus,
      allocated_route_id: allocatedRouteId,
      boarding_point: boardingPoint,
      // Additional comprehensive fields from external API
      department_name: foundStudent.department_name,
      institution_name: foundStudent.institution_name,
      program_name: foundStudent.program_name,
      degree_name: foundStudent.degree_name,
      father_name: foundStudent.father_name,
      mother_name: foundStudent.mother_name,
      parent_mobile: foundStudent.father_mobile || foundStudent.mother_mobile,
      date_of_birth: foundStudent.date_of_birth ? new Date(foundStudent.date_of_birth) : null,
      gender: foundStudent.gender,
      emergency_contact_name: foundStudent.father_name || foundStudent.mother_name,
      emergency_contact_phone: foundStudent.father_mobile || foundStudent.mother_mobile,
      address_street: foundStudent.permanent_address_street,
      address_district: foundStudent.permanent_address_district,
      address_state: foundStudent.permanent_address_state,
      address_pin_code: foundStudent.permanent_address_pin_code,
      is_profile_complete: foundStudent.is_profile_complete || false,
      last_login: new Date().toISOString(),
      created_at: existingStudent ? existingStudent.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Create or update student record
    let student;
    if (existingStudent) {
      // Update existing student (preserving admin-set transport data)
      const { data: updatedStudent, error: updateError } = await supabaseAdmin
        .from('students')
        .update(studentData)
        .eq('id', existingStudent.id)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating student:', updateError);
        return NextResponse.json(
          { error: 'Failed to update student record' },
          { status: 500 }
        );
      }
      student = updatedStudent;
      console.log('✅ Updated existing student with preserved transport enrollment');
    } else {
      // Create new student (no transport enrollment yet)
      const { data: newStudent, error: createError } = await supabaseAdmin
        .from('students')
        .insert(studentData)
        .select('*')
        .single();

      if (createError) {
        console.error('Error creating student:', createError);
        return NextResponse.json(
          { error: 'Failed to create student record' },
          { status: 500 }
        );
      }
      student = newStudent;
      console.log('✅ Created new student with default enrollment status');
    }

    // Return success with student data
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        student_name: student.student_name,
        email: student.email,
        roll_number: student.roll_number,
        transport_enrolled: student.transport_enrolled,
        enrollment_status: student.enrollment_status,
        transport_status: student.transport_status,
        allocated_route_id: student.allocated_route_id,
        boarding_point: student.boarding_point,
        admin_enrolled: existingStudent ? true : false // Flag to indicate if they were admin-enrolled
      },
      message: 'External authentication successful. Please proceed to login.'
    });

  } catch (error) {
    console.error('External authentication error:', error);
    const errorMessage = error instanceof Error ? error.message : 'External authentication failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
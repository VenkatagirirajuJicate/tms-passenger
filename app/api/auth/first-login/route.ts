import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Inline types to avoid import issues during development
interface ExternalStudent {
  id: string;
  student_email: string;
  college_email: string;
  date_of_birth: string;
  first_name: string;
  last_name: string | null;
  roll_number: string;
  father_name: string;
  mother_name: string;
  father_occupation: string;
  mother_occupation: string;
  father_mobile: string;
  mother_mobile: string;
  student_mobile: string;
  gender: string;
  permanent_address_street: string;
  permanent_address_taluk: string;
  permanent_address_district: string;
  permanent_address_pin_code: string;
  permanent_address_state: string;
  tenth_marks: any;
  twelfth_marks: any;
  bus_required: boolean;
  bus_route: string;
  bus_pickup_location: string;
  student_photo_url: string | null;
  is_profile_complete: boolean;
  admission_id: string | null;
  application_id: string | null;
  semester_id: string;
  section_id: string;
  academic_year_id: string;
  department?: { department_name: string };
  institution?: { name: string };
  program?: { program_name: string };
  degree?: { degree_name: string };
}

function getFullStudentName(student: ExternalStudent): string {
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';
  return `${firstName} ${lastName}`.trim() || 'Unknown Student';
}

function getPrimaryMobile(student: ExternalStudent): string {
  return student.student_mobile || student.father_mobile || student.mother_mobile || '';
}

function getPrimaryEmail(student: ExternalStudent): string {
  return student.student_email || student.college_email || '';
}

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

    console.log('🔍 DOB Authentication: Starting for email:', email);

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

    // First, try to find student in external database
    console.log('🔍 DOB Authentication: Fetching from external API...');
    const apiKey = 'jk_5483dc7eb7f1b7cd730a274ec61765cc_mcka9lzk';
    
    const externalResponse = await fetch('https://myadmin.jkkn.ac.in/api/api-management/students?limit=10000', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (!externalResponse.ok) {
      console.error('❌ DOB Authentication: External API error:', externalResponse.status);
      return NextResponse.json(
        { error: 'Failed to verify student details from external system' },
        { status: 500 }
      );
    }

    const externalData = await externalResponse.json();
    const externalStudents: ExternalStudent[] = externalData.data || externalData.students || [];
    
    console.log(`📊 DOB Authentication: Fetched ${externalStudents.length} students from external API`);
    
    // Find student by email in external database
    const foundExternalStudent = externalStudents.find((student: ExternalStudent) => 
      student.student_email?.toLowerCase() === email.toLowerCase() ||
      student.college_email?.toLowerCase() === email.toLowerCase()
    );

    if (!foundExternalStudent) {
      console.log('❌ DOB Authentication: Student not found in external database');
      console.log('🔍 DOB Authentication: Searched for email:', email);
      console.log('📋 DOB Authentication: Sample emails from API:');
      externalStudents.slice(0, 5).forEach((student, index) => {
        console.log(`   ${index + 1}. ${student.student_email} / ${student.college_email}`);
      });
      return NextResponse.json(
        { error: 'Student not found with this email address' },
        { status: 404 }
      );
    }

    console.log('✅ DOB Authentication: Found student in external database:', getFullStudentName(foundExternalStudent));
    console.log('📋 DOB Authentication: Student details:');
    console.log('  Roll Number:', foundExternalStudent.roll_number);
    console.log('  Institution:', foundExternalStudent.institution?.name);
    console.log('  Department:', foundExternalStudent.department?.department_name);

    // Verify DOB against external database
    if (!foundExternalStudent.date_of_birth) {
      return NextResponse.json(
        { error: 'Date of birth not available in our records. Please contact administration.' },
        { status: 400 }
      );
    }

    console.log('🔍 DOB Authentication: Comparing dates...');
    console.log('  Provided DOB (raw):', dateOfBirth);
    console.log('  External DOB (raw):', foundExternalStudent.date_of_birth);
    
    const providedDOB = new Date(dateOfBirth).toDateString();
    const externalDOB = new Date(foundExternalStudent.date_of_birth).toDateString();
    
    console.log('  Provided DOB (parsed):', providedDOB);
    console.log('  External DOB (parsed):', externalDOB);
    console.log('  Match result:', providedDOB === externalDOB);
    
    if (providedDOB !== externalDOB) {
      console.log('❌ DOB Authentication: Date of birth mismatch');
      console.log('Provided:', providedDOB);
      console.log('Expected:', externalDOB);
      return NextResponse.json(
        { error: 'Date of birth does not match our records' },
        { status: 400 }
      );
    }

    console.log('✅ DOB Authentication: Date of birth verified');

    // Check if student already exists in local database
    const { data: existingStudent, error: existingError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    let localStudent = existingStudent;

    if (existingError || !existingStudent) {
      console.log('📝 DOB Authentication: Creating new local student record');
      
      // Create new student record from external data - only include fields that exist in local table
      const fullStudentName = getFullStudentName(foundExternalStudent);
      const studentData = {
        student_name: fullStudentName,
        roll_number: foundExternalStudent.roll_number,
        email: getPrimaryEmail(foundExternalStudent),
        mobile: getPrimaryMobile(foundExternalStudent),
        // Basic info that exists in local table
        department_name: foundExternalStudent.department?.department_name || 'Unknown Department',
        institution_name: foundExternalStudent.institution?.name || 'Unknown Institution', 
        program_name: foundExternalStudent.program?.program_name || '',
        degree_name: foundExternalStudent.degree?.degree_name || '',
        father_name: foundExternalStudent.father_name || '',
        mother_name: foundExternalStudent.mother_name || '',
        father_mobile: foundExternalStudent.father_mobile || '',
        mother_mobile: foundExternalStudent.mother_mobile || '',
        date_of_birth: foundExternalStudent.date_of_birth ? new Date(foundExternalStudent.date_of_birth) : null,
        gender: foundExternalStudent.gender || '',
        // Address fields mapped to local schema
        address_street: foundExternalStudent.permanent_address_street || '',
        address_district: foundExternalStudent.permanent_address_district || '',
        address_state: foundExternalStudent.permanent_address_state || '',
        address_pin_code: foundExternalStudent.permanent_address_pin_code || '',
        // Store complete external data in external_data field for reference
        external_data: foundExternalStudent,
        external_id: foundExternalStudent.id,
        external_student_id: foundExternalStudent.id,
        external_roll_number: foundExternalStudent.roll_number,
        is_profile_complete: foundExternalStudent.is_profile_complete || false,
        first_login_completed: false,
        transport_enrolled: false,
        auth_source: 'external_api',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 DOB Authentication: Prepared student data for local insertion:');
      console.log('  Student Name:', studentData.student_name);
      console.log('  Email:', studentData.email);
      console.log('  Mobile:', studentData.mobile);
      console.log('  Department:', studentData.department_name);

      const { data: newStudent, error: insertError } = await supabaseAdmin
        .from('students')
        .insert([studentData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ DOB Authentication: Failed to create student record:', insertError);
        return NextResponse.json(
          { error: 'Failed to create student account: ' + insertError.message },
          { status: 500 }
        );
      }

      localStudent = newStudent;
      console.log('✅ DOB Authentication: Created new local student record');
    } else {
      console.log('✅ DOB Authentication: Found existing local student record');
    }

    // Check if already completed first login
    if (localStudent.first_login_completed) {
      return NextResponse.json(
        { error: 'First time login already completed. Please use regular login.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    console.log('🔒 DOB Authentication: Setting password for student:', localStudent.student_name);

    // Update student with new password and mark first login complete using admin client
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({
        password_hash: passwordHash,
        first_login_completed: true,
        last_login: new Date().toISOString(),
        failed_login_attempts: 0
      })
      .eq('id', localStudent.id);

    if (updateError) {
      console.error('❌ DOB Authentication: Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password: ' + updateError.message },
        { status: 500 }
      );
    }

    console.log('✅ DOB Authentication: Successfully completed setup for:', localStudent.student_name);

    // Return success with student data
    return NextResponse.json({
      success: true,
      student: {
        id: localStudent.id,
        student_name: localStudent.student_name,
        email: localStudent.email,
        roll_number: localStudent.roll_number
      }
    });

  } catch (error) {
    console.error('❌ DOB Authentication: Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Date of birth authentication failed';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 
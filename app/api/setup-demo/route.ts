import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export async function POST() {
  try {
    console.log('Setting up demo data...');

    // Insert demo student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .upsert({
        id: '5ca9fa3d-5360-433b-91fe-0334c5b6748f',
        student_id: 'TMS2025001',
        full_name: 'Demo Student',
        student_name: 'DEMO STUDENT',
        email: 'demo@student.edu',
        mobile: '9876543210',
        college_year: 2,
        department: 'Computer Science',
        section: 'A'
      })
      .select()
      .single();

    if (studentError) {
      console.error('Student creation error:', studentError);
      return NextResponse.json({ error: 'Failed to create student', details: studentError }, { status: 500 });
    }

    // Insert demo route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .upsert({
        id: '6b4bc9a6-cafc-420d-9392-e2404aa09884',
        route_number: 'RT001',
        route_name: 'DEMO ROUTE - College to City',
        start_location: 'JKKN College',
        end_location: 'City Center',
        total_distance: 25.5,
        estimated_travel_time: '45 minutes',
        is_active: true
      })
      .select()
      .single();

    if (routeError) {
      console.error('Route creation error:', routeError);
      return NextResponse.json({ error: 'Failed to create route', details: routeError }, { status: 500 });
    }

    // Insert demo semester fee
    const { data: semesterFee, error: feeError } = await supabase
      .from('semester_fees')
      .upsert({
        id: 'a6fbde6c-8ac3-4fd1-83ce-ee10a9ad30bd',
        route_id: '6b4bc9a6-cafc-420d-9392-e2404aa09884',
        academic_year: '2025-26',
        semester: '1',
        semester_fee: 10000,
        registration_fee: 500,
        late_fee_per_day: 50,
        effective_from: '2025-01-01',
        effective_until: '2025-06-30',
        is_active: true
      })
      .select()
      .single();

    if (feeError) {
      console.error('Semester fee creation error:', feeError);
      return NextResponse.json({ error: 'Failed to create semester fee', details: feeError }, { status: 500 });
    }

    console.log('Demo data created successfully');

    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully',
      data: {
        student: {
          id: student.id,
          name: student.full_name,
          email: student.email
        },
        route: {
          id: route.id,
          name: route.route_name,
          number: route.route_number
        },
        semesterFee: {
          id: semesterFee.id,
          amount: semesterFee.semester_fee,
          academicYear: semesterFee.academic_year,
          semester: semesterFee.semester
        }
      }
    });

  } catch (error: any) {
    console.error('Error setting up demo data:', error);
    return NextResponse.json({ 
      error: 'Failed to setup demo data',
      details: error.message 
    }, { status: 500 });
  }
} 
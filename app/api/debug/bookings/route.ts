import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { studentId } = await request.json();

    console.log('🔍 DEBUG API: Checking bookings for student:', studentId);

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_name, roll_number')
      .eq('id', studentId)
      .single();

    console.log('🔍 DEBUG API: Student lookup:', { student, error: studentError });

    if (studentError || !student) {
      return NextResponse.json({ 
        error: 'Student not found',
        studentId,
        studentError 
      }, { status: 404 });
    }

    // Get all bookings for this student
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    console.log('🔍 DEBUG API: All bookings query:', { bookings, error: bookingsError });

    // Get confirmed bookings only
    const { data: confirmedBookings, error: confirmedError } = await supabase
      .from('bookings')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    console.log('🔍 DEBUG API: Confirmed bookings query:', { confirmedBookings, error: confirmedError });

    // Get schedule details for the bookings
    const scheduleIds = bookings?.map(b => b.schedule_id) || [];
    let scheduleDetails = [];

    if (scheduleIds.length > 0) {
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('id, schedule_date, route_id, status')
        .in('id', scheduleIds);

      console.log('🔍 DEBUG API: Schedule details:', { schedules, error: schedulesError });
      scheduleDetails = schedules || [];
    }

    return NextResponse.json({
      student,
      bookings: bookings || [],
      confirmedBookings: confirmedBookings || [],
      scheduleDetails,
      summary: {
        totalBookings: bookings?.length || 0,
        confirmedBookings: confirmedBookings?.length || 0,
        scheduleIds: scheduleIds.length,
        uniqueScheduleIds: [...new Set(scheduleIds)].length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('🔍 DEBUG API: Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
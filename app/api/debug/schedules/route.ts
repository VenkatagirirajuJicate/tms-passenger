import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { studentId, routeId, startDate, endDate } = await request.json();

    console.log('🔍 SCHEDULE DEBUG: Checking schedules and bookings for:', { studentId, routeId, startDate, endDate });

    if (!studentId || !routeId) {
      return NextResponse.json({ error: 'Student ID and Route ID are required' }, { status: 400 });
    }

    // 1. Get all schedules for the route (any status)
    const { data: allSchedules, error: allSchedulesError } = await supabase
      .from('schedules')
      .select('id, route_id, schedule_date, status, available_seats, booked_seats')
      .eq('route_id', routeId)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date', { ascending: true });

    console.log('🔍 SCHEDULE DEBUG: All schedules for route:', { allSchedules, error: allSchedulesError });

    // 2. Get all bookings for the student
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select('id, schedule_id, status, trip_date, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    console.log('🔍 SCHEDULE DEBUG: All bookings for student:', { allBookings, error: allBookingsError });

    // 3. Get confirmed bookings only
    const { data: confirmedBookings, error: confirmedError } = await supabase
      .from('bookings')
      .select('id, schedule_id, status, trip_date, created_at')
      .eq('student_id', studentId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    console.log('🔍 SCHEDULE DEBUG: Confirmed bookings for student:', { confirmedBookings, error: confirmedError });

    // 4. Get schedules referenced by bookings
    const bookingScheduleIds = confirmedBookings?.map(b => b.schedule_id) || [];
    let bookingSchedules = [];
    
    if (bookingScheduleIds.length > 0) {
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('id, route_id, schedule_date, status, available_seats, booked_seats')
        .in('id', bookingScheduleIds);

      console.log('🔍 SCHEDULE DEBUG: Schedules referenced by bookings:', { schedules, error: schedulesError });
      bookingSchedules = schedules || [];
    }

    // 5. Check for schedule/booking mismatches
    const analysis = {
      totalSchedules: allSchedules?.length || 0,
      totalBookings: allBookings?.length || 0,
      confirmedBookings: confirmedBookings?.length || 0,
      bookingScheduleIds: bookingScheduleIds.length,
      bookingSchedules: bookingSchedules.length,
      scheduleStatus: {},
      bookingStatus: {},
      mismatches: []
    };

    // Analyze schedule statuses
    if (allSchedules) {
      allSchedules.forEach(schedule => {
        const status = schedule.status;
        analysis.scheduleStatus[status] = (analysis.scheduleStatus[status] || 0) + 1;
      });
    }

    // Analyze booking statuses
    if (allBookings) {
      allBookings.forEach(booking => {
        const status = booking.status;
        analysis.bookingStatus[status] = (analysis.bookingStatus[status] || 0) + 1;
      });
    }

    // Check for mismatches
    confirmedBookings?.forEach(booking => {
      const scheduleExists = bookingSchedules.find(s => s.id === booking.schedule_id);
      if (!scheduleExists) {
        analysis.mismatches.push({
          type: 'booking_without_schedule',
          bookingId: booking.id,
          scheduleId: booking.schedule_id,
          tripDate: booking.trip_date
        });
      }
    });

    // Check for route mismatches
    bookingSchedules.forEach(schedule => {
      if (schedule.route_id !== routeId) {
        analysis.mismatches.push({
          type: 'schedule_route_mismatch',
          scheduleId: schedule.id,
          scheduleRoute: schedule.route_id,
          expectedRoute: routeId
        });
      }
    });

    console.log('🔍 SCHEDULE DEBUG: Analysis:', analysis);

    return NextResponse.json({
      allSchedules: allSchedules || [],
      allBookings: allBookings || [],
      confirmedBookings: confirmedBookings || [],
      bookingSchedules: bookingSchedules || [],
      analysis,
      success: true
    }, { status: 200 });

  } catch (error) {
    console.error('🔍 SCHEDULE DEBUG: Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
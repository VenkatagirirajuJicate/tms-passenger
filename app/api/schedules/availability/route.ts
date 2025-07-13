import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Helper function to add booking data to schedules using the working SQL logic
async function addBookingDataToSchedules(schedules: any[], studentId: string | null, supabase: any) {
  if (!studentId || !schedules.length) {
    return schedules.map(schedule => ({
      ...schedule,
      user_booking: null
    }));
  }

  // Get student bookings using the exact logic that works
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('id, student_id, route_id, schedule_id, trip_date, boarding_stop, seat_number, status, payment_status, amount, qr_code')
    .eq('student_id', studentId)
    .eq('status', 'confirmed');

  console.log('🔍 API DEBUG: Student bookings found:', bookings?.length || 0, bookings);

  if (bookingError || !bookings) {
    console.error('🔍 API DEBUG: Booking query error:', bookingError);
    return schedules.map(schedule => ({ ...schedule, user_booking: null }));
  }

  // Match bookings to schedules using the exact logic that works  
  return schedules.map(schedule => {
    const matchingBooking = bookings.find(booking => 
      booking.schedule_id === schedule.id || 
      (booking.trip_date === schedule.schedule_date && booking.route_id === schedule.route_id)
    );

    if (matchingBooking) {
      console.log(`🔍 API DEBUG: Found booking for schedule ${schedule.id} (${schedule.schedule_date}):`, matchingBooking);
      return {
        ...schedule,
        user_booking: {
          id: matchingBooking.id,
          status: matchingBooking.status,
          seatNumber: matchingBooking.seat_number,
          qrCode: matchingBooking.qr_code,
          paymentStatus: matchingBooking.payment_status
        }
      };
    }

    return {
      ...schedule,
      user_booking: null
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('studentId');

    console.log('🔍 API DEBUG: *** UPDATED VERSION v2.0 *** Availability API called with:', { routeId, startDate, endDate, studentId });

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    // Set default date range if not provided
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const defaultEndDate = nextMonth.toISOString().split('T')[0];

    // Use the exact SQL logic that works in database
    console.log('🔍 API DEBUG: *** USING WORKING SQL LOGIC *** Querying with:', {
      routeId,
      startDate: startDate || today,
      endDate: endDate || defaultEndDate,
      studentId
    });

    // Get all schedules including disabled ones for better user experience
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id,
        route_id,
        schedule_date,
        departure_time,
        arrival_time,
        available_seats,
        booked_seats,
        total_seats,
        booking_enabled,
        admin_scheduling_enabled,
        booking_deadline,
        special_instructions,
        status,
        driver_id,
        vehicle_id,
        routes!route_id (
          id,
          route_number,
          route_name,
          start_location,
          end_location,
          fare,
          total_capacity,
          status
        ),
        drivers!driver_id (
          id,
          name
        ),
        vehicles!vehicle_id (
          id,
          registration_number
        )
      `)
      .eq('route_id', routeId)
      .gte('schedule_date', startDate || today)
      .lte('schedule_date', endDate || defaultEndDate)
      .in('status', ['scheduled', 'in_progress', 'cancelled']) // Include cancelled schedules
      .order('schedule_date', { ascending: true })
      .order('departure_time', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    console.log('🔍 API DEBUG: Found schedules:', { count: schedules?.length || 0, schedules });

    // Filter out schedules with inactive routes but keep all schedule statuses
    const routeFilteredSchedules = schedules?.filter((schedule: any) => 
      schedule.routes && schedule.routes.status === 'active'
    ) || [];

    console.log('🔍 API DEBUG: Route filtered schedules:', { count: routeFilteredSchedules.length, routeFilteredSchedules });

    // Get admin settings for booking window calculation
    const { data: settingsData } = await supabase
      .from('admin_settings')
      .select('settings_data')
      .eq('setting_type', 'scheduling')
      .single();

    const adminSettings = settingsData?.settings_data || {
      enableBookingTimeWindow: true,
      bookingWindowEndHour: 19,
      bookingWindowDaysBefore: 1
    };

    // Add booking data using the working logic
    const schedulesWithBookings = await addBookingDataToSchedules(routeFilteredSchedules, studentId, supabase);

    console.log('🔍 API DEBUG: Schedules with booking data:', { 
      count: schedulesWithBookings.length,
      withBookings: schedulesWithBookings.filter(s => s.user_booking).length
    });

    // Format response using the working booking data with proper disabled schedule handling
    const formattedSchedules = schedulesWithBookings.map((schedule: any) => {
      const isPastDate = new Date(schedule.schedule_date) < new Date(today);
      const isScheduleDisabled = schedule.status === 'cancelled' || schedule.booking_enabled === false;
      const isScheduleCompleted = schedule.status === 'completed';
      const hasAvailableSeats = schedule.available_seats > 0;
      
      // Check booking window using admin settings
      let isBookingWindowOpen = true;
      if (adminSettings.enableBookingTimeWindow && !isPastDate) {
        const tripDate = new Date(schedule.schedule_date);
        const cutoffDate = new Date(tripDate);
        cutoffDate.setDate(tripDate.getDate() - adminSettings.bookingWindowDaysBefore);
        cutoffDate.setHours(adminSettings.bookingWindowEndHour, 0, 0, 0);
        
        const now = new Date();
        isBookingWindowOpen = now <= cutoffDate;
      }
      
      // Determine booking availability with comprehensive logic
      let isBookingAvailable = false;
      let bookingDisabledReason = null;
      
      if (isPastDate) {
        bookingDisabledReason = 'Past date';
      } else if (!schedule.admin_scheduling_enabled) {
        bookingDisabledReason = 'Trip not approved by administration for student booking';
      } else if (isScheduleDisabled) {
        bookingDisabledReason = schedule.status === 'cancelled' ? 'Schedule cancelled' : 'Booking disabled';
      } else if (isScheduleCompleted) {
        bookingDisabledReason = 'Schedule completed';
      } else if (!hasAvailableSeats) {
        bookingDisabledReason = 'No available seats';
      } else if (schedule.booking_enabled === false) {
        bookingDisabledReason = 'Booking disabled by admin';
      } else if (!isBookingWindowOpen) {
        const cutoffDate = new Date(schedule.schedule_date);
        cutoffDate.setDate(cutoffDate.getDate() - adminSettings.bookingWindowDaysBefore);
        cutoffDate.setHours(adminSettings.bookingWindowEndHour, 0, 0, 0);
        bookingDisabledReason = `Booking deadline passed at ${cutoffDate.toLocaleString()}`;
      } else {
        isBookingAvailable = true;
      }
      
      return {
        id: schedule.id,
        schedule_date: schedule.schedule_date,
        departure_time: schedule.departure_time,
        arrival_time: schedule.arrival_time,
        available_seats: schedule.available_seats,
        booked_seats: schedule.booked_seats || 0,
        total_seats: schedule.total_seats || schedule.available_seats + (schedule.booked_seats || 0),
        booking_enabled: schedule.booking_enabled !== false,
        admin_scheduling_enabled: schedule.admin_scheduling_enabled || false,
        booking_deadline: schedule.booking_deadline,
        special_instructions: schedule.special_instructions,
        status: schedule.status,
        is_disabled: isScheduleDisabled,
        is_booking_window_open: isBookingWindowOpen,
        is_booking_available: isBookingAvailable,
        booking_disabled_reason: bookingDisabledReason,
        route: schedule.routes ? {
          id: schedule.routes.id,
          routeNumber: schedule.routes.route_number,
          routeName: schedule.routes.route_name,
          startLocation: schedule.routes.start_location,
          endLocation: schedule.routes.end_location,
          fare: schedule.routes.fare,
          totalCapacity: schedule.routes.total_capacity
        } : null,
        driver: schedule.drivers ? {
          id: schedule.drivers.id,
          name: schedule.drivers.name
        } : null,
        vehicle: schedule.vehicles ? {
          id: schedule.vehicles.id,
          registrationNumber: schedule.vehicles.registration_number
        } : null,
        user_booking: schedule.user_booking
      };
    });

    console.log('🔍 API DEBUG: Final formatted response:', {
      count: formattedSchedules.length,
      schedulesWithBookings: formattedSchedules.filter(s => s.user_booking).length
    });

    return NextResponse.json(formattedSchedules, { status: 200 });
  } catch (error) {
    console.error('Error in availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { routeId, startDate, endDate, studentId } = await request.json();

    if (!routeId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Route ID, start date, and end date are required' }, { status: 400 });
    }

    // Get schedules for the date range with new columns
    const { data: schedules, error } = await supabase
      .from('schedules')
      .select(`
        id,
        route_id,
        schedule_date,
        departure_time,
        arrival_time,
        available_seats,
        booked_seats,
        total_seats,
        booking_enabled,
        admin_scheduling_enabled,
        booking_deadline,
        special_instructions,
        status,
        driver_id,
        vehicle_id,
        routes!route_id (
          id,
          route_number,
          route_name,
          start_location,
          end_location,
          fare,
          total_capacity,
          status
        )
      `)
      .eq('route_id', routeId)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .in('status', ['scheduled', 'in_progress'])
      .order('schedule_date', { ascending: true })
      .order('departure_time', { ascending: true });

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    // Filter out schedules with inactive routes
    const activeSchedules = schedules?.filter((schedule: any) => 
      schedule.routes && schedule.routes.status === 'active'
    ) || [];

    // Check existing bookings if student ID is provided
    let existingBookings: any[] = [];
    if (studentId) {
      // Get all confirmed bookings for student (not filtered by schedule IDs)
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, schedule_id, status as booking_status, seat_number, qr_code, trip_date, route_id')
        .eq('student_id', studentId)
        .eq('status', 'confirmed');  // Only check for confirmed bookings

      if (bookingError) {
        console.error('Error checking existing bookings:', bookingError);
      } else {
        // Filter bookings to match schedules by ID OR by date+route
        existingBookings = (bookings || []).filter(booking => {
          const scheduleIdMatch = activeSchedules.some(schedule => schedule.id === booking.schedule_id);
          const dateRouteMatch = activeSchedules.some(schedule => 
            schedule.schedule_date === booking.trip_date && 
            schedule.route_id === booking.route_id
          );
          return scheduleIdMatch || dateRouteMatch;
        });
      }
    }

    // Get admin settings for booking window calculation
    const { data: settingsData } = await supabase
      .from('admin_settings')
      .select('settings_data')
      .eq('setting_type', 'scheduling')
      .single();

    const adminSettings = settingsData?.settings_data || {
      enableBookingTimeWindow: true,
      bookingWindowEndHour: 19,
      bookingWindowDaysBefore: 1
    };

    // Check booking window availability using admin settings
    const bookingWindowChecks = activeSchedules.map((schedule: any) => {
      if (!adminSettings.enableBookingTimeWindow) {
        return { scheduleId: schedule.id, isOpen: true };
      }

      const tripDate = new Date(schedule.schedule_date);
      const cutoffDate = new Date(tripDate);
      cutoffDate.setDate(tripDate.getDate() - adminSettings.bookingWindowDaysBefore);
      cutoffDate.setHours(adminSettings.bookingWindowEndHour, 0, 0, 0);
      
      const now = new Date();
      const isOpen = now <= cutoffDate;
      
      return { scheduleId: schedule.id, isOpen };
    });

    const bookingWindowMap = new Map(
      bookingWindowChecks.map(check => [check.scheduleId, check.isOpen])
    );

    // Format schedules for passenger-side compatibility with proper field mapping
    const formattedSchedules = activeSchedules.map((schedule: any) => {
      // Find booking by schedule ID or by date+route match
      const existingBooking = existingBookings.find((booking: any) => 
        booking.schedule_id === schedule.id || 
        (booking.trip_date === schedule.schedule_date && booking.route_id === schedule.route_id)
      );
      const isBookingWindowOpen = bookingWindowMap.get(schedule.id) || false;
      
      return {
        id: schedule.id,
        schedule_date: schedule.schedule_date,
        departure_time: schedule.departure_time,
        arrival_time: schedule.arrival_time,
        available_seats: schedule.available_seats,
        booked_seats: schedule.booked_seats || 0,
        total_seats: schedule.total_seats || schedule.available_seats + (schedule.booked_seats || 0),
        booking_enabled: schedule.booking_enabled !== false,
        admin_scheduling_enabled: schedule.admin_scheduling_enabled || false,
        booking_deadline: schedule.booking_deadline,
        special_instructions: schedule.special_instructions,
        status: schedule.status,
        is_booking_window_open: isBookingWindowOpen,
        is_booking_available: isBookingWindowOpen && 
                            (schedule.admin_scheduling_enabled === true) &&
                            (schedule.booking_enabled !== false) && 
                            (schedule.available_seats > 0),
        route: schedule.routes ? {
          id: schedule.routes.id,
          routeNumber: schedule.routes.route_number,
          routeName: schedule.routes.route_name,
          startLocation: schedule.routes.start_location,
          endLocation: schedule.routes.end_location,
          fare: schedule.routes.fare,
          totalCapacity: schedule.routes.total_capacity
        } : null,
        user_booking: existingBooking ? {
          id: existingBooking.id,
          status: existingBooking.booking_status,
          seatNumber: existingBooking.seat_number,
          qrCode: existingBooking.qr_code
        } : null
      };
    });

    return NextResponse.json(formattedSchedules, { status: 200 });
  } catch (error) {
    console.error('Error in availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const scheduleDate = searchParams.get('scheduleDate'); // YYYY-MM-DD format
    const studentId = searchParams.get('studentId');

    if (!routeId || !scheduleDate) {
      return NextResponse.json({ error: 'Route ID and schedule date are required' }, { status: 400 });
    }

    // Query database directly for the specific date - no JavaScript date conversion
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
      .eq('schedule_date', scheduleDate) // Direct SQL string comparison
      .in('status', ['scheduled', 'in_progress'])
      .order('departure_time', { ascending: true });

    if (error) {
      console.error('Error fetching schedule:', error);
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }

    // Filter out schedules with inactive routes
    const activeSchedules = schedules?.filter((schedule: any) => 
      schedule.routes && schedule.routes.status === 'active'
    ) || [];

    if (activeSchedules.length === 0) {
      return NextResponse.json({ 
        schedule: null, 
        message: 'No schedule found for this date' 
      }, { status: 200 });
    }

    // Should typically be only one schedule per route per date
    const schedule = activeSchedules[0];

    // Check existing booking if student ID is provided
    let existingBooking = null;
    if (studentId) {
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, status as booking_status, seat_number, qr_code')
        .eq('student_id', studentId)
        .eq('schedule_id', schedule.id)
        .eq('status', 'confirmed')  // Only check for confirmed bookings
        .limit(1);

      if (bookingError) {
        console.error('Error checking existing booking:', bookingError);
      } else {
        existingBooking = bookings?.[0] || null;
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
    let isBookingWindowOpen = true;
    if (adminSettings.enableBookingTimeWindow) {
      const tripDate = new Date(schedule.schedule_date);
      const cutoffDate = new Date(tripDate);
      cutoffDate.setDate(tripDate.getDate() - adminSettings.bookingWindowDaysBefore);
      cutoffDate.setHours(adminSettings.bookingWindowEndHour, 0, 0, 0);
      
      const now = new Date();
      isBookingWindowOpen = now <= cutoffDate;
    }

    // Format the response
    const formattedSchedule = {
      id: schedule.id,
      schedule_date: schedule.schedule_date, // Keep as string for exact matching
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
      driver: schedule.drivers ? {
        id: schedule.drivers.id,
        name: schedule.drivers.name
      } : null,
      vehicle: schedule.vehicles ? {
        id: schedule.vehicles.id,
        registrationNumber: schedule.vehicles.registration_number
      } : null,
      user_booking: existingBooking ? {
        id: existingBooking.id,
        status: existingBooking.booking_status,
        seatNumber: existingBooking.seat_number,
        qrCode: existingBooking.qr_code
      } : null
    };

    return NextResponse.json({ 
      schedule: formattedSchedule,
      message: 'Schedule found successfully' 
    }, { status: 200 });

  } catch (error) {
    console.error('Error in specific date API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const studentId = searchParams.get('studentId');

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    // Set default date range if not provided
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const defaultEndDate = nextMonth.toISOString().split('T')[0];

    // First check if new columns exist
    const { data: columnCheck } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'schedules')
      .eq('column_name', 'booking_enabled')
      .limit(1);

    const hasNewColumns = columnCheck && columnCheck.length > 0;

    // Build query based on available columns
    const query = supabase
      .from('schedules')
      .select(`
        id,
        route_id,
        schedule_date,
        departure_time,
        arrival_time,
        available_seats,
        booked_seats,
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
        ${hasNewColumns ? `,
        total_seats,
        booking_enabled,
        booking_deadline,
        admin_scheduling_enabled,
        special_instructions` : ''}
      `)
      .eq('route_id', routeId)
      .gte('schedule_date', startDate || today)
      .lte('schedule_date', endDate || defaultEndDate)
      .in('status', ['scheduled', 'in_progress'])
      .order('schedule_date', { ascending: true })
      .order('departure_time', { ascending: true });

    const { data: schedules, error } = await query;

    if (error) {
      console.error('Error fetching schedules:', error);
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
    }

    // Filter out schedules with inactive routes
    const activeSchedules = schedules?.filter((schedule: any) => 
      schedule.routes && schedule.routes.status === 'active'
    ) || [];

    // If student ID is provided, check existing bookings
    let existingBookings: any[] = [];
    if (studentId) {
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('id, schedule_id, status as booking_status, seat_number, qr_code')
        .eq('student_id', studentId)
        .in('schedule_id', activeSchedules.map((s: any) => s.id))
        .eq('status', 'confirmed');  // Only check for confirmed bookings

      if (bookingError) {
        console.error('Error checking existing bookings:', bookingError);
      } else {
        existingBookings = bookings || [];
      }
    }

    // Check booking window availability - use function if exists, fallback otherwise
    let bookingWindowMap = new Map();
    
    if (hasNewColumns) {
      // Try to use new booking window function
      try {
        const scheduleIds = activeSchedules.map((s: any) => s.id);
        const bookingWindowChecks = await Promise.all(
          scheduleIds.map(async (scheduleId: string) => {
            const { data: isOpen, error } = await supabase
              .rpc('is_booking_window_open', { schedule_id: scheduleId });
            
            if (error) {
              console.error('Error checking booking window:', error);
              return { scheduleId, isOpen: true }; // Default to open
            }
            
            return { scheduleId, isOpen: isOpen || false };
          })
        );
        
        bookingWindowMap = new Map(
          bookingWindowChecks.map(check => [check.scheduleId, check.isOpen])
        );
              } catch (windowError) {
          console.error('Booking window function not available, using fallback:', windowError);
          // Fallback: all schedules are available
          activeSchedules.forEach((schedule: any) => {
            bookingWindowMap.set(schedule.id, true);
          });
        }
    } else {
      // Fallback: simple time-based check
      activeSchedules.forEach((schedule: any) => {
        const scheduleDateTime = new Date(`${schedule.schedule_date}T${schedule.departure_time}`);
        const now = new Date();
        const isOpen = scheduleDateTime > now; // Simple check: future schedules are open
        bookingWindowMap.set(schedule.id, isOpen);
      });
    }

    // Format the response
    const formattedSchedules = activeSchedules.map((schedule: any) => {
      const existingBooking = existingBookings.find((booking: any) => booking.schedule_id === schedule.id);
      const isBookingWindowOpen = bookingWindowMap.get(schedule.id) || false;
      
      // Handle both old and new schema
      const bookingEnabled = hasNewColumns ? 
        (schedule.booking_enabled !== false && schedule.admin_scheduling_enabled !== false) : 
        true; // Default for old schema
      
      return {
        id: schedule.id,
        schedule_date: schedule.schedule_date,
        departure_time: schedule.departure_time,
        arrival_time: schedule.arrival_time,
        available_seats: schedule.available_seats,
        booked_seats: schedule.booked_seats || 0,
        total_seats: hasNewColumns ? 
          (schedule.total_seats || schedule.available_seats + (schedule.booked_seats || 0)) :
          (schedule.available_seats + (schedule.booked_seats || 0)),
        booking_enabled: bookingEnabled,
        booking_deadline: hasNewColumns ? schedule.booking_deadline : null,
        special_instructions: hasNewColumns ? schedule.special_instructions : null,
        status: schedule.status,
        is_booking_window_open: isBookingWindowOpen,
        is_booking_available: isBookingWindowOpen && 
                            bookingEnabled && 
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
    });

    return NextResponse.json(formattedSchedules, { status: 200 });
  } catch (error) {
    console.error('Error in availability API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
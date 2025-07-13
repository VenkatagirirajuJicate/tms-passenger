import { NextRequest, NextResponse } from 'next/server';

// Simple fallback API that doesn't depend on booking_availability table
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    // Log the date parameters for debugging
    console.log('Simple schedule API called with:', { routeId, startDate, endDate });

    // Return mock data for now to test the frontend
    const mockSchedules = [
      {
        id: '1',
        route_id: routeId,
        schedule_date: new Date().toISOString().split('T')[0],
        departure_time: '08:00:00',
        arrival_time: '09:30:00',
        available_seats: 30,
        booked_seats: 5,
        status: 'scheduled',
        is_booking_window_open: true,
        is_booking_available: true,
        max_bookings_per_day: null,
        special_instructions: null,
        user_booking: null
      },
      {
        id: '2',
        route_id: routeId,
        schedule_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        departure_time: '08:00:00',
        arrival_time: '09:30:00',
        available_seats: 25,
        booked_seats: 10,
        status: 'scheduled',
        is_booking_window_open: true,
        is_booking_available: true,
        max_bookings_per_day: null,
        special_instructions: null,
        user_booking: null
      }
    ];

    return NextResponse.json(mockSchedules);
  } catch (error) {
    console.error('Error in simple schedules API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      is_booking_enabled: true,
      is_available: true,
      max_bookings_per_day: null,
      current_bookings_count: 0,
      special_instructions: null
    });
  } catch (error) {
    console.error('Error in simple booking availability check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
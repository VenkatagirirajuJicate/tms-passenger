import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// GET - Check booking eligibility based on payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const scheduleId = searchParams.get('scheduleId');
    const bookingDate = searchParams.get('bookingDate');
    const routeId = searchParams.get('routeId');

    console.log('Checking booking eligibility:', { studentId, scheduleId, bookingDate, routeId });

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (!bookingDate && !scheduleId) {
      return NextResponse.json({ 
        error: 'Either booking date or schedule ID is required' 
      }, { status: 400 });
    }

    let checkDate: string;
    let targetRouteId: string | null = routeId;

    // If schedule ID is provided, get the schedule details
    if (scheduleId) {
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          id,
          route_id,
          schedule_date,
          departure_time,
          available_seats,
          booked_seats,
          booking_enabled,
          status
        `)
        .eq('id', scheduleId)
        .single();

      if (scheduleError || !schedule) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
      }

      checkDate = schedule.schedule_date;
      targetRouteId = schedule.route_id;

      // Check if booking is enabled for this schedule
      if (!schedule.booking_enabled || schedule.status !== 'scheduled') {
        return NextResponse.json({
          can_book: false,
          reason: 'Booking is not available for this schedule',
          payment_required: false,
          schedule_status: schedule.status,
          booking_enabled: schedule.booking_enabled
        });
      }

      // Check seat availability
      if (schedule.booked_seats >= schedule.available_seats) {
        return NextResponse.json({
          can_book: false,
          reason: 'No seats available',
          payment_required: false,
          available_seats: schedule.available_seats,
          booked_seats: schedule.booked_seats
        });
      }
    } else {
      checkDate = bookingDate!;
    }

    // Get student information
    const { data: studentInfo, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        allocated_route_id,
        boarding_point,
        boarding_stop,
        transport_enrolled
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !studentInfo) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (!studentInfo.transport_enrolled) {
      return NextResponse.json({
        can_book: false,
        reason: 'Student is not enrolled for transport services',
        payment_required: false
      });
    }

    // Use the route from schedule or student's allocated route
    const finalRouteId = targetRouteId || studentInfo.allocated_route_id;

    if (!finalRouteId) {
      return NextResponse.json({
        can_book: false,
        reason: 'No route assigned to student',
        payment_required: false
      });
    }

    // Check payment eligibility using the enhanced database function that respects term periods
    const { data: eligibilityResult, error: eligibilityError } = await supabase
      .rpc('check_booking_eligibility_with_term_grace', {
        student_uuid: studentId,
        booking_date: checkDate,
        route_uuid: finalRouteId
      });

    if (eligibilityError) {
      console.error('Error checking booking eligibility:', eligibilityError);
      return NextResponse.json({ 
        error: 'Failed to check payment status' 
      }, { status: 500 });
    }

    if (!eligibilityResult || eligibilityResult.length === 0) {
      return NextResponse.json({
        can_book: false,
        reason: 'Unable to verify payment status',
        payment_required: true
      });
    }

    const eligibility = eligibilityResult[0];
    
    // If student can book, also get payment details for confirmation
    if (eligibility.can_book) {
      const { data: paymentInfo, error: paymentError } = await supabase
        .rpc('check_student_payment_with_term_grace', {
          student_uuid: studentId,
          check_date: checkDate,
          route_uuid: finalRouteId
        });

      if (!paymentError && paymentInfo && paymentInfo.length > 0) {
        const payment = paymentInfo[0];
        
        return NextResponse.json({
          can_book: true,
          reason: eligibility.reason,
          payment_required: false,
          payment_info: {
            payment_type: payment.payment_type,
            term_number: payment.term_number,
            valid_until: payment.valid_until,
            receipt_color: payment.receipt_color
          },
          schedule_info: scheduleId ? {
            schedule_id: scheduleId,
            available_seats: undefined,
            booked_seats: undefined
          } : null
        });
      }
    }

    // If payment is required, get fee information
    if (eligibility.payment_required) {
      const { data: feeInfo, error: feeError } = await supabase
        .rpc('get_fee_structure_for_route', {
          route_uuid: finalRouteId,
          stop_name_param: studentInfo.boarding_point || studentInfo.boarding_stop,
          academic_year_param: getCurrentAcademicYear(checkDate)
        });

      let termFeeAmount = 0;
      let fullYearFeeAmount = 0;
      let savings = 0;

      if (!feeError && feeInfo && feeInfo.length > 0) {
        const fees = feeInfo[0];
        const requiredTerm = eligibility.required_term;
        
        termFeeAmount = requiredTerm === '1' ? fees.term_1_fee :
                       requiredTerm === '2' ? fees.term_2_fee : fees.term_3_fee;
        
        fullYearFeeAmount = fees.full_year_fee;
        savings = fees.total_term_fees - fees.full_year_fee;
      }

      return NextResponse.json({
        can_book: false,
        reason: eligibility.reason,
        payment_required: true,
        required_term: eligibility.required_term,
        term_description: getTermDescription(eligibility.required_term),
        payment_options: {
          term_payment: {
            amount: termFeeAmount,
            term: eligibility.required_term,
            receipt_color: getReceiptColorForTerm(eligibility.required_term)
          },
          full_year_payment: {
            amount: fullYearFeeAmount,
            savings: savings,
            receipt_color: 'green',
            covers_all_terms: true
          }
        },
        route_id: finalRouteId,
        boarding_stop: studentInfo.boarding_point || studentInfo.boarding_stop
      });
    }

    // Default response
    return NextResponse.json({
      can_book: eligibility.can_book,
      reason: eligibility.reason,
      payment_required: eligibility.payment_required
    });

  } catch (error: any) {
    console.error('Error checking booking eligibility:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Pre-validate booking before creation
export async function POST(request: NextRequest) {
  try {
    const { 
      studentId,
      scheduleId,
      routeId,
      bookingDate
    } = await request.json();

    if (!studentId || (!scheduleId && !bookingDate)) {
      return NextResponse.json({ 
        error: 'Student ID and either schedule ID or booking date required' 
      }, { status: 400 });
    }

    // First check eligibility
    const eligibilityParams = new URLSearchParams({
      studentId,
      ...(scheduleId && { scheduleId }),
      ...(bookingDate && { bookingDate }),
      ...(routeId && { routeId })
    });

    const eligibilityResponse = await GET(
      new NextRequest(`${request.url}?${eligibilityParams}`)
    );
    
    const eligibilityData = await eligibilityResponse.json();

    // If student can book, create the booking record
    if (eligibilityData.can_book) {
      return NextResponse.json({
        validated: true,
        can_proceed: true,
        message: 'Student is eligible to book this schedule',
        payment_info: eligibilityData.payment_info
      });
    } else {
      return NextResponse.json({
        validated: true,
        can_proceed: false,
        message: eligibilityData.reason,
        payment_required: eligibilityData.payment_required,
        payment_options: eligibilityData.payment_options,
        required_term: eligibilityData.required_term
      });
    }

  } catch (error: any) {
    console.error('Error validating booking:', error);
    return NextResponse.json({ 
      error: 'Failed to validate booking',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper functions
function getCurrentAcademicYear(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

function getTermDescription(term: string): string {
  switch (term) {
    case '1': return 'Term 1 (June - September)';
    case '2': return 'Term 2 (October - January)';
    case '3': return 'Term 3 (February - May)';
    default: return 'Unknown Term';
  }
}

function getReceiptColorForTerm(term: string): string {
  switch (term) {
    case '1': return 'white';
    case '2': return 'blue';
    case '3': return 'yellow';
    default: return 'white';
  }
} 
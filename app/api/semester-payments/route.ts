import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// GET - Fetch semester payment data (available fees or payment history)
export async function GET(request: NextRequest) {
  try {
    console.log('Semester payments API called');
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type'); // 'available' or 'history'

    console.log('Parameters - studentId:', studentId, 'type:', type);

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (type === 'available') {
      console.log('Fetching available fees...');
      // Fetch available semester fees that student hasn't paid yet
      return await fetchAvailableFees(studentId);
    } else if (type === 'history') {
      console.log('Fetching payment history...');
      // Fetch student's payment history
      return await fetchPaymentHistory(studentId);
    } else {
      console.log('Invalid type parameter:', type);
      return NextResponse.json({ error: 'Invalid type parameter. Use "available" or "history"' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in semester payments GET:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

async function fetchAvailableFees(studentId: string) {
  try {
    console.log('Fetching available fees for student:', studentId);
    
    // Get current semester info - simplified approach
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    let semester;
    if (month >= 6 && month <= 11) {
      // First semester (June-November)
      semester = {
        academic_year: `${year}-${String(year + 1).slice(-2)}`,
        semester: '1'
      };
    } else {
      // Second semester (December-May)
      const academicStartYear = month >= 12 ? year : year - 1;
      semester = {
        academic_year: `${academicStartYear}-${String(academicStartYear + 1).slice(-2)}`,
        semester: '2'
      };
    }

    console.log('Current semester:', semester);

    // Get student's enrolled routes (check both route_id and allocated_route_id)
    const { data: studentRoutes, error: routesError } = await supabase
      .from('students')
      .select(`
        id,
        route_id,
        allocated_route_id,
        boarding_stop,
        boarding_point,
        transport_enrolled
      `)
      .eq('id', studentId)
      .single();

    console.log('Student routes data:', studentRoutes);
    console.log('Student routes error:', routesError);

    if (routesError) {
      if (routesError.code === 'PGRST116') {
        // Student not found
        console.log('Student not found');
        return NextResponse.json([]);
      }
      console.error('Error fetching student routes:', routesError);
      return NextResponse.json({ error: 'Failed to fetch student information' }, { status: 500 });
    }

    if (!studentRoutes || (!studentRoutes.route_id && !studentRoutes.allocated_route_id)) {
      console.log('No route assigned to student');
      return NextResponse.json([]);
    }

    // Use the appropriate route ID and boarding stop column
    const routeId = studentRoutes.allocated_route_id || studentRoutes.route_id;
    const boardingStop = studentRoutes.boarding_point || studentRoutes.boarding_stop;

    console.log('Route ID:', routeId, 'Boarding Stop:', boardingStop);

    if (!routeId || !boardingStop) {
      console.log('Missing route ID or boarding stop');
      return NextResponse.json([]);
    }

    // Get semester fees for the student's route and stop
    const { data: semesterFees, error: feesError } = await supabase
      .from('semester_fees')
      .select(`
        id,
        allocated_route_id,
        stop_name,
        semester_fee,
        academic_year,
        semester,
        effective_from,
        effective_until
      `)
      .eq('allocated_route_id', routeId)
      .eq('stop_name', boardingStop)
      .eq('academic_year', semester.academic_year)
      .eq('semester', semester.semester)
      .eq('is_active', true);

    console.log('Semester fees query result:', semesterFees);
    console.log('Semester fees error:', feesError);

    if (feesError) {
      console.error('Error fetching semester fees:', feesError);
      return NextResponse.json({ error: 'Failed to fetch semester fees' }, { status: 500 });
    }

    if (!semesterFees || semesterFees.length === 0) {
      console.log('No semester fees found for this route and stop');
      return NextResponse.json([]);
    }

    // Check if student has already paid for this semester (including pending payments)
    const { data: existingPayments, error: paymentsError } = await supabase
      .from('semester_payments')
      .select('id, payment_status, created_at')
      .eq('student_id', studentId)
      .eq('allocated_route_id', routeId)
      .eq('stop_name', boardingStop)
      .eq('academic_year', semester.academic_year)
      .eq('semester', semester.semester)
      .in('payment_status', ['confirmed', 'pending']);

    console.log('Existing payments check:', existingPayments);

    if (paymentsError) {
      console.error('Error checking existing payments:', paymentsError);
      // Don't fail the request, just proceed without payment check
    }

    // If payment already exists (confirmed or pending), return empty array
    if (existingPayments && existingPayments.length > 0) {
      const paymentStatuses = existingPayments.map((p: any) => p.payment_status).join(', ');
      console.log(`Student has existing payment(s) for this semester: ${paymentStatuses}`);
      return NextResponse.json([]);
    }

    // Fetch route information separately and combine
    const { data: routeInfo, error: routeInfoError } = await supabase
      .from('routes')
      .select('id, route_number, route_name, start_location, end_location')
      .eq('id', routeId)
      .single();

    console.log('Route info:', routeInfo);

    if (routeInfoError) {
      console.error('Error fetching route info:', routeInfoError);
      // Return fees without route info rather than failing
      return NextResponse.json(semesterFees.map((fee: any) => ({
        ...fee,
        route_id: routeId, // Add for compatibility
        allocated_route_id: fee.allocated_route_id, // Ensure this is included
        routes: {
          id: routeId,
          route_number: 'N/A',
          route_name: 'Route information not available',
          start_location: 'N/A',
          end_location: 'N/A'
        }
      })));
    }

    // Combine semester fees with route information
    const feesWithRoutes = semesterFees.map((fee: any) => ({
      ...fee,
      route_id: routeId, // Add for compatibility
      allocated_route_id: fee.allocated_route_id, // Ensure this is included
      routes: routeInfo
    }));

    console.log('Final fees with routes:', feesWithRoutes);
    return NextResponse.json(feesWithRoutes);
  } catch (error) {
    console.error('Error fetching available fees:', error);
    return NextResponse.json({ error: 'Failed to fetch available fees' }, { status: 500 });
  }
}

async function fetchPaymentHistory(studentId: string) {
  try {
    console.log('Fetching payment history for student:', studentId);
    
    // Get payment history for the student - using only columns that definitely exist
    const { data: paymentHistory, error: historyError } = await supabase
      .from('semester_payments')
      .select(`
        id,
        student_id,
        allocated_route_id,
        stop_name,
        academic_year,
        semester,
        payment_status,
        created_at,
        updated_at
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    console.log('Payment history data:', paymentHistory);
    console.log('Payment history error:', historyError);

    if (historyError) {
      console.error('Error fetching payment history:', historyError);
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
    }

    if (!paymentHistory || paymentHistory.length === 0) {
      console.log('No payment history found for student');
      return NextResponse.json([]);
    }

    // Get unique route IDs from payment history
    const routeIds = [...new Set(paymentHistory.map((p: any) => p.allocated_route_id).filter(Boolean))];

    console.log('Route IDs in payment history:', routeIds);

    // Fetch route information for all routes in payment history
    const { data: routeInfo, error: routeInfoError } = await supabase
      .from('routes')
      .select('id, route_number, route_name, start_location, end_location')
      .in('id', routeIds);

    console.log('Route info for payment history:', routeInfo);

    if (routeInfoError) {
      console.error('Error fetching route info for payment history:', routeInfoError);
      // Return payment history without route info rather than failing
      return NextResponse.json(paymentHistory.map((payment: any) => ({
        ...payment,
        // Add default values for missing fields
        amount_paid: 0,
        payment_date: payment.created_at,
        payment_method: 'upi',
        receipt_number: 'N/A',
        valid_from: null,
        valid_until: null,
        allocated_route_id: payment.allocated_route_id, // Ensure this is included
        routes: {
          id: payment.allocated_route_id,
          route_number: 'N/A',
          route_name: 'Route information not available',
          start_location: 'N/A',
          end_location: 'N/A'
        }
      })));
    }

    // Create a route lookup map
    const routeLookup = (routeInfo || []).reduce((acc: any, route: any) => {
      acc[route.id] = route;
      return acc;
    }, {});

    // Combine payment history with route information
    const historyWithRoutes = paymentHistory.map((payment: any) => {
      const routeId = payment.allocated_route_id;
      const route = routeLookup[routeId];
      
      return {
        ...payment,
        // Add default values for missing fields that the frontend expects
        amount_paid: 0,
        payment_date: payment.created_at,
        payment_method: 'upi',
        receipt_number: 'N/A',
        valid_from: null,
        valid_until: null,
        allocated_route_id: payment.allocated_route_id, // Ensure this is included
        routes: route || {
          id: routeId,
          route_number: 'N/A',
          route_name: 'Route information not available',
          start_location: 'N/A',
          end_location: 'N/A'
        }
      };
    });

    console.log('Final payment history with routes:', historyWithRoutes);
    return NextResponse.json(historyWithRoutes);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 });
  }
}

// POST - Student payment request (for payment gateway integration)
export async function POST(request: NextRequest) {
  try {
    const { 
      studentId, 
      routeId, 
      stopName,
      semesterFeeId,
      paymentMethod = 'upi'
    } = await request.json();

    if (!studentId || !routeId || !stopName || !semesterFeeId) {
      return NextResponse.json({ 
        error: 'Student ID, route ID, stop name, and semester fee ID are required' 
      }, { status: 400 });
    }

    // Get current semester info - simplified approach
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    let semester;
    if (month >= 6 && month <= 11) {
      // First semester (June-November)
      semester = {
        academic_year: `${year}-${String(year + 1).slice(-2)}`,
        semester: '1'
      };
    } else {
      // Second semester (December-May)
      const academicStartYear = month >= 12 ? year : year - 1;
      semester = {
        academic_year: `${academicStartYear}-${String(academicStartYear + 1).slice(-2)}`,
        semester: '2'
      };
    }

    // Check if student already has a payment for this semester
    const { data: existingPayment, error: existingError } = await supabase
      .from('semester_payments')
      .select('id, payment_status')
      .eq('student_id', studentId)
      .eq('allocated_route_id', routeId)
      .eq('stop_name', stopName)
      .eq('academic_year', semester.academic_year)
      .eq('semester', semester.semester)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing payment:', existingError);
      return NextResponse.json({ error: 'Failed to check existing payment' }, { status: 500 });
    }

    if (existingPayment) {
      return NextResponse.json({ 
        error: 'Payment already exists for this semester',
        existingPayment: existingPayment
      }, { status: 409 });
    }

    // Get semester fee details
    const { data: semesterFee, error: feeError } = await supabase
      .from('semester_fees')
      .select(`
        id,
        semester_fee,
        effective_from,
        effective_until,
        allocated_route_id
      `)
      .eq('id', semesterFeeId)
      .eq('is_active', true)
      .single();
      
    if (feeError || !semesterFee) {
      return NextResponse.json({ error: 'Semester fee not found or inactive' }, { status: 404 });
    }
    
    // Get route details separately
    const { data: routeDetails, error: routeError } = await supabase
      .from('routes')
      .select('route_number, route_name')
      .eq('id', semesterFee.allocated_route_id)
      .single();

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('full_name, roll_number, email, mobile')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Create payment request object (this would typically be sent to a payment gateway)
    const paymentRequest = {
      paymentId: `PAY_${Date.now()}_${studentId.slice(-6)}`,
      studentId: studentId,
      studentName: student.full_name,
      studentRollNumber: student.roll_number,
      studentEmail: student.email,
      studentMobile: student.mobile,
      routeId: routeId,
      routeName: routeDetails?.route_name || 'Unknown Route',
      routeNumber: routeDetails?.route_number || 'N/A',
      stopName: stopName,
      academicYear: semester.academic_year,
      semester: semester.semester,
      semesterFeeId: semesterFeeId,
      amount: semesterFee.semester_fee,
      paymentMethod: paymentMethod, // Use the payment method from the request
      validFrom: semesterFee.effective_from,
      validUntil: semesterFee.effective_until,
      createdAt: new Date().toISOString()
    };

    return NextResponse.json(paymentRequest, { status: 200 });
  } catch (error) {
    console.error('Error in semester payments POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Confirm payment (after payment gateway response)
export async function PUT(request: NextRequest) {
  try {
    const { 
      paymentId,
      paymentStatus,
      transactionId,
      amountPaid,
      semesterFeeId,
      routeId,
      stopName,
      studentId,
      paymentMethod
    } = await request.json();

    console.log('PUT request received with data:', {
      paymentId,
      paymentStatus,
      transactionId,
      amountPaid,
      semesterFeeId,
      routeId,
      stopName,
      studentId,
      paymentMethod
    });

    if (!paymentId || !paymentStatus) {
      console.error('Missing required fields:', { paymentId, paymentStatus });
      return NextResponse.json({ 
        error: 'Payment ID and status are required' 
      }, { status: 400 });
    }

    if (paymentStatus === 'success' && (!routeId || !stopName || !studentId || !semesterFeeId)) {
      console.error('Missing required fields for successful payment:', { 
        routeId, stopName, studentId, semesterFeeId 
      });
      return NextResponse.json({ 
        error: 'Route ID, stop name, student ID, and semester fee ID are required for successful payments' 
      }, { status: 400 });
    }

    if (paymentStatus === 'success') {
      // Get current semester info - simplified approach
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      let semester;
      if (month >= 6 && month <= 11) {
        // First semester (June-November)
        semester = {
          academic_year: `${year}-${String(year + 1).slice(-2)}`,
          semester: '1'
        };
      } else {
        // Second semester (December-May)
        const academicStartYear = month >= 12 ? year : year - 1;
        semester = {
          academic_year: `${academicStartYear}-${String(academicStartYear + 1).slice(-2)}`,
          semester: '2'
        };
      }

      // Get semester fee details
      const { data: semesterFee, error: semesterFeeError } = await supabase
        .from('semester_fees')
        .select('semester_fee, effective_from, effective_until')
        .eq('id', semesterFeeId)
        .single();

      if (semesterFeeError) {
        console.error('Error fetching semester fee:', semesterFeeError);
        return NextResponse.json({ 
          error: 'Failed to fetch semester fee details',
          details: semesterFeeError.message 
        }, { status: 500 });
      }

      if (!semesterFee) {
        console.error('Semester fee not found for ID:', semesterFeeId);
        return NextResponse.json({ error: 'Semester fee not found' }, { status: 404 });
      }

      // Generate receipt number
      const { data: receiptResult } = await supabase
        .rpc('generate_receipt_number');

      const receiptNumber = receiptResult;

      // Create payment record
      const paymentData = {
        student_id: studentId,
        allocated_route_id: routeId,
        stop_name: stopName,
        academic_year: semester.academic_year,
        semester: semester.semester,
        semester_fee_id: semesterFeeId,
        amount_paid: amountPaid,
        payment_method: paymentMethod || 'upi', // Use selected payment method or default to UPI
        transaction_id: transactionId,
        receipt_number: receiptNumber,
        payment_status: 'confirmed',
        valid_from: semesterFee.effective_from,
        valid_until: semesterFee.effective_until
      };

      const { data: newPayment, error: paymentError } = await supabase
        .from('semester_payments')
        .insert(paymentData)
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        console.error('Payment data that failed:', paymentData);
        return NextResponse.json({ 
          error: 'Failed to create payment record',
          details: paymentError.message 
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Payment confirmed successfully',
        payment: newPayment
      }, { status: 200 });
    }

    // For failed payments, just log and return status
    return NextResponse.json({
      message: `Payment ${paymentStatus}`,
      paymentId: paymentId
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in semester payments PUT:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 
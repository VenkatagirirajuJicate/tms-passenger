import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { createPaymentOrder, RAZORPAY_CONFIG } from '@/lib/razorpay';

const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    const { 
      studentId, 
      semesterFeeId,
      routeId,
      stopName,
      paymentMethod 
    } = await request.json();

    console.log('Creating payment order for:', { studentId, semesterFeeId, routeId });

    // Validate required fields
    if (!studentId || !semesterFeeId || !routeId || !stopName) {
      return NextResponse.json({ 
        error: 'Student ID, semester fee ID, route ID, and stop name are required' 
      }, { status: 400 });
    }

    // Get current semester info
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    let semester;
    if (month >= 6 && month <= 11) {
      semester = {
        academic_year: `${year}-${String(year + 1).slice(-2)}`,
        semester: '1'
      };
    } else {
      const academicStartYear = month >= 12 ? year : year - 1;
      semester = {
        academic_year: `${academicStartYear}-${String(academicStartYear + 1).slice(-2)}`,
        semester: '2'
      };
    }

    // Check if payment already exists - check ALL statuses, not just confirmed
    const { data: existingPayment, error: existingError } = await supabase
      .from('semester_payments')
      .select('id, payment_status, razorpay_order_id, created_at')
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
      if (existingPayment.payment_status === 'confirmed') {
        return NextResponse.json({ 
          error: 'Payment already completed for this semester',
          existingPayment 
        }, { status: 409 });
      }
      
      // If there's a pending payment, delete it and create a new one
      // This handles cases where payment was initiated but not completed
      if (existingPayment.payment_status === 'pending') {
        console.log('Found existing pending payment, removing it:', existingPayment.id);
        
        const { error: deleteError } = await supabase
          .from('semester_payments')
          .delete()
          .eq('id', existingPayment.id);
        
        if (deleteError) {
          console.error('Error deleting pending payment:', deleteError);
          return NextResponse.json({ 
            error: 'Failed to cleanup existing payment. Please try again.',
            details: deleteError.message 
          }, { status: 500 });
        }
        
        console.log('Successfully removed pending payment');
      }
    }

    // Get semester fee details
    const { data: semesterFee, error: feeError } = await supabase
      .from('semester_fees')
      .select('*')
      .eq('id', semesterFeeId)
      .eq('is_active', true)
      .single();
      
    if (feeError || !semesterFee) {
      console.error('Semester fee not found:', feeError);
      return NextResponse.json({ error: 'Semester fee not found or inactive' }, { status: 404 });
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get route details
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .single();

    if (routeError || !route) {
      console.error('Route not found:', routeError);
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Generate receipt number
    const receiptNumber = `TMS_${Date.now()}_${studentId.slice(-6)}`;

    // Check if demo mode is enabled
    const isDemo = process.env.DEMO_MODE === 'true';
    
    let order;
    if (isDemo) {
      // Demo mode - create mock order
      order = {
        id: `order_demo_${Date.now()}`,
        amount: semesterFee.semester_fee * 100,
        currency: RAZORPAY_CONFIG.currency,
        receipt: receiptNumber,
        status: 'created',
        notes: {
          student_id: studentId,
          student_name: student.full_name || student.student_name || 'Student',
          route_id: routeId,
          semester_fee_id: semesterFeeId,
          academic_year: semester.academic_year,
          semester: semester.semester
        }
      };
      console.log('Demo mode: Created mock order:', order);
    } else {
      // Real Razorpay order
      const orderData = {
        amount: semesterFee.semester_fee * 100, // Convert to paisa
        currency: RAZORPAY_CONFIG.currency,
        receipt: receiptNumber,
        notes: {
          student_id: studentId,
          student_name: student.full_name || student.student_name || 'Student',
          route_id: routeId,
          semester_fee_id: semesterFeeId,
          academic_year: semester.academic_year,
          semester: semester.semester
        }
      };

      const orderResult = await createPaymentOrder(orderData);

      if (!orderResult.success || !orderResult.order) {
        console.error('Failed to create Razorpay order:', orderResult.error);
        return NextResponse.json({ 
          error: 'Failed to create payment order',
          details: orderResult.error 
        }, { status: 500 });
      }

      order = orderResult.order;
    }

    // Store payment initiation in database
    const paymentRecord = {
      student_id: studentId,
      allocated_route_id: routeId,
      stop_name: stopName,
      academic_year: semester.academic_year,
      semester: semester.semester,
      semester_fee_id: semesterFeeId,
      amount_paid: semesterFee.semester_fee,
      payment_method: paymentMethod || 'razorpay',
      payment_status: 'pending',
      receipt_number: receiptNumber,
      razorpay_order_id: order.id,
      valid_from: semesterFee.effective_from,
      valid_until: semesterFee.effective_until
    };

    const { data: newPayment, error: paymentError } = await supabase
      .from('semester_payments')
      .insert(paymentRecord)
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return NextResponse.json({ 
        error: 'Failed to create payment record',
        details: paymentError.message 
      }, { status: 500 });
    }

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      order: order,
      isDemo: isDemo,
      paymentConfig: {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: RAZORPAY_CONFIG.company_name,
        description: `Transport Fee - ${semester.academic_year} Semester ${semester.semester}`,
        order_id: order.id,
        receipt: receiptNumber,
        prefill: {
          name: student.full_name || student.student_name || 'Student',
          email: student.email || '',
          contact: student.mobile || ''
        },
        notes: order.notes,
        theme: {
          color: RAZORPAY_CONFIG.theme_color
        }
      },
      studentData: {
        studentName: student.full_name || student.student_name || 'Student',
        studentEmail: student.email || '',
        studentMobile: student.mobile || '',
        routeName: route.route_name,
        routeNumber: route.route_number,
        stopName: stopName,
        academicYear: semester.academic_year,
        semester: semester.semester,
        amount: semesterFee.semester_fee
      },
      paymentId: newPayment.id
    }, { status: 200 });

  } catch (error) {
    console.error('Error in create payment order:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
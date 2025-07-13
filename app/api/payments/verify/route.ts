import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { verifyPaymentSignature, getPaymentDetails } from '@/lib/razorpay';

const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    const { 
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId, // Our internal payment ID
      isDemo
    } = await request.json();

    console.log('Payment verification request:', {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
      isDemo
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ 
        error: 'Missing required payment verification data' 
      }, { status: 400 });
    }

    // Handle demo mode
    if (isDemo || process.env.DEMO_MODE === 'true') {
      console.log('Demo mode: Simulating payment verification');
      
      // Create mock receipt data for demo
      const mockReceiptData = {
        studentName: 'Demo Student',
        routeName: 'DEMO ROUTE - College to City',
        routeNumber: 'RT001',
        stopName: 'City Center Stop',
        amount: 10000,
        receiptNumber: `TMS_${Date.now()}_demo`,
        paymentDate: new Date().toISOString(),
        academicYear: '2025-26',
        semester: '1',
        validFrom: '2025-01-01',
        validUntil: '2025-06-30',
        paymentMethod: 'demo_upi'
      };

      // Return success response for demo
      return NextResponse.json({
        success: true,
        message: 'Demo payment verified successfully',
        receiptData: mockReceiptData,
        payment: {
          id: paymentId,
          payment_status: 'confirmed',
          amount_paid: 10000,
          payment_method: 'demo',
          receipt_number: mockReceiptData.receiptNumber,
          payment_date: mockReceiptData.paymentDate
        },
        razorpayPayment: {
          id: razorpay_payment_id,
          amount: 1000000,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          created_at: Math.floor(Date.now() / 1000)
        }
      }, { status: 200 });
    } else {
      // Verify payment signature with Razorpay
      const isValidSignature = verifyPaymentSignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!isValidSignature) {
        console.error('Invalid payment signature');
        
        // Update payment record as failed
        if (paymentId) {
          await supabase
            .from('semester_payments')
            .update({ 
              payment_status: 'failed',
              failure_reason: 'Invalid payment signature',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentId);
        }
        
        return NextResponse.json({ 
          error: 'Payment verification failed - invalid signature' 
        }, { status: 400 });
      }
    }

    // Get payment details from Razorpay or create mock details for demo
    let razorpayPayment;
    
    if (isDemo || process.env.DEMO_MODE === 'true') {
      // Use mock payment details for demo mode
      razorpayPayment = {
        id: razorpay_payment_id,
        amount: 1000000, // Will be updated with actual amount from payment record
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        created_at: Math.floor(Date.now() / 1000)
      };
      console.log('Demo mode: Using mock payment details');
    } else {
      // Get real payment details from Razorpay
      const paymentDetailsResult = await getPaymentDetails(razorpay_payment_id);
      
      if (!paymentDetailsResult.success) {
        console.error('Failed to fetch payment details:', paymentDetailsResult.error);
        return NextResponse.json({ 
          error: 'Failed to fetch payment details',
          details: paymentDetailsResult.error 
        }, { status: 500 });
      }

      razorpayPayment = paymentDetailsResult.payment;
      
      if (!razorpayPayment) {
        console.error('Payment details not found in Razorpay response');
        return NextResponse.json({ 
          error: 'Payment details not found' 
        }, { status: 404 });
      }
    }
    
    console.log('Razorpay payment details:', razorpayPayment);

    // Find the payment record in our database
    let paymentRecord;
    if (paymentId) {
      // Use internal payment ID if provided
      const { data, error } = await supabase
        .from('semester_payments')
        .select('*')
        .eq('id', paymentId)
        .single();
      
      if (error) {
        console.error('Error fetching payment by ID:', error);
      } else {
        paymentRecord = data;
      }
    }

    if (!paymentRecord) {
      // Fallback: search by Razorpay order ID
      const { data, error } = await supabase
        .from('semester_payments')
        .select('*')
        .eq('razorpay_order_id', razorpay_order_id)
        .single();
      
      if (error) {
        console.error('Error fetching payment by order ID:', error);
        return NextResponse.json({ 
          error: 'Payment record not found',
          details: error.message 
        }, { status: 404 });
      }
      
      paymentRecord = data;
    }

    console.log('Found payment record:', paymentRecord);

    // Update amount for demo mode
    if (isDemo || process.env.DEMO_MODE === 'true') {
      razorpayPayment.amount = paymentRecord.amount_paid * 100; // Match expected amount
    }

    // Verify payment status and amount
    const isPaymentCaptured = razorpayPayment.status === 'captured';
    const amountMatches = razorpayPayment.amount === (paymentRecord.amount_paid * 100); // Razorpay amount is in paisa

    console.log('Payment verification checks:', {
      isPaymentCaptured,
      amountMatches,
      razorpayAmount: razorpayPayment.amount,
      expectedAmount: paymentRecord.amount_paid * 100,
      isDemo: isDemo || process.env.DEMO_MODE === 'true'
    });

    if (!isPaymentCaptured) {
      // Update payment as failed
      await supabase
        .from('semester_payments')
        .update({ 
          payment_status: 'failed',
          failure_reason: `Payment status: ${razorpayPayment.status}`,
          razorpay_payment_id: razorpay_payment_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

      return NextResponse.json({ 
        error: 'Payment not captured successfully',
        status: razorpayPayment.status 
      }, { status: 400 });
    }

    if (!amountMatches) {
      console.error('Payment amount mismatch:', {
        received: razorpayPayment.amount,
        expected: paymentRecord.amount_paid * 100
      });
      
      // Update payment as failed due to amount mismatch
      await supabase
        .from('semester_payments')
        .update({ 
          payment_status: 'failed',
          failure_reason: 'Amount mismatch',
          razorpay_payment_id: razorpay_payment_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentRecord.id);

      return NextResponse.json({ 
        error: 'Payment amount mismatch' 
      }, { status: 400 });
    }

    // Payment is valid - update the record
    const updateData = {
      payment_status: 'confirmed',
      razorpay_payment_id: razorpay_payment_id,
      transaction_id: razorpay_payment_id,
      payment_date: new Date(razorpayPayment.created_at * 1000).toISOString(), // Convert Unix timestamp
      updated_at: new Date().toISOString(),
      payment_method: razorpayPayment.method || 'razorpay'
    };

    const { data: updatedPayment, error: updateError } = await supabase
      .from('semester_payments')
      .update(updateData)
      .eq('id', paymentRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment record:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update payment record',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('Payment verified and updated successfully:', updatedPayment);

    // Get student and route details for receipt
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('id', paymentRecord.student_id)
      .single();

    const { data: routeData } = await supabase
      .from('routes')
      .select('*')
      .eq('id', paymentRecord.allocated_route_id)
      .single();

    const receiptData = {
      studentName: studentData?.full_name || studentData?.student_name || 'Student',
      routeName: routeData?.route_name || 'Route',
      routeNumber: routeData?.route_number || 'N/A',
      stopName: paymentRecord.stop_name,
      amount: paymentRecord.amount_paid,
      receiptNumber: paymentRecord.receipt_number,
      paymentDate: updatedPayment.payment_date,
      academicYear: paymentRecord.academic_year,
      semester: paymentRecord.semester,
      validFrom: paymentRecord.valid_from,
      validUntil: paymentRecord.valid_until,
      paymentMethod: updatedPayment.payment_method
    };

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment: updatedPayment,
      receiptData: receiptData,
      razorpayPayment: {
        id: razorpayPayment.id,
        amount: razorpayPayment.amount,
        currency: razorpayPayment.currency,
        status: razorpayPayment.status,
        method: razorpayPayment.method,
        created_at: razorpayPayment.created_at
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in payment verification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 
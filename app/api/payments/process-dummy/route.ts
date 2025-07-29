import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

// POST - Process dummy payment (simulate payment gateway)
export async function POST(request: NextRequest) {
  try {
    const { paymentId, mockResult = 'success' } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('semester_payments')
      .select(`
        id,
        student_id,
        semester_fee_id,
        allocated_route_id,
        stop_name,
        academic_year,
        semester,
        payment_type,
        covers_terms,
        amount_paid,
        payment_method,
        valid_from,
        valid_until
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock transaction details
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const receiptNumber = `RCP_${payment.academic_year}_${payment.semester}_${Date.now().toString().slice(-6)}`;
    
    // Determine receipt color based on payment type and term
    let receiptColor = 'white';
    if (payment.payment_type === 'full_year') {
      receiptColor = 'green';
    } else {
      switch (payment.semester) {
        case '1': receiptColor = 'white'; break;
        case '2': receiptColor = 'blue'; break;
        case '3': receiptColor = 'yellow'; break;
      }
    }

    let updateResult;
    let receiptResult;

    if (mockResult === 'success') {
      // Update payment status to confirmed
      const { data: updatedPayment, error: updateError } = await supabase
        .from('semester_payments')
        .update({
          payment_status: 'confirmed',
          transaction_id: transactionId,
          receipt_number: receiptNumber,
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating payment:', updateError);
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
      }

      updateResult = updatedPayment;

      // Create receipt record
      const { data: receipt, error: receiptError } = await supabase
        .from('payment_receipts')
        .insert({
          semester_payment_id: paymentId,
          receipt_number: receiptNumber,
          receipt_color: receiptColor,
          receipt_date: new Date().toISOString(),
          student_id: payment.student_id,
          amount: payment.amount_paid,
          payment_type: payment.payment_type,
          covers_terms: payment.covers_terms,
          academic_year: payment.academic_year,
          route_id: payment.allocated_route_id,
          stop_name: payment.stop_name,
          valid_from: payment.valid_from,
          valid_until: payment.valid_until,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (receiptError) {
        console.error('Error creating receipt:', receiptError);
        // Don't fail the payment if receipt creation fails
      }

      receiptResult = receipt;

      return NextResponse.json({
        success: true,
        status: 'confirmed',
        transactionId: transactionId,
        receiptNumber: receiptNumber,
        receiptColor: receiptColor,
        payment: updateResult,
        receipt: receiptResult,
        message: 'Payment processed successfully!',
        amount: payment.amount_paid,
        paymentType: payment.payment_type,
        coversTerms: payment.covers_terms,
        validPeriod: {
          from: payment.valid_from,
          until: payment.valid_until
        }
      });

    } else {
      // Simulate payment failure
      const { data: failedPayment, error: updateError } = await supabase
        .from('semester_payments')
        .update({
          payment_status: 'failed',
          transaction_id: transactionId,
          failure_reason: 'Simulated payment failure for testing',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating payment:', updateError);
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 });
      }

      return NextResponse.json({
        success: false,
        status: 'failed',
        transactionId: transactionId,
        payment: failedPayment,
        message: 'Payment failed. Please try again.',
        reason: 'Simulated failure for testing purposes'
      });
    }

  } catch (error) {
    console.error('Error processing dummy payment:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

// GET - Get payment processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    // Get payment with receipt information
    const { data: payment, error: paymentError } = await supabase
      .from('semester_payments')
      .select(`
        id,
        student_id,
        amount_paid,
        payment_status,
        payment_type,
        covers_terms,
        transaction_id,
        receipt_number,
        payment_date,
        failure_reason,
        valid_from,
        valid_until,
        academic_year,
        semester,
        stop_name
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Get receipt if payment is confirmed
    let receipt = null;
    if (payment.payment_status === 'confirmed' && payment.receipt_number) {
      const { data: receiptData } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('semester_payment_id', paymentId)
        .single();
      
      receipt = receiptData;
    }

    return NextResponse.json({
      payment,
      receipt,
      status: payment.payment_status
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    return NextResponse.json({ error: 'Failed to get payment status' }, { status: 500 });
  }
} 
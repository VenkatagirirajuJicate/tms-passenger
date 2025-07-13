import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import crypto from 'crypto';

const supabase = createClient();

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    console.log('Webhook received:', {
      hasSignature: !!signature,
      bodyLength: rawBody.length
    });

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && process.env.RAZORPAY_WEBHOOK_SECRET) {
      if (!signature) {
        console.error('Missing webhook signature');
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    // Parse webhook body
    const webhookData = JSON.parse(rawBody);
    const { event, payload } = webhookData;

    console.log('Webhook event:', event);
    console.log('Webhook payload:', payload);

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payment.entity);
        break;
      
      case 'payment.failed':
        await handlePaymentFailed(payload.payment.entity);
        break;
        
      case 'order.paid':
        await handleOrderPaid(payload.order.entity, payload.payment.entity);
        break;

      default:
        console.log('Unhandled webhook event:', event);
        break;
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });

  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      details: errorMessage 
    }, { status: 500 });
  }
}

async function handlePaymentCaptured(paymentData: { id: string; order_id: string; amount: number; status: string }) {
  try {
    console.log('Processing payment.captured webhook:', paymentData);

    const { id: razorpay_payment_id, order_id: razorpay_order_id, amount, status } = paymentData;
    console.log('Payment details:', { razorpay_payment_id, razorpay_order_id, amount, status });

    // Find the payment record in our database
    const { data: paymentRecord, error: findError } = await supabase
      .from('semester_payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found for order:', razorpay_order_id);
      return;
    }

    // Update payment record if not already confirmed
    if (paymentRecord.payment_status !== 'confirmed') {
      const updateData = {
        payment_status: 'confirmed',
        razorpay_payment_id: razorpay_payment_id,
        transaction_id: razorpay_payment_id,
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('semester_payments')
        .update(updateData)
        .eq('id', paymentRecord.id);

      if (updateError) {
        console.error('Error updating payment record via webhook:', updateError);
      } else {
        console.log('Payment confirmed via webhook:', paymentRecord.id);
      }
    }

  } catch (error) {
    console.error('Error handling payment.captured webhook:', error);
  }
}

async function handlePaymentFailed(paymentData: { order_id: string; error_code: string; error_description: string }) {
  try {
    console.log('Processing payment.failed webhook:', paymentData);

    const { order_id: razorpay_order_id, error_code, error_description } = paymentData;

    // Find and update the payment record
    const { data: paymentRecord, error: findError } = await supabase
      .from('semester_payments')
      .select('*')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (findError || !paymentRecord) {
      console.error('Payment record not found for failed payment:', razorpay_order_id);
      return;
    }

    // Update payment as failed
    const updateData = {
      payment_status: 'failed',
      failure_reason: `${error_code}: ${error_description}`,
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('semester_payments')
      .update(updateData)
      .eq('id', paymentRecord.id);

    if (updateError) {
      console.error('Error updating failed payment record:', updateError);
    } else {
      console.log('Payment marked as failed via webhook:', paymentRecord.id);
    }

  } catch (error) {
    console.error('Error handling payment.failed webhook:', error);
  }
}

async function handleOrderPaid(orderData: unknown, paymentData: { id: string; order_id: string; amount: number; status: string }) {
  try {
    console.log('Processing order.paid webhook:', orderData, paymentData);
    
    // This is a backup handler in case payment.captured is missed
    await handlePaymentCaptured(paymentData);

  } catch (error) {
    console.error('Error handling order.paid webhook:', error);
  }
} 
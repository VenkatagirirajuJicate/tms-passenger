import Razorpay from 'razorpay';
import crypto from 'crypto';

// Validate environment variables
function validateRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  console.log('Razorpay Config Check:', {
    hasKeyId: !!keyId,
    keyIdFormat: keyId ? (keyId.startsWith('rzp_') ? 'Valid' : 'Invalid format') : 'Missing',
    hasKeySecret: !!keySecret,
    keySecretLength: keySecret ? keySecret.length : 0
  });
  
  if (!keyId || !keySecret) {
    throw new Error('Missing Razorpay API keys. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.');
  }
  
  if (keyId === 'your_razorpay_key_id' || keyId === 'rzp_test_your_key_id_here') {
    throw new Error('Please replace placeholder Razorpay API keys with actual keys from https://dashboard.razorpay.com/app/keys');
  }
  
  return { keyId, keySecret };
}

// Initialize Razorpay instance with validation (only in production)
let razorpay: Razorpay | null = null;

try {
  const { keyId, keySecret } = validateRazorpayConfig();
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
} catch (error) {
  console.warn('Razorpay not configured:', error);
  // Don't throw error during build time
}

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  currency: 'INR',
  company_name: 'JKKN College of Engineering',
  company_logo: 'https://your-domain.com/logo.png', // Update with actual logo URL
  theme_color: '#2196F3'
};

// Interface definitions
export interface PaymentOrderData {
  amount: number; // Amount in paisa (multiply by 100)
  currency: string;
  receipt: string;
  notes: {
    student_id: string;
    student_name: string;
    route_id: string;
    semester_fee_id: string;
    academic_year: string;
    semester: string;
  };
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

// Create a payment order
export async function createPaymentOrder(orderData: PaymentOrderData) {
  try {
    if (!razorpay) {
      return { 
        success: false, 
        error: 'Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.' 
      };
    }

    console.log('Creating Razorpay order:', orderData);
    
    const order = await razorpay.orders.create({
      amount: orderData.amount, // Amount in paisa
      currency: orderData.currency,
      receipt: orderData.receipt,
      notes: orderData.notes,
      payment_capture: true // Auto capture payment
    });

    console.log('Razorpay order created:', order);
    return { success: true, order };
  } catch (error: any) {
    console.error('Failed to create Razorpay order:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create payment order' 
    };
  }
}

// Verify payment signature
export function verifyPaymentSignature(data: PaymentVerificationData): boolean {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
    
    // Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(body.toString())
      .digest('hex');

    console.log('Expected signature:', expectedSignature);
    console.log('Received signature:', razorpay_signature);

    return expectedSignature === razorpay_signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

// Get payment details from Razorpay
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    console.log('Payment details fetched:', payment);
    return { success: true, payment };
  } catch (error: any) {
    console.error('Failed to fetch payment details:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch payment details' 
    };
  }
}

// Refund payment
export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount, // Amount in paisa, if not provided will refund full amount
      speed: 'normal'
    });
    
    console.log('Payment refunded:', refund);
    return { success: true, refund };
  } catch (error: any) {
    console.error('Failed to refund payment:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to refund payment' 
    };
  }
}

// Generate payment configuration for frontend
export function getPaymentConfig(order: any, studentData: any) {
  return {
    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    amount: order.amount,
    currency: order.currency,
    name: RAZORPAY_CONFIG.company_name,
    description: `Transport Fee - ${studentData.academicYear} Semester ${studentData.semester}`,
    image: RAZORPAY_CONFIG.company_logo,
    order_id: order.id,
    receipt: order.receipt,
    prefill: {
      name: studentData.studentName,
      email: studentData.studentEmail,
      contact: studentData.studentMobile
    },
    notes: order.notes,
    theme: {
      color: RAZORPAY_CONFIG.theme_color
    },
    modal: {
      ondismiss: function() {
        console.log('Payment modal dismissed');
      }
    }
  };
}

export default razorpay; 
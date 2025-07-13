# Razorpay Payment Gateway Setup Guide

This guide will help you integrate Razorpay payment gateway for real-time semester fee payments.

## 🏦 Razorpay Account Setup

### 1. Create Razorpay Account
1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a new account or login to existing account
3. Complete KYC verification for live payments

### 2. Get API Keys
1. Go to **Settings** → **API Keys**
2. Generate new API Keys
3. Copy the **Key ID** and **Key Secret**
4. For testing, use **Test Mode** keys

## 🔧 Environment Configuration

### 1. Update Environment Variables
Add these variables to your `.env.local` file:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx

# For Production Webhooks
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

**Important Notes:**
- Use `rzp_test_` prefix for test keys
- Use `rzp_live_` prefix for production keys
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is safe to expose in frontend
- Never expose `RAZORPAY_KEY_SECRET` in frontend code

### 2. Database Migration
Run the database migration to add Razorpay fields:

```sql
-- Run this in your database (Supabase SQL Editor)
-- File: database-schema-razorpay-update.sql

ALTER TABLE semester_payments 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_semester_payments_razorpay_order_id 
ON semester_payments(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_semester_payments_razorpay_payment_id 
ON semester_payments(razorpay_payment_id);
```

## 🔗 Webhook Configuration (Production)

### 1. Setup Webhooks in Razorpay
1. Go to **Settings** → **Webhooks**
2. Click **Create Webhook**
3. Set URL: `https://your-domain.com/api/payments/webhook`
4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `order.paid`
5. Set **Active** to **Yes**
6. Save and copy the **Webhook Secret**

### 2. Add Webhook Secret to Environment
```bash
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

## 🧪 Testing Guide

### 1. Test Payment Flow
1. **Create Test Student**: Ensure you have a student with route allocation
2. **Access Payments**: Go to Dashboard → Payments
3. **Select Payment Method**: Choose any payment method (UPI, Card, etc.)
4. **Click Pay Now**: This will create a Razorpay order

### 2. Test Payment Methods

#### UPI Payments
```javascript
// Test UPI IDs for testing
UPI ID: success@razorpay
Result: Success

UPI ID: failure@razorpay  
Result: Failure
```

#### Card Payments
```javascript
// Test Card Details
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
Name: Any name
Result: Success

Card Number: 4000 0000 0000 0002
Result: Card declined
```

#### Net Banking
- Select any test bank
- Use credentials: `success` / `failure`

### 3. Payment Status Verification
After payment completion, verify:
- ✅ Payment status updated to 'confirmed'
- ✅ Transaction ID stored
- ✅ Receipt generated with QR code
- ✅ Student can download boarding pass

## 🚀 API Endpoints

### Create Payment Order
```bash
POST /api/payments/create-order
Content-Type: application/json

{
  "studentId": "uuid",
  "semesterFeeId": "uuid", 
  "routeId": "uuid",
  "stopName": "string",
  "paymentMethod": "razorpay"
}
```

### Verify Payment
```bash
POST /api/payments/verify
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "paymentId": "internal_uuid"
}
```

### Webhook Handler
```bash
POST /api/payments/webhook
Headers: x-razorpay-signature
Content-Type: application/json

{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": { ... }
    }
  }
}
```

## 🛡️ Security Features

### 1. Signature Verification
- All payments verified with HMAC SHA256 signatures
- Webhook signatures validated in production
- Amount verification against original order

### 2. Database Security
- Payment status tracked in database
- Duplicate payment prevention
- Transaction ID uniqueness enforced

### 3. Error Handling
- Comprehensive error logging
- Failed payment tracking
- Graceful error messages to users

## 💰 Payment Flow

### Frontend Flow
1. **User clicks "Pay Now"**
2. **Order created** via `/api/payments/create-order`
3. **Razorpay modal opens** with payment options
4. **User completes payment** on Razorpay
5. **Payment verified** via `/api/payments/verify`
6. **Success message** and receipt generated

### Backend Verification
1. **Signature verification** with Razorpay
2. **Payment status check** from Razorpay API
3. **Amount verification** against order
4. **Database update** with payment details
5. **Receipt generation** with QR code

## 🔍 Troubleshooting

### Common Issues

#### "Payment gateway not loaded"
- Check `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set
- Verify internet connection for Razorpay script
- Check browser console for errors

#### "Order creation failed"
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Check student has valid route allocation
- Ensure semester fee exists and is active

#### "Payment verification failed"
- Check webhook endpoint is accessible
- Verify signature validation
- Check database connection

### Debug Mode
Enable detailed logging:
```javascript
// Add to browser console for frontend debugging
window.localStorage.setItem('debug', 'razorpay:*');
```

## 📊 Production Checklist

- [ ] Live Razorpay account activated with KYC
- [ ] Live API keys configured in production environment
- [ ] Webhook URL configured and tested
- [ ] SSL certificate enabled for webhook security
- [ ] Database migration applied
- [ ] Payment flow tested end-to-end
- [ ] Error monitoring configured
- [ ] Receipt generation tested

## 💡 Best Practices

### 1. Amount Handling
- Always store amounts in paisa (multiply by 100)
- Verify amounts match between frontend and backend
- Handle currency conversion if needed

### 2. Error Handling
- Provide clear error messages to users
- Log all payment attempts for debugging
- Implement retry mechanisms for failed payments

### 3. Security
- Never log sensitive data (card numbers, etc.)
- Validate all payment data server-side
- Use HTTPS for all payment endpoints

### 4. User Experience
- Show loading states during payment processing
- Provide clear success/failure feedback
- Generate receipt immediately after payment

## 📞 Support

For Razorpay specific issues:
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Integration Guide](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Support Portal](https://razorpay.com/support/)

For application issues:
- Check console logs for errors
- Verify environment configuration
- Test with different payment methods 
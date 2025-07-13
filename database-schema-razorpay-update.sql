-- Add Razorpay integration fields to semester_payments table
-- Run this migration to support Razorpay payment gateway

ALTER TABLE semester_payments 
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_semester_payments_razorpay_order_id 
ON semester_payments(razorpay_order_id);

CREATE INDEX IF NOT EXISTS idx_semester_payments_razorpay_payment_id 
ON semester_payments(razorpay_payment_id);

-- Add comments for documentation
COMMENT ON COLUMN semester_payments.razorpay_order_id IS 'Razorpay order ID for tracking payment orders';
COMMENT ON COLUMN semester_payments.razorpay_payment_id IS 'Razorpay payment ID received after successful payment';
COMMENT ON COLUMN semester_payments.failure_reason IS 'Reason for payment failure if payment_status is failed';
COMMENT ON COLUMN semester_payments.payment_date IS 'Actual date when payment was completed'; 
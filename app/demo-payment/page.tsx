'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard, Check, Clock, Receipt } from 'lucide-react';

const DemoPaymentPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const handleDemoPayment = async () => {
    setIsProcessing(true);
    try {
      console.log('Starting demo payment...');
      
      // Step 1: Create demo payment order
      const orderResponse = await fetch('/api/test-payment-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'upi' })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      const orderData = await orderResponse.json();
      console.log('Demo order created:', orderData);

      // Step 2: Simulate payment processing
      toast.success('Demo mode: Payment will be simulated');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Simulate payment verification
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderData.order.id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'demo_signature',
          paymentId: orderData.paymentId,
          isDemo: true
        })
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        console.log('Payment verified:', verifyData);
        
        setPaymentSuccess(true);
        setReceiptData(verifyData.receiptData || {
          studentName: orderData.studentData.studentName,
          routeName: orderData.studentData.routeName,
          routeNumber: orderData.studentData.routeNumber,
          stopName: orderData.studentData.stopName,
          amount: orderData.studentData.amount,
          receiptNumber: orderData.order.receipt,
          paymentDate: new Date().toISOString(),
          academicYear: orderData.studentData.academicYear,
          semester: orderData.studentData.semester,
          paymentMethod: 'demo'
        });
        
        toast.success('Demo payment completed successfully!');
      } else {
        throw new Error('Payment verification failed');
      }

    } catch (error: any) {
      console.error('Demo payment error:', error);
      toast.error(error.message || 'Demo payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDemo = () => {
    setPaymentSuccess(false);
    setReceiptData(null);
  };

  if (paymentSuccess && receiptData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
              <p className="text-gray-600">Your transport fee has been paid successfully</p>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
              <h2 className="text-xl font-semibold mb-4">Transport Pass Receipt</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-100">Student:</span>
                  <div className="font-medium">{receiptData.studentName}</div>
                </div>
                <div>
                  <span className="text-blue-100">Route:</span>
                  <div className="font-medium">{receiptData.routeName}</div>
                </div>
                <div>
                  <span className="text-blue-100">Stop:</span>
                  <div className="font-medium">{receiptData.stopName}</div>
                </div>
                <div>
                  <span className="text-blue-100">Amount:</span>
                  <div className="font-medium">₹{receiptData.amount}</div>
                </div>
                <div>
                  <span className="text-blue-100">Academic Year:</span>
                  <div className="font-medium">{receiptData.academicYear}</div>
                </div>
                <div>
                  <span className="text-blue-100">Semester:</span>
                  <div className="font-medium">Semester {receiptData.semester}</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Receipt Number:</span>
                <span className="font-mono font-medium">{receiptData.receiptNumber}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Payment Date:</span>
                <span className="font-medium">{new Date(receiptData.paymentDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium capitalize">Demo Mode</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={resetDemo}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <Receipt className="w-4 h-4" />
                <span>Test Another Payment</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Demo Payment System</h1>
            <p className="text-gray-600">Test the complete payment flow</p>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-100">Student:</span>
                <span>Demo Student</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Route:</span>
                <span>College to City</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Stop:</span>
                <span>City Center</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Academic Year:</span>
                <span>2025-26</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-100">Semester:</span>
                <span>Semester 1</span>
              </div>
              <div className="border-t border-blue-400 pt-2 mt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total Amount:</span>
                  <span>₹10,000</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-800 font-medium">Demo Mode Active</p>
                <p className="text-yellow-700">This will simulate a payment without charging real money.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleDemoPayment}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing Demo Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                <span>Start Demo Payment</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              This demonstrates the complete payment flow including order creation, payment simulation, and receipt generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPaymentPage; 
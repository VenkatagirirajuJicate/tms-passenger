'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Smartphone,
  Building,
  Wallet,
  Eye,
  EyeOff,
  Download,
  ArrowLeft,
  Loader2,
  Receipt,
  Calendar,
  MapPin,
  DollarSign,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentOption {
  payment_type: string;
  term?: string;
  amount: number;
  description: string;
  period: string;
  covers_terms: string[];
  receipt_color: string;
  savings?: number;
}

interface DummyPaymentGatewayProps {
  isOpen: boolean;
  onClose: () => void;
  paymentOption: PaymentOption | null;
  paymentId: string | null;
  onPaymentComplete: (result: any) => void;
}

const DummyPaymentGateway: React.FC<DummyPaymentGatewayProps> = ({
  isOpen,
  onClose,
  paymentOption,
  paymentId,
  onPaymentComplete
}) => {
  const [currentStep, setCurrentStep] = useState<'method' | 'processing' | 'success' | 'failed'>('method');
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [mockFailure, setMockFailure] = useState(false);
  
  // Form states for card payment
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [showCvv, setShowCvv] = useState(false);

  const paymentMethods = [
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: Smartphone,
      description: 'Pay using any UPI app',
      processingTime: 'Instant',
      fee: 0,
      recommended: true
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay',
      processingTime: '2-3 minutes',
      fee: 1.5
    },
    {
      id: 'netbanking',
      name: 'Net Banking',
      icon: Building,
      description: 'Direct bank transfer',
      processingTime: '5-10 minutes',
      fee: 0.5
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: Wallet,
      description: 'Paytm, PhonePe, Amazon Pay',
      processingTime: 'Instant',
      fee: 0.3
    }
  ];

  const resetState = () => {
    setCurrentStep('method');
    setSelectedMethod('upi');
    setShowCardDetails(false);
    setProcessing(false);
    setPaymentResult(null);
    setMockFailure(false);
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardName('');
    setShowCvv(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const processPayment = async () => {
    if (!paymentId || !paymentOption) {
      toast.error('Payment information missing');
      return;
    }

    setProcessing(true);
    setCurrentStep('processing');

    try {
      // Call dummy payment processing API
      const response = await fetch('/api/payments/process-dummy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentId: paymentId,
          mockResult: mockFailure ? 'failure' : 'success'
        })
      });

      const result = await response.json();

      if (result.success) {
        setPaymentResult(result);
        setCurrentStep('success');
        toast.success('Payment completed successfully!');
        onPaymentComplete(result);
      } else {
        setPaymentResult(result);
        setCurrentStep('failed');
        toast.error('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setCurrentStep('failed');
      toast.error('Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const getReceiptColorClass = (color: string) => {
    const colorMap = {
      white: 'bg-gray-50 border-gray-300 text-gray-800',
      blue: 'bg-blue-50 border-blue-300 text-blue-800',
      yellow: 'bg-yellow-50 border-yellow-300 text-yellow-800',
      green: 'bg-green-50 border-green-300 text-green-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.white;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!isOpen || !paymentOption) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Secure Payment Gateway</h2>
              <p className="text-blue-100 text-sm mt-1">3-Term Transport Payment System</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Payment Summary */}
          <div className={`p-4 rounded-lg border-2 mb-6 ${getReceiptColorClass(paymentOption.receipt_color)}`}>
            <h3 className="font-semibold mb-3 flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Payment Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Payment Type:</span>
                <span className="font-medium">{paymentOption.description}</span>
              </div>
              <div className="flex justify-between">
                <span>Period Covered:</span>
                <span className="font-medium">{paymentOption.period}</span>
              </div>
              <div className="flex justify-between">
                <span>Terms Covered:</span>
                <span className="font-medium">{paymentOption.covers_terms.join(', ')}</span>
              </div>
              {paymentOption.savings && (
                <div className="flex justify-between text-green-600">
                  <span>Savings:</span>
                  <span className="font-bold">₹{paymentOption.savings}</span>
                </div>
              )}
              <div className="border-t border-current/20 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total Amount:</span>
                  <span className="text-xl font-bold">₹{paymentOption.amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          {currentStep === 'method' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  return (
                    <div
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{method.name}</h4>
                            {method.recommended && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{method.description}</p>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{method.processingTime}</span>
                            {method.fee > 0 && <span>+₹{method.fee} fee</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card Details Form */}
              {selectedMethod === 'card' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gray-50 p-4 rounded-lg space-y-4"
                >
                  <h4 className="font-medium">Card Details</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(formatExpiryDate(e.target.value))}
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CVV
                        </label>
                        <div className="relative">
                          <input
                            type={showCvv ? 'text' : 'password'}
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="123"
                            maxLength={4}
                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCvv(!showCvv)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCvv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        placeholder="JOHN DOE"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Test Controls */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Testing Controls
                </h4>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={mockFailure}
                      onChange={(e) => setMockFailure(e.target.checked)}
                      className="rounded border-yellow-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="text-yellow-700">Simulate Payment Failure</span>
                  </label>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Use this to test both success and failure scenarios in your application.
                </p>
              </div>

              {/* Security Notice */}
              <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <Shield className="w-4 h-4" />
                <span>Your payment is secured with 256-bit SSL encryption</span>
              </div>

              {/* Pay Button */}
              <button
                onClick={processPayment}
                disabled={processing}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>Pay ₹{paymentOption.amount}</span>
              </button>
            </motion.div>
          )}

          {/* Processing State */}
          {currentStep === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment...</h3>
              <p className="text-gray-600 mb-4">Please wait while we process your payment securely.</p>
              <div className="bg-gray-100 rounded-full h-2 mb-4">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3, ease: 'easeInOut' }}
                  className="bg-blue-600 h-2 rounded-full"
                />
              </div>
              <p className="text-sm text-gray-500">This may take a few moments...</p>
            </motion.div>
          )}

          {/* Success State */}
          {currentStep === 'success' && paymentResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">Your payment has been processed successfully.</p>
              
              {/* Receipt Preview */}
              <div className={`p-4 rounded-lg border-2 mb-6 text-left ${getReceiptColorClass(paymentResult.receiptColor)}`}>
                <h4 className="font-semibold mb-3 flex items-center">
                  <Receipt className="w-5 h-5 mr-2" />
                  Payment Receipt
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Receipt Number:</span>
                    <span className="font-mono font-medium">{paymentResult.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono font-medium">{paymentResult.transactionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-bold">₹{paymentResult.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Type:</span>
                    <span className="font-medium">{paymentResult.paymentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valid Period:</span>
                    <span className="font-medium">
                      {new Date(paymentResult.validPeriod.from).toLocaleDateString()} - {new Date(paymentResult.validPeriod.until).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Download receipt logic would go here
                    toast.success('Receipt download started');
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Receipt</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}

          {/* Failure State */}
          {currentStep === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-6">
                {paymentResult?.reason || 'Your payment could not be processed. Please try again.'}
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep('method')}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DummyPaymentGateway; 
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Declare Razorpay type for window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

import {
  CreditCard,
  Calendar,
  MapPin,
  Route as RouteIcon,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Download,
  Eye,
  Wallet,
  Smartphone,
  Building,
  Globe,
  DollarSign,
  Info,
  RefreshCw,
  Star,
  Shield,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

interface SemesterFee {
  id: string;
  route_id: string;
  allocated_route_id: string;
  stop_name: string;
  semester_fee: number;
  academic_year: string;
  semester: string;
  effective_from: string;
  effective_until: string;
  routes: {
    id: string;
    route_number: string;
    route_name: string;
    start_location: string;
    end_location: string;
  };
}

interface PaymentHistory {
  id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  payment_status: string;
  valid_from: string;
  valid_until: string;
  academic_year: string;
  semester: string;
  stop_name: string;
  routes: {
    route_number: string;
    route_name: string;
  };
}

interface PaymentGateway {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  processingFee: number;
  processingTime: string;
  enabled: boolean;
  recommended?: boolean;
}

const SemesterPaymentInterface = ({ studentId }: { studentId: string }) => {
  const [availableFees, setAvailableFees] = useState<SemesterFee[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pay');
  
  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<SemesterFee | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Receipt modal states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);

  const paymentGateways: PaymentGateway[] = [
    {
      id: 'upi',
      name: 'UPI',
      icon: Smartphone,
      description: 'Pay using any UPI app (GPay, PhonePe, Paytm)',
      processingFee: 0,
      processingTime: 'Instant',
      enabled: true,
      recommended: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, RuPay cards accepted',
      processingFee: 1.5,
      processingTime: '2-3 minutes',
      enabled: true
    },
    {
      id: 'net_banking',
      name: 'Net Banking',
      icon: Building,
      description: 'Direct bank transfer from your account',
      processingFee: 0.5,
      processingTime: '5-10 minutes',
      enabled: true
    },
    {
      id: 'wallet',
      name: 'Digital Wallet',
      icon: Wallet,
      description: 'Paytm, Amazon Pay, other wallets',
      processingFee: 0.3,
      processingTime: 'Instant',
      enabled: true
    }
  ];

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAvailableFees(),
        fetchPaymentHistory()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load payment information');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableFees = async () => {
    try {
      const response = await fetch(`/api/semester-payments-v2?studentId=${studentId}&type=available`);
      if (!response.ok) throw new Error('Failed to fetch available fees');
      
      const data = await response.json();
      setAvailableFees(data);
    } catch (error) {
      console.error('Error fetching available fees:', error);
      throw error;
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`/api/semester-payments-v2?studentId=${studentId}&type=history`);
      if (!response.ok) throw new Error('Failed to fetch payment history');
      
      const data = await response.json();
      setPaymentHistory(data);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!selectedFee || !selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Step 1: Create Razorpay payment order
      const paymentRequest = {
        studentId,
        routeId: selectedFee.allocated_route_id || selectedFee.route_id,
        stopName: selectedFee.stop_name,
        semesterFeeId: selectedFee.id,
        paymentMethod: selectedPaymentMethod
      };

      console.log('Creating payment order:', paymentRequest);

      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentRequest)
      });

      // Enhanced error handling
      if (!response.ok) {
        let errorData: any = {};
        let errorMessage = 'Failed to create payment order';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textResponse = await response.text();
            errorData = { error: textResponse || 'Non-JSON response received' };
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorData = { error: 'Failed to parse server response' };
        }

        console.error('Payment order creation failed:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          errorData
        });
        
        // Handle specific error cases
        if (response.status === 500) {
          errorMessage = errorData?.error || 'Server error occurred. Please try again.';
        } else if (response.status === 400) {
          errorMessage = errorData?.error || 'Invalid payment request. Please check your details.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (response.status === 404) {
          errorMessage = errorData?.error || 'Payment service not found. Please contact support.';
        } else {
          errorMessage = errorData?.error || `Payment failed with status ${response.status}`;
        }
        
        // Handle specific authentication errors
        if (errorData?.details && errorData.details.includes('Razorpay API keys')) {
          errorMessage = 'Payment system not configured. Please contact support.';
        }
        
        throw new Error(errorMessage);
      }

      const orderData = await response.json();
      console.log('Payment order created:', orderData);
      
      // Step 2: Handle demo mode or open Razorpay gateway
      if (orderData.isDemo) {
        console.log('Demo mode: Simulating payment');
        toast.success('Demo mode: Payment will be simulated');
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate successful payment verification
        const verificationData = {
          razorpay_order_id: orderData.order.id,
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'demo_signature',
          paymentId: orderData.paymentId,
          isDemo: true
        };
        
        await verifyPayment(verificationData, orderData.paymentId);
      } else {
        // Open Razorpay payment gateway
        await openRazorpayGateway(orderData);
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      
      // Enhanced error messaging
      let userMessage = 'Payment failed. Please try again.';
      
      if (error instanceof Error) {
        userMessage = error.message;
        
        // Handle specific error patterns
        if (error.message.includes('fetch')) {
          userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('JSON')) {
          userMessage = 'Server communication error. Please try again.';
        } else if (error.message.includes('timeout')) {
          userMessage = 'Request timeout. Please try again.';
        }
      }
      
      toast.error(userMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openRazorpayGateway = async (orderData: any) => {
    return new Promise((resolve, reject) => {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => openPayment();
        script.onerror = () => reject(new Error('Failed to load Razorpay script'));
        document.body.appendChild(script);
      } else {
        openPayment();
      }

      function openPayment() {
        const options = {
          ...orderData.paymentConfig,
          handler: function (response: any) {
            console.log('Payment successful:', response);
            verifyPayment(response, orderData.paymentId)
              .then(resolve)
              .catch(reject);
          },
          modal: {
            ondismiss: function () {
              console.log('Payment modal dismissed');
              reject(new Error('Payment cancelled by user'));
            }
          }
        };

        console.log('Opening Razorpay with options:', options);

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    });
  };

  const verifyPayment = async (razorpayResponse: any, paymentId: string) => {
    try {
      console.log('Verifying payment:', razorpayResponse);

      const verificationData = {
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        paymentId: paymentId,
        isDemo: razorpayResponse.isDemo
      };

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment verification failed');
      }

      const result = await response.json();
      console.log('Payment verified successfully:', result);

      toast.success('Payment successful! Your semester fee has been paid.');
      setShowPaymentModal(false);
      setSelectedFee(null);
      setSelectedPaymentMethod('');
      await fetchData(); // Refresh data

      return result;
    } catch (error) {
      console.error('Payment verification failed:', error);
      toast.error(error instanceof Error ? error.message : 'Payment verification failed');
      throw error;
    }
  };

  const handleDownloadReceipt = async (payment: PaymentHistory) => {
    try {
      const response = await fetch(`/api/semester-payments/receipt?paymentId=${payment.id}`);
      if (!response.ok) throw new Error('Failed to generate receipt');
      
      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transport-pass-${payment.receipt_number}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Transport pass downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  const handleViewReceipt = async (payment: PaymentHistory) => {
    try {
      const response = await fetch(`/api/semester-payments/receipt?paymentId=${payment.id}`);
      if (!response.ok) throw new Error('Failed to generate receipt');
      
      const htmlContent = await response.text();
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in a new tab
      const newWindow = window.open(url, '_blank');
      if (newWindow) {
        newWindow.focus();
      }
      
      // Clean up the URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error('Error viewing receipt:', error);
      toast.error('Failed to view receipt');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isPaymentValid = (payment: PaymentHistory) => {
    const now = new Date();
    const validUntil = new Date(payment.valid_until);
    return now <= validUntil && payment.payment_status === 'confirmed';
  };

  const getCurrentSemesterInfo = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    if (month >= 6 && month <= 11) {
      return {
        academicYear: `${year}-${String(year + 1).slice(-2)}`,
        semester: '1',
        name: 'First Semester'
      };
    } else {
      const academicStartYear = month >= 12 ? year : year - 1;
      return {
        academicYear: `${academicStartYear}-${String(academicStartYear + 1).slice(-2)}`,
        semester: '2',
        name: 'Second Semester'
      };
    }
  };

  const currentSemester = getCurrentSemesterInfo();
  const hasCurrentSemesterPayment = paymentHistory.some(payment => 
    payment.academic_year === currentSemester.academicYear && 
    payment.semester === currentSemester.semester &&
    isPaymentValid(payment)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Semester Payments</h1>
            <p className="text-blue-100 mt-1">Manage your transport fee payments</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Current Semester</div>
            <div className="text-lg font-semibold">{currentSemester.name}</div>
            <div className="text-sm text-blue-100">{currentSemester.academicYear}</div>
          </div>
        </div>
        
        {/* Payment Status Indicator */}
        <div className="mt-4 flex items-center space-x-2">
          {hasCurrentSemesterPayment ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-green-100">Payment completed for current semester</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 text-yellow-300" />
              <span className="text-yellow-100">Payment pending for current semester</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'pay', label: 'Make Payment', icon: CreditCard },
              { id: 'history', label: 'Payment History', icon: Receipt }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Make Payment Tab */}
          {activeTab === 'pay' && (
            <div className="space-y-6">
              {availableFees.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Payments Up to Date</h3>
                  <p className="text-gray-600">You have completed all required semester payments.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {availableFees.map((fee) => (
                    <motion.div
                      key={fee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <RouteIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {fee.routes.route_name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Route {fee.routes.route_number}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">Stop: {fee.stop_name}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Semester {fee.semester}, {fee.academic_year}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Valid till {new Date(fee.effective_until).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Semester Fee</span>
                              <span className="text-2xl font-bold text-green-600">₹{fee.semester_fee}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-6">
                          <button
                            onClick={() => {
                              setSelectedFee(fee);
                              setShowPaymentModal(true);
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Pay Now</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                  <p className="text-gray-600">Your payment history will appear here once you make payments.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <motion.div
                      key={payment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Receipt className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {payment.routes.route_name} - {payment.stop_name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Semester {payment.semester}, {payment.academic_year}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-medium text-gray-900 ml-1">₹{payment.amount_paid}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="font-medium text-gray-900 ml-1">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Method:</span>
                              <span className="font-medium text-gray-900 ml-1 capitalize">
                                {payment.payment_method.replace('_', ' ')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Receipt:</span>
                              <span className="font-medium text-gray-900 ml-1">{payment.receipt_number}</span>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(payment.payment_status)}`}>
                                {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                              </span>
                              {isPaymentValid(payment) && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Valid
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewReceipt(payment)}
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View Pass</span>
                              </button>
                              <button
                                onClick={() => handleDownloadReceipt(payment)}
                                className="text-green-600 hover:text-green-800 text-sm flex items-center space-x-1"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && selectedFee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Complete Payment</h2>
                <p className="text-gray-600 mt-1">Choose your preferred payment method</p>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Payment Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Route:</span>
                      <span className="font-medium">{selectedFee.routes.route_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stop:</span>
                      <span className="font-medium">{selectedFee.stop_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Academic Year:</span>
                      <span className="font-medium">{selectedFee.academic_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Semester:</span>
                      <span className="font-medium">Semester {selectedFee.semester}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total Amount:</span>
                        <span className="text-xl font-bold text-green-600">₹{selectedFee.semester_fee}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Select Payment Method</h3>
                  {paymentGateways.filter(gateway => gateway.enabled).map((gateway) => {
                    const Icon = gateway.icon;
                    const processingFeeAmount = (selectedFee.semester_fee * gateway.processingFee) / 100;
                    const totalAmount = selectedFee.semester_fee + processingFeeAmount;
                    
                    return (
                      <div
                        key={gateway.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPaymentMethod === gateway.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${gateway.recommended ? 'ring-2 ring-green-200' : ''}`}
                        onClick={() => setSelectedPaymentMethod(gateway.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              selectedPaymentMethod === gateway.id ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                selectedPaymentMethod === gateway.id ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{gateway.name}</span>
                                {gateway.recommended && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Star className="w-3 h-3 mr-1" />
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{gateway.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {gateway.processingFee > 0 ? (
                              <div>
                                <div className="text-sm text-gray-600">+₹{processingFeeAmount.toFixed(2)} fee</div>
                                <div className="font-medium text-gray-900">₹{totalAmount.toFixed(2)}</div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm text-green-600">No extra fee</div>
                                <div className="font-medium text-gray-900">₹{selectedFee.semester_fee}</div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                          <span>Processing time: {gateway.processingTime}</span>
                          <div className="flex items-center space-x-1">
                            <Shield className="w-3 h-3" />
                            <span>Secure</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedFee(null);
                    setSelectedPaymentMethod('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isProcessingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={!selectedPaymentMethod || isProcessingPayment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Pay Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Receipt</h2>
                  <p className="text-gray-600">Receipt #{selectedPayment.receipt_number}</p>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-medium">{selectedPayment.routes.route_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stop:</span>
                    <span className="font-medium">{selectedPayment.stop_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium">{selectedPayment.academic_year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Semester:</span>
                    <span className="font-medium">Semester {selectedPayment.semester}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Date:</span>
                    <span className="font-medium">{new Date(selectedPayment.payment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valid Until:</span>
                    <span className="font-medium">{new Date(selectedPayment.valid_until).toLocaleDateString()}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Amount Paid:</span>
                      <span className="text-xl font-bold text-green-600">₹{selectedPayment.amount_paid}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadReceipt(selectedPayment)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SemesterPaymentInterface; 
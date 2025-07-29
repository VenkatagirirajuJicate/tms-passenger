'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Receipt,
  Calendar,
  CheckCircle,
  ArrowRight,
  TestTube,
  Zap,
  Star,
  Target,
  Gift,
  TrendingUp,
  Award,
  Settings,
  RefreshCw,
  Eye
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import EnhancedPaymentInterface from '@/components/enhanced-payment-interface';
import PaymentHistoryViewer from '@/components/payment-history-viewer';

// Test student data
const TEST_STUDENT_ID = '3d32c417-1d35-495e-b911-822dfcbd9d1c';

const TestPaymentFlowPage = () => {
  const [activeTab, setActiveTab] = useState<'payments' | 'history' | 'demo'>('demo');
  const [isLoading, setIsLoading] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<any>(null);

  const handlePaymentInitiated = (paymentOption: any) => {
    console.log('Payment initiated:', paymentOption);
    setLastPaymentResult(paymentOption);
    toast.success(`Payment initiated for ${paymentOption.description}!`);
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    toast.error(error);
  };

  const refreshTestData = async () => {
    setIsLoading(true);
    try {
      // Simulate refreshing test data
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Test data refreshed!');
    } catch (error) {
      toast.error('Failed to refresh test data');
    } finally {
      setIsLoading(false);
    }
  };

  const testFeatures = [
    {
      title: '3-Term Payment System',
      description: 'Individual term payments with color-coded receipts',
      icon: CreditCard,
      color: 'bg-blue-50 border-blue-300 text-blue-800',
      features: [
        'Term 1 payments (White receipts)',
        'Term 2 payments (Blue receipts)', 
        'Term 3 payments (Yellow receipts)',
        'Individual term validity periods'
      ]
    },
    {
      title: 'Full Year Payment',
      description: 'Discounted full academic year payment option',
      icon: Gift,
      color: 'bg-green-50 border-green-300 text-green-800',
      features: [
        'Up to 5% discount on full year',
        'Green color-coded receipts',
        'Covers all three terms',
        'Extended validity period'
      ]
    },
    {
      title: 'Dummy Payment Gateway',
      description: 'Realistic payment simulation for testing',
      icon: TestTube,
      color: 'bg-purple-50 border-purple-300 text-purple-800',
      features: [
        'Multiple payment methods (UPI, Card, Net Banking)',
        'Success/failure simulation controls',
        'Real transaction IDs and receipts',
        'Processing animations and feedback'
      ]
    },
    {
      title: 'Payment History & Receipts',
      description: 'Complete payment tracking and receipt management',
      icon: Receipt,
      color: 'bg-yellow-50 border-yellow-300 text-yellow-800',
      features: [
        'Color-coded payment history',
        'Downloadable receipts',
        'Payment status tracking',
        'Validity period display'
      ]
    }
  ];

  const tabs = [
    { id: 'demo', label: 'Demo Features', icon: Star },
    { id: 'payments', label: 'Make Payment', icon: CreditCard },
    { id: 'history', label: 'Payment History', icon: Receipt }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <TestTube className="w-6 h-6 text-white" />
                </div>
                <span>3-Term Payment System Demo</span>
              </h1>
              <p className="text-gray-600 mt-2">Complete testing environment for transport payment workflow</p>
            </div>
            <button
              onClick={refreshTestData}
              disabled={isLoading}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex border-b">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {/* Demo Features Tab */}
            {activeTab === 'demo' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Testing Features Overview</h2>
                  <p className="text-gray-600 max-w-3xl mx-auto">
                    This demo environment showcases the complete 3-term transport payment system with 
                    realistic payment gateway simulation, receipt management, and payment history tracking.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-6 rounded-lg border-2 ${feature.color}`}
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-10 h-10 bg-current/20 rounded-lg flex items-center justify-center">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{feature.title}</h3>
                            <p className="text-sm opacity-75">{feature.description}</p>
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {feature.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="w-4 h-4 opacity-60" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Test Instructions */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span>Testing Instructions</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="font-medium text-blue-800">Step 1: Make Payments</div>
                      <p className="text-gray-700">
                        Use the "Make Payment" tab to test individual term payments or full year payments. 
                        Try both success and failure scenarios using the test controls.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-purple-800">Step 2: Review Gateway</div>
                      <p className="text-gray-700">
                        Experience the complete payment gateway flow with realistic payment methods, 
                        form validation, and processing animations.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-green-800">Step 3: View History</div>
                      <p className="text-gray-700">
                        Check the "Payment History" tab to see color-coded receipts, download functionality, 
                        and payment status tracking.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={() => setActiveTab('payments')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Start Testing Payments</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Receipt className="w-5 h-5" />
                    <span>View Payment History</span>
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Make Payment Tab */}
            {activeTab === 'payments' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">💳 Payment Interface</h2>
                  <p className="text-gray-600">Test the complete payment workflow with dummy gateway</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-800 mb-2">Test Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Student ID:</span> {TEST_STUDENT_ID}
                    </div>
                    <div>
                      <span className="font-medium">Route:</span> Route 6 (Pallipalayam)
                    </div>
                    <div>
                      <span className="font-medium">Academic Year:</span> 2025-26
                    </div>
                  </div>
                </div>

                <EnhancedPaymentInterface
                  studentId={TEST_STUDENT_ID}
                  onPaymentInitiated={handlePaymentInitiated}
                  onError={handlePaymentError}
                />

                {lastPaymentResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-green-50 border border-green-200 rounded-lg p-4"
                  >
                    <div className="flex items-center space-x-2 text-green-800">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Last Payment: {lastPaymentResult.description}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Payment History Tab */}
            {activeTab === 'history' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">📋 Payment History & Receipts</h2>
                  <p className="text-gray-600">View completed payments with color-coded receipts</p>
                </div>

                <PaymentHistoryViewer studentId={TEST_STUDENT_ID} />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
            <TestTube className="w-5 h-5" />
            <span className="font-medium">3-Term Payment System Test Environment</span>
          </div>
          <p className="text-sm text-gray-500">
            This is a complete testing environment showcasing the enhanced 3-term transport payment system 
            with dummy payment gateway integration, receipt management, and payment history tracking.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPaymentFlowPage; 
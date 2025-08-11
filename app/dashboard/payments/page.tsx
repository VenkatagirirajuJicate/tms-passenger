'use client';

import React, { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session';
import EnhancedPaymentInterface from '@/components/enhanced-payment-interface';
import PaymentHistoryViewer from '@/components/payment-history-viewer';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Check authentication using session manager
      if (!sessionManager.isAuthenticated()) {
        toast.error('Please login to continue');
        window.location.href = '/login';
        return;
      }

      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent) {
        toast.error('Invalid session data');
        window.location.href = '/login';
        return;
      }

      // Set student data from session
      setStudent({
        id: currentStudent.student_id,
        name: currentStudent.student_name
      });
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentInitiated = (paymentOption: any) => {
    toast.success('Payment initiated successfully!');
  };

  const handleError = (error: string) => {
    toast.error(error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600 mt-2">Please login to access payments</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">3-Term Payment System</h1>
              <p className="text-blue-100 mt-1 text-sm sm:text-base truncate">Manage your transport fee payments with flexible term options</p>
            </div>
            <div className="text-right min-w-0">
              <div className="text-xs sm:text-sm text-blue-100">Student</div>
              <div className="text-base sm:text-lg font-semibold truncate">{student.name}</div>
              <div className="text-xs sm:text-sm text-blue-100">Academic Year 2025-26</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
              {[
                { id: 'payments', label: 'Make Payment', icon: '💳' },
                { id: 'receipts', label: 'Payment History & Receipts', icon: '🧾' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'payments' && (
              <EnhancedPaymentInterface
                studentId={student.id}
                onPaymentInitiated={handlePaymentInitiated}
                onError={handleError}
              />
            )}
            
            {activeTab === 'receipts' && (
              <PaymentHistoryViewer studentId={student.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
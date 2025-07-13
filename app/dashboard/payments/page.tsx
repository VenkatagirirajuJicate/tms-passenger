'use client';

import React, { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session';
import SemesterPaymentInterface from '@/components/semester-payment-interface';
import toast from 'react-hot-toast';

export default function PaymentsPage() {
  const [student, setStudent] = useState<{ id: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <SemesterPaymentInterface studentId={student.id} />
      </div>
    </div>
  );
} 
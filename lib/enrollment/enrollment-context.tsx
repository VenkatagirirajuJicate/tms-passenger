'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export interface EnrollmentStatus {
  isEnrolled: boolean;
  enrollmentStatus: string;
  transportStatus: string;
  allocatedRouteId: string | null;
  boardingPoint: string | null;
  paymentStatus: string;
  outstandingAmount: number;
  hasActiveRequest: boolean;
  requestStatus: string | null;
  lastChecked: Date;
}

interface EnrollmentContextType {
  enrollmentStatus: EnrollmentStatus | null;
  isLoading: boolean;
  error: string | null;
  refreshEnrollmentStatus: () => Promise<void>;
  checkEnrollmentStatus: () => Promise<EnrollmentStatus | null>;
}

const EnrollmentContext = createContext<EnrollmentContextType | undefined>(undefined);

interface EnrollmentProviderProps {
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function EnrollmentProvider({ 
  children, 
  autoRefresh = true, 
  refreshInterval = 5 * 60 * 1000 // 5 minutes
}: EnrollmentProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEnrollmentStatus = async (): Promise<EnrollmentStatus | null> => {
    if (!isAuthenticated || !user) {
      console.log('🔍 Enrollment check: User not authenticated');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get student ID from user context - prioritize JWT sub field
      const studentId = (user as any)?.sub || 
                       (user as any)?.studentId || 
                       user.id;
      
      console.log('🔍 Checking enrollment status for student:', {
        finalStudentId: studentId,
        userSub: (user as any)?.sub,
        userStudentId: (user as any)?.studentId,
        userId: user.id,
        userEmail: user.email,
        fullUserObject: user
      });

      // Get the access token to include in the request
      const accessToken = localStorage.getItem('tms_access_token') || 
                         document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        console.log('🔑 Including access token in enrollment status request');
      } else {
        console.log('⚠️ No access token found for enrollment status request');
      }

      const response = await fetch(`/api/enrollment/status?studentId=${studentId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both success and "student not found" cases
      if (!data.success && data.debug?.error_code !== 'STUDENT_NOT_FOUND') {
        throw new Error(data.error || 'Failed to fetch enrollment status');
      }

      // For student not found, we still want to show the enrollment status
      // This allows users to see they need to enroll
      const studentData = data.student || {};
      const enrollmentData = data.enrollment || {};

      const status: EnrollmentStatus = {
        isEnrolled: studentData.transport_enrolled || enrollmentData.isEnrolled || false,
        enrollmentStatus: studentData.enrollment_status || enrollmentData.status || 'not_enrolled',
        transportStatus: studentData.transport_status || 'inactive',
        allocatedRouteId: studentData.allocated_route_id || enrollmentData.selectedRoute || null,
        boardingPoint: studentData.boarding_point || enrollmentData.selectedStop || null,
        paymentStatus: studentData.payment_status || enrollmentData.paymentStatus || 'pending',
        outstandingAmount: studentData.outstanding_amount || enrollmentData.pendingAmount || 0,
        hasActiveRequest: data.hasActiveRequest || false,
        requestStatus: data.activeRequest?.request_status || null,
        lastChecked: new Date()
      };

      console.log('✅ Enrollment status retrieved:', {
        isEnrolled: status.isEnrolled,
        enrollmentStatus: status.enrollmentStatus,
        hasActiveRequest: status.hasActiveRequest,
        requestStatus: status.requestStatus,
        studentFound: !!data.student,
        fallbackData: !data.success && data.debug?.error_code === 'STUDENT_NOT_FOUND'
      });

      // Show a warning if student was not found but we're using fallback data
      if (!data.success && data.debug?.error_code === 'STUDENT_NOT_FOUND') {
        console.warn('⚠️ Student record not found, using fallback enrollment data');
        setError('Student record not found. You can still enroll for transport services.');
      } else if (data.success && data.student && data.debug?.student_created) {
        console.log('✅ Student record was automatically created');
        // Clear any previous errors since we successfully created the student
        setError(null);
      }

      setEnrollmentStatus(status);
      return status;

    } catch (error) {
      console.error('❌ Error checking enrollment status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to check enrollment status';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshEnrollmentStatus = async (): Promise<void> => {
    await checkEnrollmentStatus();
  };

  // Initial check when user changes
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 User authenticated, checking enrollment status...');
      checkEnrollmentStatus();
    } else {
      console.log('🔄 User not authenticated, clearing enrollment status');
      setEnrollmentStatus(null);
      setError(null);
    }
  }, [isAuthenticated, user]);

  // Auto-refresh enrollment status
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !user) return;

    const refreshTimer = setInterval(async () => {
      console.log('🔄 Auto-refreshing enrollment status...');
      await checkEnrollmentStatus();
    }, refreshInterval);

    return () => clearInterval(refreshTimer);
  }, [autoRefresh, isAuthenticated, user, refreshInterval]);

  return (
    <EnrollmentContext.Provider
      value={{
        enrollmentStatus,
        isLoading,
        error,
        refreshEnrollmentStatus,
        checkEnrollmentStatus
      }}
    >
      {children}
    </EnrollmentContext.Provider>
  );
}

export function useEnrollment() {
  const context = useContext(EnrollmentContext);
  if (context === undefined) {
    throw new Error('useEnrollment must be used within an EnrollmentProvider');
  }
  return context;
}

// Convenience hooks
export function useEnrollmentStatus(): EnrollmentStatus | null {
  const { enrollmentStatus } = useEnrollment();
  return enrollmentStatus;
}

export function useIsEnrolled(): boolean {
  const { enrollmentStatus } = useEnrollment();
  return enrollmentStatus?.isEnrolled || false;
}

export function useHasActiveRequest(): boolean {
  const { enrollmentStatus } = useEnrollment();
  return enrollmentStatus?.hasActiveRequest || false;
}

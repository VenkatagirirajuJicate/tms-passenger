'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEnrollmentStatus } from './enrollment-context';
import toast from 'react-hot-toast';

interface UseEnrollmentGuardOptions {
  requiresEnrollment?: boolean;
  redirectTo?: string;
  showToast?: boolean;
  toastMessage?: string;
}

/**
 * Hook to guard pages that require enrollment
 * Redirects users to dashboard if they're not enrolled and try to access enrollment-required pages
 */
export function useEnrollmentGuard(options: UseEnrollmentGuardOptions = {}) {
  const {
    requiresEnrollment = true,
    redirectTo = '/dashboard',
    showToast = true,
    toastMessage = 'Please complete transport enrollment to access this feature'
  } = options;

  const router = useRouter();
  const enrollmentStatus = useEnrollmentStatus();

  useEffect(() => {
    if (!requiresEnrollment) return;

    // Wait for enrollment status to be loaded
    if (enrollmentStatus === null) return;

    if (!enrollmentStatus.isEnrolled) {
      if (showToast) {
        toast.error(toastMessage);
      }
      
      console.log('🚫 Access denied: User not enrolled, redirecting to dashboard');
      router.push(redirectTo);
    }
  }, [enrollmentStatus, requiresEnrollment, redirectTo, showToast, toastMessage, router]);

  return {
    isEnrolled: enrollmentStatus?.isEnrolled || false,
    enrollmentStatus,
    canAccess: !requiresEnrollment || (enrollmentStatus?.isEnrolled || false)
  };
}

/**
 * Component wrapper that guards enrollment-required pages
 */
export function EnrollmentGuard({ 
  children, 
  fallback,
  ...options 
}: UseEnrollmentGuardOptions & { 
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { canAccess, enrollmentStatus } = useEnrollmentGuard(options);

  // Show loading state while checking enrollment
  if (enrollmentStatus === null) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show fallback or redirect (handled by hook)
  if (!canAccess) {
    return fallback || (
      <div className="text-center py-12">
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}











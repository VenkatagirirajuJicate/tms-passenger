'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { GraduationCap, Car, AlertTriangle } from 'lucide-react';

interface StudentRouteGuardProps {
  children: React.ReactNode;
}

export default function StudentRouteGuard({ children }: StudentRouteGuardProps) {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Skip protection for driver routes and auth pages
    if (pathname?.startsWith('/driver') || 
        pathname?.startsWith('/auth') || 
        pathname?.startsWith('/no-oauth') ||
        pathname === '/login') {
      setIsAuthorized(true);
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      console.log('❌ Student access denied: Not authenticated');
      setAuthError('You must be logged in to access student features.');
      router.replace('/login');
      return;
    }

    // Check if user is a driver - redirect them to driver app
    if (userType === 'driver') {
      console.log('🚗 Driver detected trying to access student app, redirecting to driver app');
      setAuthError('You are logged in as a driver. Redirecting you to the driver application...');
      
      // Redirect to driver app after a short delay
      setTimeout(() => {
        router.replace('/driver');
      }, 2000);
      return;
    }

    // Check if user has student-specific data
    if (user) {
      const hasStudentRole = 'role' in user && user.role === 'student';
      const hasStudentData = 'studentId' in user || 
                           ('user_metadata' in user && (user as any).user_metadata?.student_id);

      if (!hasStudentRole && !hasStudentData && userType !== 'passenger') {
        console.log('❌ Student access denied - insufficient permissions:', { 
          hasRole: hasStudentRole, 
          hasData: hasStudentData,
          userType
        });
        setAuthError('Your account does not have the necessary permissions to access student features.');
        router.replace('/login');
        return;
      }
    }

    // All checks passed
    setIsAuthorized(true);
    setAuthError(null);
  }, [isAuthenticated, userType, isLoading, user, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 h-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Verifying student access...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    // Special handling for driver redirect
    if (authError.includes('driver') && authError.includes('redirecting')) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Car className="w-8 h-8 text-blue-600" />
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">Driver Detected</h2>
            <p className="text-gray-600 mb-6">{authError}</p>
            
            <div className="space-y-3">
              <button
                onClick={() => router.push('/driver')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Go to Driver App Now
              </button>
              
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
              >
                Switch to Student Account
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Regular access denied
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Go to Login
            </button>
            
            <button
              onClick={() => router.push('/driver/login')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Driver Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

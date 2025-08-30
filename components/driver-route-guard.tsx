'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

interface DriverRouteGuardProps {
  children: React.ReactNode;
}

export default function DriverRouteGuard({ children }: DriverRouteGuardProps) {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated and has driver role
    if (!isAuthenticated) {
      console.log('❌ Driver access denied: Not authenticated');
      setAuthError('You must be logged in to access driver features.');
      router.replace('/driver/login');
      return;
    }

    if (userType !== 'driver') {
      console.log('❌ Driver access denied: Wrong user type:', userType);
      setAuthError(`You are logged in as a ${userType}, but driver access requires a driver account.`);
      router.replace('/driver/login');
      return;
    }

    // Additional check: ensure user has driver-specific data
    if (user) {
      const hasDriverRole = 'role' in user && user.role === 'driver';
      const hasDriverData = 'driver_id' in user || 
                           ('user_metadata' in user && (user as any).user_metadata?.driver_id);

      if (!hasDriverRole && !hasDriverData) {
        console.log('❌ Driver access denied - insufficient permissions:', { 
          hasRole: hasDriverRole, 
          hasData: hasDriverData 
        });
        setAuthError('Your account does not have the necessary permissions to access driver features.');
        router.replace('/driver/login');
        return;
      }
    }

    // All checks passed
    setIsAuthorized(true);
    setAuthError(null);
  }, [isAuthenticated, userType, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Verifying driver access...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">{authError}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/driver/login')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Go to Driver Login
            </button>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Back to Main Login
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

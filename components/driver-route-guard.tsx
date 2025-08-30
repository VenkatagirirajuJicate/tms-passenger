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

  useEffect(() => {
    if (isLoading) return;

    // Check if user is authenticated and has driver role
    if (!isAuthenticated || userType !== 'driver') {
      console.log('❌ Driver access denied:', { isAuthenticated, userType });
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
        router.replace('/driver/login');
        return;
      }
    }

    setIsAuthorized(true);
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

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

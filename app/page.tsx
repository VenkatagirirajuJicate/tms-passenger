'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, userType } = useAuth();

  useEffect(() => {
    console.log('🏠 Home page render:', {
      isAuthenticated,
      isLoading,
      userType,
      hasUser: !!user,
      userEmail: user?.email,
      currentPath: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
    });

    // IMMEDIATE CHECK for driver cookies - redirect drivers before auth context loads
    if (typeof window !== 'undefined') {
      const driverUser = localStorage.getItem('tms_driver_user');
      const driverSession = localStorage.getItem('tms_driver_session');
      
      if (driverUser && driverSession) {
        console.log('🚗 Home page: Driver cookies detected, immediately redirecting to driver app');
        router.replace('/driver');
        return;
      }
    }

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Home page: Authentication check taking too long, forcing redirect to login');
        router.replace('/login');
      }
    }, 10000); // 10 second timeout

    if (!isLoading) {
      clearTimeout(timeout);
      
      if (isAuthenticated && user) {
        // IMMEDIATE REDIRECT for drivers - no delay
        if (userType === 'driver') {
          console.log('🚗 Home page: Driver detected, immediately redirecting to driver app');
          router.replace('/driver');
          return;
        }
        
        // For passengers/students, redirect to dashboard
        if (userType === 'passenger') {
          console.log('🔄 Home page: Passenger authenticated, redirecting to dashboard');
          router.replace('/dashboard');
          return;
        }
        
        // Fallback for other user types
        console.log('🔄 Home page: User authenticated, redirecting to dashboard');
        router.replace('/dashboard');
      } else {
        // Not authenticated, redirect to login
        // But check if we're already on a login page to avoid redirect loops
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
        if (!currentPath.includes('/login') && !currentPath.includes('/no-oauth')) {
          console.log('🔄 Home page: Not authenticated, redirecting to login');
          router.replace('/login');
        }
      }
    }

    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading, user, userType, router]);

  // Loading state while authentication is being determined
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        <div>
          <p className="text-gray-600 text-lg">MYJKKN TMS</p>
          <p className="text-gray-500 text-sm">
            {isLoading ? 'Checking authentication...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  );
}

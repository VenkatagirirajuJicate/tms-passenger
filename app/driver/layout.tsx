'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DriverNavigation from '@/components/driver-navigation';

// Driver layout with authentication protection
export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Skip auth check for driver login page
    if (typeof window !== 'undefined' && window.location.pathname === '/driver/login') {
      return;
    }

    // Check authentication for all other driver routes
    if (!isLoading && (!isAuthenticated || userType !== 'driver')) {
      console.log('❌ Driver layout: Access denied, redirecting to login', { isAuthenticated, userType });
      router.replace('/login');
    }
  }, [isAuthenticated, userType, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Skip auth check for driver login page
  if (typeof window !== 'undefined' && window.location.pathname === '/driver/login') {
    return <div className="driver-layout">{children}</div>;
  }

  // Only render children if authenticated as driver
  if (!isAuthenticated || userType !== 'driver') {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="driver-layout min-h-screen bg-gray-50">
      <DriverNavigation />
      <main className="lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sessionManager } from '@/lib/session';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (sessionManager.isAuthenticated()) {
          // User is authenticated, redirect to dashboard
          router.replace('/dashboard');
        } else {
          // User is not authenticated, redirect to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Loading state while checking authentication
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

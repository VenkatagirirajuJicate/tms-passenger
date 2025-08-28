'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { AutoLoginService, AutoLoginResult } from '@/lib/auth/auto-login-service';
import { GraduationCap, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface AutoLoginWrapperProps {
  children: React.ReactNode;
}

export default function AutoLoginWrapper({ children }: AutoLoginWrapperProps) {
  const [autoLoginState, setAutoLoginState] = useState<{
    loading: boolean;
    attempted: boolean;
    result?: AutoLoginResult;
    error?: string;
  }>({
    loading: true,
    attempted: false
  });

  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    const performAutoLogin = async () => {
      // Skip auto-login for certain pages
      const skipPages = ['/login', '/auth/callback', '/driver/login', '/no-oauth', '/driver-login'];
      if (skipPages.some(page => pathname.startsWith(page))) {
        console.log('🔄 Auto-login: Skipping for page:', pathname);
        setAutoLoginState({ loading: false, attempted: true });
        return;
      }

      // Skip if auth context is still loading
      if (authLoading) {
        console.log('🔄 Auto-login: Waiting for auth context...');
        return;
      }

      // If already authenticated through auth context, no need for auto-login
      if (isAuthenticated && user) {
        console.log('✅ Auto-login: Already authenticated via context');
        setAutoLoginState({ loading: false, attempted: true });
        return;
      }

      const autoLoginService = AutoLoginService.getInstance();
      
      // Check if we should attempt auto-login
      if (!autoLoginService.shouldAttemptAutoLogin()) {
        console.log('🔄 Auto-login: Skipping - already attempted');
        setAutoLoginState({ loading: false, attempted: true });
        return;
      }

      try {
        console.log('🔄 Auto-login: Starting attempt...');
        setAutoLoginState({ loading: true, attempted: false });

        const result = await autoLoginService.attemptAutoLogin();
        
        console.log('🔄 Auto-login: Result:', result);

        if (result.success && result.user) {
          console.log('✅ Auto-login: Success! Redirecting to dashboard...');
          
          // Small delay to show success state
          setAutoLoginState({ 
            loading: false, 
            attempted: true, 
            result 
          });

          // Redirect to dashboard after a brief moment
          setTimeout(() => {
            router.push('/dashboard');
          }, 500);
          
        } else if (result.needsLogin) {
          console.log('🔄 Auto-login: No valid session, redirecting to login...');
          setAutoLoginState({ 
            loading: false, 
            attempted: true, 
            result 
          });
          
          // Redirect to login if not already there and not on a login page
          const loginPages = ['/login', '/driver/login', '/no-oauth', '/driver-login'];
          if (!loginPages.some(page => pathname.startsWith(page))) {
            router.push('/login');
          }
        } else {
          // Some other state
          console.log('🔄 Auto-login: Completed with result:', result);
          setAutoLoginState({ 
            loading: false, 
            attempted: true, 
            result 
          });
        }

      } catch (error) {
        console.error('❌ Auto-login: Error:', error);
        setAutoLoginState({
          loading: false,
          attempted: true,
          error: error instanceof Error ? error.message : 'Auto-login failed'
        });

        // Redirect to login on error (but not if already on a login page)
        const loginPages = ['/login', '/driver/login', '/no-oauth', '/driver-login'];
        if (!loginPages.some(page => pathname.startsWith(page))) {
          router.push('/login');
        }
      }
    };

    performAutoLogin();
  }, [pathname, isAuthenticated, user, authLoading, router]);

  // Show loading screen during auto-login attempt
  if (autoLoginState.loading && !autoLoginState.attempted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 p-4 rounded-full shadow-lg">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Loading indicator */}
          <div className="space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Checking Authentication
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your login status...
              </p>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="space-y-2 text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <span>Checking stored credentials</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show success state briefly
  if (autoLoginState.result?.success && !autoLoginState.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          <div className="flex justify-center mb-8">
            <div className="bg-green-600 p-4 rounded-full shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome Back!
              </h2>
              <p className="text-gray-600">
                {autoLoginState.result.enhanced 
                  ? 'Login restored and profile updated'
                  : 'Login restored successfully'
                }
              </p>
            </div>
            
            {autoLoginState.result.user && (
              <div className="text-sm text-gray-600">
                <p>Logged in as: {autoLoginState.result.user.email}</p>
                {(autoLoginState.result.user as any).studentId && (
                  <p>Student ID: {(autoLoginState.result.user as any).studentId}</p>
                )}
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (autoLoginState.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 max-w-md">
          <div className="flex justify-center mb-8">
            <div className="bg-red-600 p-4 rounded-full shadow-lg">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Error
              </h2>
              <p className="text-gray-600 text-sm">
                {autoLoginState.error}
              </p>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  // Normal rendering after auto-login attempt
  return <>{children}</>;
}



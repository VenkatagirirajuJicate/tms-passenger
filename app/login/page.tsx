'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Car, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

type UserRole = 'passenger' | 'driver';

export default function LoginPage() {
  const { login, loginDriver, loginDriverDirect, loginDriverOAuth, isAuthenticated, isLoading, error, userType } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Combined useEffect for all initialization and redirect logic
  useEffect(() => {
    // Check for direct mode parameter
    const mode = searchParams?.get('mode');
    if (mode === 'direct') {
      setShowFallback(true);
      setSelectedRole('driver'); // Default to driver for direct mode
    }
    
    // Check if user is being redirected back from failed OAuth
    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const hasOAuthState = !!sessionStorage.getItem('oauth_state');
    const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
    
    // If user is coming back from MYJKKN/Google without completing OAuth, auto-trigger workaround
    if (referrer.includes('jkkn.ac.in') && hasOAuthState && isDriverOAuth) {
      console.log('🔄 Detected user redirected back from MYJKKN without completing OAuth');
      console.log('🔄 Auto-triggering OAuth workaround for seamless authentication...');
      
      // Automatically redirect to unified callback with recovery flag
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.append('recovery', 'myjkkn_redirect');
      callbackUrl.searchParams.append('state', sessionStorage.getItem('oauth_state') || '');
      
      // Small delay to show user what's happening
      setTimeout(() => {
        console.log('🔄 Redirecting to OAuth recovery...');
        window.location.href = callbackUrl.toString();
      }, 1000);
      
      return; // Don't process other logic
    }
    
    // Auto-redirect authenticated users
    if (isAuthenticated && !isLoading) {
      // If user is a driver, redirect them to driver app instead of student dashboard
      if (userType === 'driver') {
        console.log('🚗 Driver detected on student login page, redirecting to driver app');
        router.push('/driver');
        return;
      }
      
      const redirectPath = userType === 'driver' ? '/driver' : '/dashboard';
      console.log('✅ Login page: User authenticated, redirecting...', { userType, redirectPath });
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, userType, router, searchParams]);

  const handleLogin = () => {
    if (selectedRole === 'passenger') {
      login(); // Passenger OAuth login
    } else {
      loginDriverOAuth(); // Driver OAuth login
    }
  };

  const handleDriverLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackLoading(true);
    setFallbackError(null);

    try {
      const success = await loginDriver(email, password);
      
      if (success) {
        console.log('✅ Driver login successful, redirecting to driver dashboard');
        router.push('/driver');
      } else {
        // Error will be set by AuthContext
        console.log('❌ Driver login failed');
      }
    } catch (error) {
      setFallbackError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setFallbackLoading(false);
    }
  };

  const handleDriverDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackLoading(true);
    setFallbackError(null);

    try {
      const success = await loginDriverDirect(email, password);
      
      if (success) {
        console.log('✅ Driver direct login successful, redirecting to driver dashboard');
        router.push('/driver');
      } else {
        // Error will be set by AuthContext
        console.log('❌ Driver direct login failed');
      }
    } catch (error) {
      setFallbackError(error instanceof Error ? error.message : 'Driver direct login failed');
    } finally {
      setFallbackLoading(false);
    }
  };

  const handleFallbackLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFallbackLoading(true);
    setFallbackError(null);

    try {
      const response = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          app_id: process.env.NEXT_PUBLIC_APP_ID || 'transport_management_system_menrm674',
          api_key: process.env.NEXT_PUBLIC_API_KEY || 'app_e20655605d48ebce_cfa1ffe34268949a'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      // Store tokens and redirect
      if (typeof window !== 'undefined') {
        localStorage.setItem('tms_user', JSON.stringify(data.user));
        localStorage.setItem('tms_token_expires', data.session.expires_at);
        document.cookie = `tms_access_token=${data.access_token}; path=/; max-age=${data.expires_in}`;
        if (data.refresh_token) {
          document.cookie = `tms_refresh_token=${data.refresh_token}; path=/; max-age=${30 * 24 * 3600}`;
        }
      }

      router.push('/dashboard');
    } catch (error) {
      setFallbackError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setFallbackLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Transport Management System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            JKKN College Transport Portal
          </p>
        </div>

        {/* Error Display */}
        {(error || fallbackError) && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error || fallbackError}</div>
          </div>
        )}

        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          <div className="space-y-6">
            {!selectedRole ? (
              /* Role Selection */
              <>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Choose Your Role
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Select how you want to access the transport portal
                  </p>
                </div>
                
                <div className="space-y-4">
                  {/* Passenger Option */}
                  <button
                    onClick={() => setSelectedRole('passenger')}
                    className="group relative w-full flex items-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4 text-left">
                      <h4 className="text-lg font-medium text-gray-900">Passenger</h4>
                      <p className="text-sm text-gray-600">Students and staff members</p>
                    </div>
                  </button>
                  
                  {/* Driver Option */}
                  <button
                    onClick={() => setSelectedRole('driver')}
                    className="group relative w-full flex items-center p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors">
                      <Car className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4 text-left">
                      <h4 className="text-lg font-medium text-gray-900">Driver</h4>
                      <p className="text-sm text-gray-600">Bus drivers and transport staff</p>
                    </div>
                  </button>
                </div>
              </>
            ) : !showFallback ? (
              /* Authentication Method Selection */
              <>
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => setSelectedRole(null)}
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                </div>
                
                <div className="text-center">
                  <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
                    selectedRole === 'passenger' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {selectedRole === 'passenger' ? (
                      <Users className={`h-6 w-6 ${selectedRole === 'passenger' ? 'text-blue-600' : 'text-green-600'}`} />
                    ) : (
                      <Car className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedRole === 'passenger' ? 'Passenger Login' : 'Driver Login'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {selectedRole === 'passenger' 
                      ? 'Sign in with your MYJKKN account'
                      : 'Sign in with your MYJKKN account'
                    }
                  </p>
                </div>
                
                <button
                  onClick={handleLogin}
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    selectedRole === 'passenger' 
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' 
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Connecting...
                    </div>
                  ) : (
                    'Sign in with MYJKKN'
                  )}
                </button>
                
                <div className="text-center text-xs text-gray-500">
                  <p>You'll be redirected to MYJKKN for secure authentication</p>
                </div>

                {/* Alternative login option for both roles */}
                <div className="text-center border-t pt-4">
                  <button
                    onClick={() => setShowFallback(true)}
                    className={`text-sm underline ${
                      selectedRole === 'passenger' 
                        ? 'text-blue-600 hover:text-blue-500'
                        : 'text-green-600 hover:text-green-500'
                    }`}
                  >
                    {selectedRole === 'passenger' 
                      ? 'Having trouble? Try alternative login'
                      : 'Try direct login with enhanced authentication'
                    }
                  </button>
                </div>
              </>
            ) : (
              /* Login Form */
              <>
                <div className="flex items-center mb-4">
                  <button
                    onClick={() => setShowFallback(false)}
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </button>
                </div>
                
                <div className="text-center">
                  <div className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-4 ${
                    selectedRole === 'passenger' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {selectedRole === 'passenger' ? (
                      <Users className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Car className="h-6 w-6 text-green-600" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedRole === 'passenger' ? 'Alternative Login' : 'Direct Driver Login'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-6">
                    {selectedRole === 'passenger'
                      ? 'Sign in with your email and password'
                      : 'Enhanced authentication with parent app integration'
                    }
                  </p>
                </div>

                <form onSubmit={selectedRole === 'driver' ? handleDriverDirectLogin : handleFallbackLogin} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={fallbackLoading}
                    className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedRole === 'passenger'
                        ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                    }`}
                  >
                    {fallbackLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      selectedRole === 'passenger' ? 'Sign in as Passenger' : 'Sign in as Driver (Direct)'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center">
          <div className="mt-4 text-xs text-gray-500">
            <p>Need help? Contact your transport administrator</p>
            <p className="mt-1">
              Don't have a MYJKKN account? Contact the college administration
            </p>
            <div className="mt-2 space-x-4">
              <a
                href="/auth/diagnostic"
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Authentication Diagnostic
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/auth/debug-redirect"
                className="text-blue-600 hover:text-blue-500 underline"
              >
                Redirect Debug
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
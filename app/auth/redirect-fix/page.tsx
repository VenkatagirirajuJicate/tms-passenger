'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';

export default function AuthRedirectFix() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.log('🚫 OAuth Redirect Fix Page - Bypassing broken OAuth flow');
    
    // Clear any OAuth-related session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tms_oauth_role');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('post_login_redirect');
      console.log('🧹 Cleared OAuth session storage');
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log('🔄 Auto-redirecting to direct driver login...');
          router.push('/driver/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleDirectLogin = () => {
    console.log('🎯 User chose direct login - redirecting...');
    router.push('/driver/login');
  };

  const handleNoOAuth = () => {
    console.log('🏠 User chose no-OAuth landing - redirecting...');
    router.push('/no-oauth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="bg-white p-10 shadow-xl rounded-lg border border-red-200">
          <div className="mb-6">
            <AlertTriangle className="mx-auto h-16 w-16 text-red-500" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
            OAuth Authentication Issue
          </h1>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Parent App Database Error Detected
            </h2>
            <p className="text-red-700 text-sm">
              The MYJKKN authentication system has a database issue with NULL confirmation tokens. 
              This causes the OAuth flow to fail with "Authentication code missing" errors.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-green-800 mb-2 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Solution Available
            </h2>
            <p className="text-green-700 text-sm">
              Use direct authentication to bypass the OAuth issue and access the driver dashboard immediately.
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Automatically redirecting to direct login in <span className="font-bold text-red-600">{countdown}</span> seconds...
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleDirectLogin}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                🎯 Direct Driver Login
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
              
              <button
                onClick={handleNoOAuth}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                🏠 Alternative Options
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-gray-500">
            <p>
              <strong>Technical Details:</strong> Parent app error - "unable to fetch records: sql: Scan error on column index 3, name 'confirmation_token': converting NULL to string is unsupported"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

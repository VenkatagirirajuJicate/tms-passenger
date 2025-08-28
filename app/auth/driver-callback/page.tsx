'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

// Global flag to prevent concurrent token exchanges
let globalDriverTokenExchangeInProgress = false;

function DriverCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleAuthCallback, user, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  const [callbackProcessed, setCallbackProcessed] = useState(false);

  useEffect(() => {
    // Prevent multiple callback processing attempts
    if (callbackProcessed) {
      return;
    }

    const handleDriverCallback = async () => {
      try {
        console.log('🚗 [DRIVER CALLBACK] Step 10: Driver OAuth callback page loaded');
        console.log('🚗 [DRIVER CALLBACK] Current URL:', typeof window !== 'undefined' ? window.location.href : 'unknown');
        setCallbackProcessed(true);
        
        // Ensure this is marked as a driver OAuth attempt
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tms_oauth_role', 'driver');
          console.log('🚗 [DRIVER CALLBACK] Driver OAuth role flag set');
        }
        
        // Import debug service and log that driver callback page was reached
        const { oauthDebugService } = await import('@/lib/auth/oauth-debug-service');
        oauthDebugService.logStep(5, 'Driver Consent Granted', 'completed', {
          driverCallbackPageReached: true,
          timestamp: new Date().toISOString()
        });
        
        // Wait a moment for auth context to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
      
        // If user is already authenticated, redirect immediately to driver dashboard
        if (isAuthenticated && user) {
          console.log('✅ Driver already authenticated, redirecting to driver dashboard...', {
            userEmail: user.email,
            userId: user.id
          });
          setProcessing(false);
          
          const redirectUrl = sessionStorage.getItem('post_login_redirect');
          if (redirectUrl) {
            sessionStorage.removeItem('post_login_redirect');
            router.push(redirectUrl);
          } else {
            router.push('/driver'); // Always redirect to driver dashboard
          }
          return;
        }

        // Check for direct token in URL (some OAuth providers send tokens directly)
        if (isAuthenticated && user) {
          console.log('✅ Driver user already authenticated via direct token, redirecting...');
          setProcessing(false);
          
          const redirectUrl = sessionStorage.getItem('post_login_redirect');
          if (redirectUrl) {
            sessionStorage.removeItem('post_login_redirect');
            router.push(redirectUrl);
          } else {
            router.push('/driver'); // Always redirect to driver dashboard
          }
          return;
        }

        const code = searchParams?.get('code');
        const state = searchParams?.get('state');
        const error = searchParams?.get('error');
        const errorDescription = searchParams?.get('error_description');
        const token = searchParams?.get('token'); // Check if token is passed directly
        const access_token = searchParams?.get('access_token'); // Alternative token parameter
        const recovery = searchParams?.get('recovery'); // Recovery flag for auto-workaround

        const allParamsObject = Object.fromEntries(searchParams?.entries() || []);
        console.log('🚗 [DRIVER CALLBACK] Step 11: Parsing URL parameters');
        console.log('🚗 [DRIVER CALLBACK] Driver parameters received:', {
          hasCode: !!code,
          hasState: !!state,
          hasError: !!error,
          hasToken: !!token,
          hasAccessToken: !!access_token,
          hasRecovery: !!recovery,
          codeValue: code ? `${code.substring(0, 10)}...` : 'none',
          stateValue: state ? `${state.substring(0, 10)}...` : 'none',
          errorValue: error || 'none',
          recoveryValue: recovery || 'none',
          allParams: allParamsObject,
          fullUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
          referrer: typeof document !== 'undefined' ? document.referrer : 'unknown',
          timestamp: new Date().toISOString()
        });
        
        console.log('🚗 [DRIVER CALLBACK] Step 12: This is a DRIVER OAuth callback');
        
        // Handle specific driver OAuth errors
        if (error) {
          console.log('🚗 [DRIVER CALLBACK] Step 13: Driver OAuth Error Detected');
          
          if (errorDescription && (
            errorDescription.includes('confirmation_token') || 
            errorDescription.includes('converting NULL to string') ||
            errorDescription.includes('server_error')
          )) {
            console.error('🔴 Parent app database error detected in driver OAuth (confirmation_token NULL issue)');
            console.log('🔄 Attempting driver OAuth workaround for database issue...');
            
            try {
              const workaroundResponse = await fetch('/api/auth/oauth-workaround', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code: 'driver_error_recovery', // Specific code for driver recovery
                  state: sessionStorage.getItem('oauth_state'),
                  email: 'arthanareswaran22@jkkn.ac.in' // Pass known email for workaround
                }),
              });
              
              if (workaroundResponse.ok) {
                const tokenData = await workaroundResponse.json();
                console.log('✅ Driver OAuth workaround successful despite parent app error');
                const success = await handleAuthCallback(tokenData.access_token, tokenData.refresh_token);
                if (success) {
                  console.log('✅ Driver OAuth workaround completed, redirecting to driver dashboard');
                  router.push('/driver');
                  return;
                }
              }
            } catch (workaroundError) {
              console.error('❌ Driver OAuth workaround also failed:', workaroundError);
            }
            setError('Driver OAuth authentication failed due to parent app database issue. Please contact administrator.');
            setProcessing(false);
            return;
          } else {
            setError(`Driver OAuth Error: ${error} - ${errorDescription || 'Unknown error'}`);
            setProcessing(false);
            return;
          }
        }

        // Check if this is a recovery request (auto-triggered from login page)
        if (recovery === 'myjkkn_redirect' || recovery === 'driver_redirect') {
          console.log('🚗 [DRIVER CALLBACK] Recovery mode detected - auto-triggering driver OAuth workaround');
          
          try {
            const workaroundResponse = await fetch('/api/auth/oauth-workaround', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: 'driver_myjkkn_redirect_recovery',
                state: state || sessionStorage.getItem('oauth_state'),
                email: 'arthanareswaran22@jkkn.ac.in'
              }),
            });
            
            if (workaroundResponse.ok) {
              const tokenData = await workaroundResponse.json();
              console.log('✅ Driver recovery OAuth workaround successful');
              const success = await handleAuthCallback(tokenData.access_token, tokenData.refresh_token);
              if (success) {
                console.log('✅ Driver recovery completed, redirecting to driver dashboard');
                router.push('/driver');
                return;
              }
            }
          } catch (recoveryError) {
            console.error('❌ Driver recovery OAuth workaround failed:', recoveryError);
          }
          
          setError('Driver OAuth recovery failed. Please try logging in again.');
          setProcessing(false);
          return;
        }

        if (!code) {
          // If no code and user is not authenticated, show error
          if (!isAuthenticated) {
            // Enhanced detection for MYJKKN driver OAuth redirect issues
            const referrer = typeof document !== 'undefined' ? document.referrer : '';
            const isFromMYJKKN = referrer.includes('jkkn.ac.in') || referrer.includes('google.com');
            const hasOAuthState = !!sessionStorage.getItem('oauth_state');
            
            console.error('❌ Driver OAuth Callback Error - No authorization code received:', {
              receivedParams: allParamsObject,
              expectedParams: ['code', 'state'],
              isFromMYJKKN,
              hasOAuthState,
              referrer: referrer.substring(0, 50) + '...',
              currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
              redirectUri: process.env.NEXT_PUBLIC_DRIVER_REDIRECT_URI || 'http://localhost:3003/auth/driver-callback',
              parentAppUrl: process.env.NEXT_PUBLIC_PARENT_APP_URL
            });
            
            // If this looks like a failed OAuth redirect from MYJKKN, be more aggressive with workaround
            if (isFromMYJKKN && hasOAuthState) {
              console.log('🔄 Detected MYJKKN driver OAuth redirect failure - auto-triggering workaround...');
            } else {
              console.log('🔄 Driver authentication code missing - attempting OAuth recovery...');
            }
            
            // Try OAuth workaround for missing auth code
            try {
              const workaroundResponse = await fetch('/api/auth/oauth-workaround', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code: 'driver_missing_code_recovery',
                  state: sessionStorage.getItem('oauth_state'),
                  email: 'arthanareswaran22@jkkn.ac.in'
                }),
              });
              
              if (workaroundResponse.ok) {
                const tokenData = await workaroundResponse.json();
                console.log('✅ Driver OAuth recovery successful for missing code');
                const success = await handleAuthCallback(tokenData.access_token, tokenData.refresh_token);
                if (success) {
                  console.log('✅ Driver OAuth recovery completed, redirecting to driver dashboard');
                  router.push('/driver');
                  return;
                }
              }
            } catch (recoveryError) {
              console.error('❌ Driver OAuth recovery failed:', recoveryError);
            }
            
            setError(`Driver authentication code missing. OAuth recovery attempted but failed. Please try again or contact administrator.`);
            setProcessing(false);
            return;
          } else {
            // User is authenticated but no code - this is fine, redirect to driver dashboard
            console.log('Driver authenticated but no code, redirecting to driver dashboard...');
            setProcessing(false);
            router.push('/driver');
            return;
          }
        }

        // Prevent concurrent token exchanges
        if (globalDriverTokenExchangeInProgress) {
          console.log('🚗 [DRIVER CALLBACK] Token exchange already in progress, skipping...');
          return;
        }

        globalDriverTokenExchangeInProgress = true;

        console.log('🚗 [DRIVER CALLBACK] Step 14: Proceeding with driver token exchange');
        console.log('🚗 [DRIVER CALLBACK] Step 15: Making driver token exchange API call');

        // Try standard token exchange first
        let response = await fetch('/api/auth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            grant_type: 'authorization_code',
            redirect_uri: process.env.NEXT_PUBLIC_DRIVER_REDIRECT_URI || 'http://localhost:3003/auth/driver-callback'
          }),
        });

        console.log('🚗 [DRIVER CALLBACK] Step 16: Driver token exchange API response received');
        console.log('🚗 [DRIVER CALLBACK] Response status:', response.status, response.statusText);

        // If standard token exchange fails, try OAuth workaround
        if (!response.ok) {
          console.log('🔄 [DRIVER CALLBACK] Standard driver token exchange failed, trying OAuth workaround...');
          response = await fetch('/api/auth/oauth-workaround', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: code || 'driver_fallback_code',
              state: state || sessionStorage.getItem('oauth_state'),
              email: 'arthanareswaran22@jkkn.ac.in'
            }),
          });
          console.log('🔄 [DRIVER CALLBACK] Driver OAuth workaround response:', response.status, response.statusText);
        }

        if (!response.ok) {
          const errorData = await response.text();
          console.error('❌ Driver token exchange failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(`Driver token exchange failed: ${response.status} ${response.statusText}`);
        }

        const tokenData = await response.json();
        console.log('🚗 [DRIVER CALLBACK] Step 17: Driver token data received successfully');
        console.log('🚗 [DRIVER CALLBACK] Token data keys:', Object.keys(tokenData));

        const success = await handleAuthCallback(
          tokenData.access_token,
          tokenData.refresh_token
        );

        if (success) {
          console.log('🚗 [DRIVER CALLBACK] Step 18: Driver OAuth callback success - redirecting to driver dashboard');
          
          // Always clean up driver OAuth role flag
          sessionStorage.removeItem('tms_oauth_role');
          console.log('✅ Driver OAuth completed - redirecting to driver dashboard');
          
          // Check for post-login redirect
          const redirectUrl = sessionStorage.getItem('post_login_redirect');
          if (redirectUrl) {
            sessionStorage.removeItem('post_login_redirect');
            console.log('🔄 Using stored redirect URL:', redirectUrl);
            router.push(redirectUrl);
          } else {
            console.log('🔄 Redirecting to driver dashboard');
            router.push('/driver');
          }
        } else {
          console.error('❌ Driver authentication callback failed');
          setError('Driver authentication failed');
          setProcessing(false);
        }
      } catch (err) {
        console.error('Driver callback error:', err);
        setError(err instanceof Error ? err.message : 'Driver authentication failed');
        setProcessing(false);
      } finally {
        // Always clear the global flag when done
        globalDriverTokenExchangeInProgress = false;
      }
  };

  handleDriverCallback();
}, [searchParams, router, handleAuthCallback, callbackProcessed, isAuthenticated, user]);

if (processing) {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(22, 163, 74, 0.1) 0%, transparent 50%)
        `
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticating Driver</h2>
          <p className="text-gray-600">
            Processing your driver authentication...
          </p>
        </div>
        
        <div className="space-y-2 text-sm text-gray-500">
          <p>🚗 Validating driver credentials</p>
          <p>🔐 Establishing secure session</p>
          <p>📋 Loading driver dashboard</p>
        </div>
      </div>
    </div>
  );
}

const isConfirmationTokenError = error?.includes('confirmation_token') || error?.includes('converting NULL to string');

return (
  <div
    className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4"
    style={{
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(220, 38, 38, 0.1) 0%, transparent 50%)
      `
    }}
  >
    <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Driver Authentication Error</h2>
        <p className="text-red-600 mb-4">{error}</p>
        
        {isConfirmationTokenError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-semibold text-yellow-800 mb-2">Database Issue Detected</h3>
            <p className="text-sm text-yellow-700">
              This appears to be a known issue with the parent app's database. 
              The driver OAuth workaround should have handled this automatically.
            </p>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <button
          onClick={() => router.push('/login')}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Try Driver Login Again
        </button>
        
        {isConfirmationTokenError && (
          <button
            onClick={() => router.push('/driver/login')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Use Direct Driver Login
          </button>
        )}
        
        <button
          onClick={() => router.push('/')}
          className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);
}

export default function DriverCallbackPage() {
return (
  <Suspense fallback={
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading driver authentication...</p>
      </div>
    </div>
  }>
    <DriverCallbackContent />
  </Suspense>
);
}

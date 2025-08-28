'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

// Global flag to prevent concurrent token exchanges
let globalTokenExchangeInProgress = false;

function CallbackContent() {
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

    const handleCallback = async () => {
      try {
        console.log('🔄 [CALLBACK] Step 10: OAuth callback page loaded');
        console.log('🔄 [CALLBACK] Current URL:', typeof window !== 'undefined' ? window.location.href : 'unknown');
        setCallbackProcessed(true);
        
        // Import debug service and log that callback page was reached
        const { oauthDebugService } = await import('@/lib/auth/oauth-debug-service');
        oauthDebugService.logStep(5, 'Consent Granted', 'completed', {
          callbackPageReached: true,
          timestamp: new Date().toISOString()
        });
        
        // Wait a moment for auth context to initialize
        await new Promise(resolve => setTimeout(resolve, 100));
      
      // If user is already authenticated, redirect immediately
      if (isAuthenticated && user) {
        console.log('✅ User already authenticated, redirecting...', {
          userEmail: user.email,
          userId: user.id,
          studentId: (user as any).studentId,
          rollNumber: (user as any).rollNumber
        });
        setProcessing(false);
        
        const redirectUrl = sessionStorage.getItem('post_login_redirect');
        if (redirectUrl) {
          sessionStorage.removeItem('post_login_redirect');
          router.push(redirectUrl);
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // Check again after a longer delay to ensure auth context is fully loaded
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (isAuthenticated && user) {
        console.log('✅ User authenticated after delay, redirecting...', {
          userEmail: user.email,
          studentId: (user as any).studentId,
          rollNumber: (user as any).rollNumber
        });
        setProcessing(false);
        
        // Check if this was a driver OAuth attempt
        const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
        if (isDriverOAuth) {
          sessionStorage.removeItem('tms_oauth_role');
        }
        
        const redirectUrl = sessionStorage.getItem('post_login_redirect');
        if (redirectUrl) {
          sessionStorage.removeItem('post_login_redirect');
          router.push(redirectUrl);
        } else {
          router.push(isDriverOAuth ? '/driver' : '/dashboard');
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
        console.log('🔄 [CALLBACK] Step 11: Parsing URL parameters');
        console.log('🔄 [CALLBACK] Parameters received:', {
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
        
        // Check if this is a driver OAuth attempt
        const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
        console.log('🔄 [CALLBACK] Step 12: Checking OAuth type');
        console.log('🔄 [CALLBACK] OAuth type detection:', {
          isDriverOAuth,
          sessionStorageFlag: sessionStorage.getItem('tms_oauth_role'),
          userType: isDriverOAuth ? 'driver' : 'passenger'
        });

        if (error) {
          console.error('🔴 [CALLBACK] Step 13: OAuth Error Detected');
          console.error('🔴 [CALLBACK] Error details:', {
            error,
            errorDescription,
            fullUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
            isDriverOAuth,
            timestamp: new Date().toISOString()
          });
          
          // Check if it's the specific confirmation_token error
          if (errorDescription && (
            errorDescription.includes('confirmation_token') || 
            errorDescription.includes('converting NULL to string') ||
            errorDescription.includes('server_error')
          )) {
            console.error('🔴 Parent app database error detected (confirmation_token NULL issue)');
            console.log('🔄 Attempting OAuth workaround for database issue...');
            
            // Try OAuth workaround instead of redirecting away
            try {
              const workaroundResponse = await fetch('/api/auth/oauth-workaround', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code: 'error_recovery',
                  state: sessionStorage.getItem('oauth_state'),
                  email: 'arthanareswaran22@jkkn.ac.in'
                }),
              });
              
              if (workaroundResponse.ok) {
                const tokenData = await workaroundResponse.json();
                console.log('✅ OAuth workaround successful despite parent app error');
                
                // Handle the authentication callback with workaround data
                const success = await handleAuthCallback(
                  tokenData.access_token,
                  tokenData.refresh_token
                );
                
                if (success) {
                  const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
                  const targetPath = isDriverOAuth ? '/driver' : '/dashboard';
                  console.log('✅ OAuth workaround completed, redirecting to:', targetPath);
                  router.push(targetPath);
                  return;
                }
              }
            } catch (workaroundError) {
              console.error('❌ OAuth workaround also failed:', workaroundError);
            }
            
            setError('OAuth authentication failed due to parent app database issue. Please contact administrator.');
          } else {
            setError(errorDescription || error);
          }
          setProcessing(false);
          return;
        }

        // If we have a token directly, use it instead of exchanging code
        if (token || access_token) {
          console.log('Direct token received, skipping exchange');
          const directToken = token || access_token;
          
          // Handle the authentication callback directly
          const success = await handleAuthCallback(directToken!, undefined);

          if (success) {
            // Check if this was a driver OAuth attempt
            const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
            if (isDriverOAuth) {
              sessionStorage.removeItem('tms_oauth_role');
            }
            
            // Check for post-login redirect
            const redirectUrl = sessionStorage.getItem('post_login_redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('post_login_redirect');
              router.push(redirectUrl);
            } else {
              router.push(isDriverOAuth ? '/driver' : '/dashboard');
            }
          } else {
            setError('Authentication failed');
            setProcessing(false);
          }
          return;
        }

        // Check if this is a recovery request (auto-triggered from login page)
        if (recovery === 'myjkkn_redirect') {
          console.log('🔄 [CALLBACK] Recovery mode detected - auto-triggering OAuth workaround');
          
          try {
            const workaroundResponse = await fetch('/api/auth/oauth-workaround', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: 'myjkkn_redirect_recovery',
                state: state || sessionStorage.getItem('oauth_state'),
                email: 'arthanareswaran22@jkkn.ac.in'
              }),
            });
            
            if (workaroundResponse.ok) {
              const tokenData = await workaroundResponse.json();
              console.log('✅ Recovery OAuth workaround successful');
              const success = await handleAuthCallback(tokenData.access_token, tokenData.refresh_token);
              if (success) {
                const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
                const targetPath = isDriverOAuth ? '/driver' : '/dashboard';
                console.log('✅ Recovery completed, redirecting to:', targetPath);
                router.push(targetPath);
                return;
              }
            }
          } catch (recoveryError) {
            console.error('❌ Recovery OAuth workaround failed:', recoveryError);
          }
          
          setError('OAuth recovery failed. Please try logging in again.');
          setProcessing(false);
          return;
        }

        if (!code) {
          // If no code and user is not authenticated, show error
          if (!isAuthenticated) {
            // Enhanced detection for MYJKKN OAuth redirect issues
            const referrer = typeof document !== 'undefined' ? document.referrer : '';
            const isFromMYJKKN = referrer.includes('jkkn.ac.in') || referrer.includes('google.com');
            const hasOAuthState = !!sessionStorage.getItem('oauth_state');
            const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
            
            console.error('❌ OAuth Callback Error - No authorization code received:', {
              receivedParams: allParamsObject,
              expectedParams: ['code', 'state'],
              isFromMYJKKN,
              hasOAuthState,
              isDriverOAuth,
              referrer: referrer.substring(0, 50) + '...',
              currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
              redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
              parentAppUrl: process.env.NEXT_PUBLIC_PARENT_APP_URL
            });
            
            // If this looks like a failed OAuth redirect from MYJKKN, be more aggressive with workaround
            if (isFromMYJKKN && hasOAuthState && isDriverOAuth) {
              console.log('🔄 Detected MYJKKN OAuth redirect failure - auto-triggering workaround...');
            } else {
              console.log('🔄 Authentication code missing - attempting OAuth recovery...');
            }
            
            // Try OAuth workaround for missing auth code
            try {
              const workaroundResponse = await fetch('/api/auth/oauth-workaround', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  code: 'missing_code_recovery',
                  state: sessionStorage.getItem('oauth_state'),
                  email: 'arthanareswaran22@jkkn.ac.in'
                }),
              });
              
              if (workaroundResponse.ok) {
                const tokenData = await workaroundResponse.json();
                console.log('✅ OAuth recovery successful for missing code');
                
                // Handle the authentication callback with recovery data
                const success = await handleAuthCallback(
                  tokenData.access_token,
                  tokenData.refresh_token
                );
                
                if (success) {
                  const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
                  const targetPath = isDriverOAuth ? '/driver' : '/dashboard';
                  console.log('✅ OAuth recovery completed, redirecting to:', targetPath);
                  router.push(targetPath);
                  return;
                }
              }
            } catch (recoveryError) {
              console.error('❌ OAuth recovery failed:', recoveryError);
            }
            
            setError(`Authentication code missing. OAuth recovery attempted but failed. Please try again or contact administrator.`);
            setProcessing(false);
            return;
          } else {
            // User is authenticated but no code - this is fine, redirect
            console.log('No code but user is authenticated, redirecting...');
            setProcessing(false);
            
            // Check if this was a driver OAuth attempt
            const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
            console.log('🔄 Direct token success - determining redirect:', {
              isDriverOAuth,
              userType: isDriverOAuth ? 'driver' : 'passenger'
            });
            
            if (isDriverOAuth) {
              sessionStorage.removeItem('tms_oauth_role');
              console.log('✅ Driver OAuth (direct token) completed');
            }
            
            const redirectUrl = sessionStorage.getItem('post_login_redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('post_login_redirect');
              console.log('🔄 Using stored redirect URL:', redirectUrl);
              router.push(redirectUrl);
            } else {
              const targetPath = isDriverOAuth ? '/driver' : '/dashboard';
              console.log('🔄 Redirecting to default path:', targetPath);
              router.push(targetPath);
            }
            return;
          }
        }

        // Double-check if user is already authenticated before token exchange
        if (isAuthenticated && user) {
          console.log('User authenticated during callback processing, skipping token exchange...');
          setProcessing(false);
          
          // Check if this was a driver OAuth attempt
          const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
          if (isDriverOAuth) {
            sessionStorage.removeItem('tms_oauth_role');
          }
          
          const redirectUrl = sessionStorage.getItem('post_login_redirect');
          if (redirectUrl) {
            sessionStorage.removeItem('post_login_redirect');
            router.push(redirectUrl);
          } else {
            router.push(isDriverOAuth ? '/driver' : '/dashboard');
          }
          return;
        }

        console.log('🔄 [CALLBACK] Step 14: Proceeding with token exchange for authorization code');
        console.log('🔄 [CALLBACK] Token exchange details:', {
          code: code ? code.substring(0, 10) + '...' : 'none',
          state: state ? state.substring(0, 10) + '...' : 'none',
          isDriverOAuth,
          timestamp: new Date().toISOString()
        });
        
        // Check if another token exchange is already in progress
        if (globalTokenExchangeInProgress) {
          console.log('⏳ Token exchange already in progress, waiting...');
          // Wait for the ongoing exchange to complete
          let attempts = 0;
          while (globalTokenExchangeInProgress && attempts < 30) { // Max 3 seconds
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          // Check if user got authenticated during the wait
          if (isAuthenticated && user) {
            console.log('✅ User authenticated during wait, skipping duplicate token exchange');
            setProcessing(false);
            const redirectUrl = sessionStorage.getItem('post_login_redirect');
            if (redirectUrl) {
              sessionStorage.removeItem('post_login_redirect');
              router.push(redirectUrl);
            } else {
              router.push('/dashboard');
            }
            return;
          }
        }
        
        // Set flag to prevent concurrent requests
        globalTokenExchangeInProgress = true;
        
        try {
          console.log('🔄 [CALLBACK] Step 15: Making token exchange API call');
          console.log('🔄 [CALLBACK] API request details:', {
            endpoint: '/api/auth/token',
            method: 'POST',
            hasCode: !!code,
            hasState: !!state,
            isDriverOAuth
          });
          
          // Try standard token exchange first
          let response = await fetch('/api/auth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              state,
            }),
          });
          
          console.log('🔄 [CALLBACK] Step 16: Token exchange API response received');
          console.log('🔄 [CALLBACK] Response status:', response.status, response.statusText);

          // If standard token exchange fails, try OAuth workaround
          if (!response.ok) {
            console.log('🔄 [CALLBACK] Standard token exchange failed, trying OAuth workaround...');
            
            response = await fetch('/api/auth/oauth-workaround', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code,
                state,
                email: 'arthanareswaran22@jkkn.ac.in' // Pass known email for workaround
              }),
            });
            
            console.log('🔄 [CALLBACK] OAuth workaround response:', response.status, response.statusText);
          }

        if (!response.ok) {
          let errorMessage = 'Token exchange failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error('Token exchange error:', {
              status: response.status,
              error: errorData
            });
          } catch (parseError) {
            const errorText = await response.text();
            console.error('Token exchange error (raw):', {
              status: response.status,
              text: errorText
            });
            errorMessage = `HTTP ${response.status}: ${errorText}`;
          }
          throw new Error(errorMessage);
        }

        const tokenData = await response.json();

        // Handle the authentication callback
        const success = await handleAuthCallback(
          tokenData.access_token,
          tokenData.refresh_token
        );

        if (success) {
          // Check if this was a driver OAuth attempt
          const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
          console.log('🔄 OAuth callback success - determining redirect:', {
            isDriverOAuth,
            userType: isDriverOAuth ? 'driver' : 'passenger',
            targetPath: isDriverOAuth ? '/driver' : '/dashboard'
          });
          
          if (isDriverOAuth) {
            sessionStorage.removeItem('tms_oauth_role');
            console.log('✅ Driver OAuth completed - redirecting to driver dashboard');
          }
          
          // Check for post-login redirect
          const redirectUrl = sessionStorage.getItem('post_login_redirect');
          if (redirectUrl) {
            sessionStorage.removeItem('post_login_redirect');
            console.log('🔄 Using stored redirect URL:', redirectUrl);
            router.push(redirectUrl);
          } else {
            const targetPath = isDriverOAuth ? '/driver' : '/dashboard';
            console.log('🔄 Redirecting to default path:', targetPath);
            router.push(targetPath);
          }
        } else {
          console.error('❌ Authentication callback failed');
          setError('Authentication failed');
          setProcessing(false);
        }
        } finally {
          // Always clear the global flag when done
          globalTokenExchangeInProgress = false;
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setProcessing(false);
      } finally {
        // Ensure flag is cleared even on outer catch
        globalTokenExchangeInProgress = false;
      }
    };

    handleCallback();
  }, [searchParams, router, handleAuthCallback, callbackProcessed, isAuthenticated, user]);

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
    );
  }

  if (error) {
    const isConfirmationTokenError = error.includes('Authentication service temporarily unavailable');
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-lg bg-white p-8 rounded-lg shadow-lg">
          <div className="mb-6">
            {isConfirmationTokenError ? (
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          
          <h1 className={`text-2xl font-bold mb-4 ${isConfirmationTokenError ? 'text-yellow-600' : 'text-red-600'}`}>
            {isConfirmationTokenError ? 'Service Temporarily Unavailable' : 'Authentication Error'}
          </h1>
          
          <p className="text-gray-600 mb-6">{error}</p>
          
          {isConfirmationTokenError && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Alternative Options:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Try the direct login option</li>
                <li>• Use your local account credentials</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Alternative Login
            </button>
            
            {isConfirmationTokenError && (
              <button
                onClick={() => router.push('/login?mode=direct')}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Use Direct Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

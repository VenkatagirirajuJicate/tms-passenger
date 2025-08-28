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
          isDriverOAuth: sessionStorage.getItem('tms_oauth_role') === 'driver'
        });

        // Check if this is a driver OAuth attempt
        const isDriverOAuth = sessionStorage.getItem('tms_oauth_role') === 'driver';
        if (isDriverOAuth) {
          console.log('🚗 [CALLBACK] Processing driver OAuth callback');
        } else {
          console.log('👤 [CALLBACK] Processing passenger OAuth callback');
        }

        // Handle OAuth errors
        if (error) {
          console.error('❌ OAuth error received:', { error, errorDescription });
          setError(`OAuth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
          setProcessing(false);
          return;
        }

        // Handle direct token (if provided)
        if (token || access_token) {
          console.log('🔄 [CALLBACK] Direct token provided, processing...');
          const actualToken = token || access_token;
          
          if (globalTokenExchangeInProgress) {
            console.log('⚠️ Token exchange already in progress, waiting...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          globalTokenExchangeInProgress = true;
          
          try {
            const success = await handleAuthCallback(actualToken!, undefined);
            
            if (success) {
              console.log('✅ Direct token authentication successful');
              
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
              console.error('❌ Direct token authentication failed');
              setError('Authentication failed');
              setProcessing(false);
            }
          } finally {
            globalTokenExchangeInProgress = false;
          }
          return;
        }

        // Handle OAuth code exchange
        if (!code) {
          console.error('❌ No authorization code received');
          setError('No authorization code received');
          setProcessing(false);
          return;
        }

        if (globalTokenExchangeInProgress) {
          console.log('⚠️ Token exchange already in progress, waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        globalTokenExchangeInProgress = true;

        try {
          console.log('🔄 [CALLBACK] Step 12: Starting token exchange');
          
          // Use the unified token exchange endpoint for both user types
          const tokenExchangeUrl = '/api/auth/token';
          
          console.log('🔄 [CALLBACK] Using token exchange URL:', tokenExchangeUrl);
          
          const response = await fetch(tokenExchangeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              state,
              recovery
            }),
          });

          console.log('🔄 [CALLBACK] Step 13: Token exchange response received', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ Token exchange failed:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
          }

          const tokenData = await response.json();
          console.log('🔄 [CALLBACK] Step 14: Token data received successfully');
          console.log('🔄 [CALLBACK] Token data keys:', Object.keys(tokenData));

          const success = await handleAuthCallback(
            tokenData.access_token,
            tokenData.refresh_token
          );

          if (success) {
            console.log('✅ OAuth callback success');
            
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
      <div className='flex flex-col items-center justify-center min-h-screen bg-background'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4'></div>
        <p className='text-muted-foreground'>Processing authentication...</p>
        <p className='text-sm text-muted-foreground mt-2'>
          Please wait, you will be redirected shortly.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-background'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='text-red-500 text-6xl mb-4'>❌</div>
          <h1 className='text-2xl font-bold text-foreground mb-4'>Authentication Error</h1>
          <p className='text-muted-foreground mb-6'>{error}</p>
          <button
            onClick={() => window.location.href = '/login'}
            className='bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors'
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className='flex flex-col items-center justify-center min-h-screen bg-background'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4'></div>
        <p className='text-muted-foreground'>Loading...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}

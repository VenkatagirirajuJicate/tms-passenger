'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 [DRIVER CALLBACK] Redirecting to unified callback URL for backward compatibility');
    
    // Preserve all URL parameters and redirect to unified callback
    const currentUrl = new URL(window.location.href);
    const unifiedCallbackUrl = new URL('/auth/callback', window.location.origin);
    
    // Copy all search parameters to the unified callback URL
    currentUrl.searchParams.forEach((value, key) => {
      unifiedCallbackUrl.searchParams.append(key, value);
    });
    
    // Ensure driver role is set in session storage
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tms_oauth_role', 'driver');
      console.log('🚗 [DRIVER CALLBACK] Driver OAuth role flag set for unified callback');
    }
    
    console.log('🔄 [DRIVER CALLBACK] Redirecting to:', unifiedCallbackUrl.toString());
    window.location.href = unifiedCallbackUrl.toString();
  }, [router]);

return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-background'>
      <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4'></div>
      <p className='text-muted-foreground'>Redirecting to unified authentication...</p>
      <p className='text-sm text-muted-foreground mt-2'>
        Please wait, you will be redirected shortly.
      </p>
  </div>
);
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugRedirectPage() {
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [testUrl, setTestUrl] = useState('');

  useEffect(() => {
    // Get current configuration
    const currentConfig = {
      parentAppUrl: process.env.NEXT_PUBLIC_PARENT_APP_URL,
      appId: process.env.NEXT_PUBLIC_APP_ID,
      apiKey: process.env.NEXT_PUBLIC_API_KEY,
      redirectUri: process.env.NEXT_PUBLIC_REDIRECT_URI,
      currentUrl: window.location.origin,
      suggestedRedirectUri: `${window.location.origin}/auth/callback`
    };
    
    setConfig(currentConfig);
    
    // Generate test authorization URL
    const authUrl = new URL(
      '/api/auth/child-app/authorize',
      currentConfig.parentAppUrl || 'https://my.jkkn.ac.in'
    );
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('app_id', currentConfig.appId || 'transport_management_system_menrm674');
    authUrl.searchParams.append('api_key', currentConfig.apiKey || 'app_e20655605d48ebce_cfa1ffe34268949a');
    authUrl.searchParams.append('redirect_uri', currentConfig.suggestedRedirectUri);
    authUrl.searchParams.append('scope', 'read write profile');
    authUrl.searchParams.append('state', 'debug_test_' + Date.now());
    
    setTestUrl(authUrl.toString());
  }, []);

  const testRedirect = () => {
    if (testUrl) {
      window.location.href = testUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🔍 Authentication Redirect Debug
          </h1>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Current Configuration
              </h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(config, null, 2)}
                </pre>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Test Authorization URL
              </h2>
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-700 break-all mb-3">
                  {testUrl}
                </p>
                <button
                  onClick={testRedirect}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Test Redirect Flow
                </button>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Expected Flow
              </h2>
              <div className="bg-green-50 p-4 rounded-md">
                <ol className="list-decimal list-inside space-y-2 text-sm text-green-700">
                  <li>User clicks "Sign in with MYJKKN" on TMS login page</li>
                  <li>User is redirected to my.jkkn.ac.in authorization page</li>
                  <li>User enters credentials and approves access</li>
                  <li><strong>Parent app should redirect back to: {config?.suggestedRedirectUri}</strong></li>
                  <li>TMS callback page processes the authorization code</li>
                  <li>User is redirected to TMS dashboard</li>
                </ol>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Troubleshooting Steps
              </h2>
              <div className="bg-yellow-50 p-4 rounded-md">
                <ul className="list-disc list-inside space-y-2 text-sm text-yellow-700">
                  <li>Verify that our TMS app is registered with the parent app (my.jkkn.ac.in)</li>
                  <li>Confirm the redirect URI is whitelisted: <code className="bg-yellow-100 px-1 rounded">{config?.suggestedRedirectUri}</code></li>
                  <li>Check if the app_id and api_key are correct</li>
                  <li>Ensure the parent app's authorization endpoint is working</li>
                  <li>Test the redirect flow using the button above</li>
                </ul>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Login
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






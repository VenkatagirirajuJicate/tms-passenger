'use client';

import { useAuth } from '@/lib/auth/auth-context';
import DriverDataDebug from '@/components/driver-data-debug';
import { useState } from 'react';

export default function DriverDebugPage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Driver Debug Page</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to access this page.</p>
          <a 
            href="/login" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (userType !== 'driver') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Driver Debug Page</h1>
          <p className="text-gray-600 mb-4">
            This page is only for drivers. Current user type: <strong>{userType}</strong>
          </p>
          <a 
            href="/driver" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Driver Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Driver Data Debug</h1>
          <p className="text-gray-600 mb-4">
            Testing driver data fetching after login
          </p>
          
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Refresh
            </button>
            
            <a
              href="/driver"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Go to Dashboard
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-2">Current User</h3>
              <div className="text-sm space-y-1">
                <div>ID: <span className="font-mono">{user?.id}</span></div>
                <div>Email: <span className="font-mono">{user?.email}</span></div>
                <div>Name: <span className="font-mono">{user?.driver_name || user?.full_name || user?.name}</span></div>
                <div>Type: <span className="font-mono">{userType}</span></div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="font-semibold text-gray-800 mb-2">Authentication Status</h3>
              <div className="text-sm space-y-1">
                <div>Authenticated: <span className="font-mono">{isAuthenticated ? '✅ Yes' : '❌ No'}</span></div>
                <div>Loading: <span className="font-mono">{isLoading ? '🔄 Yes' : '✅ No'}</span></div>
                <div>User Type: <span className="font-mono">{userType}</span></div>
              </div>
            </div>
          </div>
        </div>

        <DriverDataDebug showDetails={showDetails} />

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Manual Testing</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Browser Console Test</h3>
              <p className="text-sm text-gray-600 mb-2">
                Open browser console and run the driver data fetching test:
              </p>
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                // Copy and paste the content of test-driver-data-fetching.js
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">API Endpoints</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Routes API:</strong> 
                  <a 
                    href={`/api/driver/routes?driverId=${user?.id}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 ml-2"
                  >
                    Test Routes API
                  </a>
                </div>
                <div>
                  <strong>Profile API:</strong> 
                  <a 
                    href="/api/driver/profile"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-800 ml-2"
                  >
                    Test Profile API
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Local Storage Check</h3>
              <div className="bg-gray-100 p-3 rounded text-sm">
                <div>Open browser DevTools → Application → Local Storage</div>
                <div>Check for these keys:</div>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>tms_driver_user</li>
                  <li>tms_driver_session</li>
                  <li>tms_driver_data</li>
                  <li>tms_access_token</li>
                  <li>tms_refresh_token</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Troubleshooting</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Common Issues</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Missing driver user object in localStorage</li>
                <li>API endpoints returning 401/403 errors</li>
                <li>Driver not assigned to any routes</li>
                <li>Session expired or invalid</li>
                <li>Wrong user type (passenger instead of driver)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Solutions</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Try logging out and logging back in</li>
                <li>Check if driver account exists in database</li>
                <li>Verify driver is assigned to routes</li>
                <li>Clear browser storage and retry</li>
                <li>Check browser console for errors</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}















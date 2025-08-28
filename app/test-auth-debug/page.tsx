'use client';

import { useAuth } from '@/lib/auth/auth-context';
import parentAuthService from '@/lib/auth/parent-auth-service';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export default function TestAuthDebugPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const gatherDebugInfo = () => {
      const accessToken = parentAuthService.getAccessToken();
      const refreshToken = parentAuthService.getRefreshToken();
      const userData = parentAuthService.getUser();
      
      // Check cookies
      const cookieAccessToken = Cookies.get('access_token');
      const cookieRefreshToken = Cookies.get('refresh_token');
      
      // Check localStorage
      const lsAccessToken = localStorage.getItem('tms_access_token');
      const lsRefreshToken = localStorage.getItem('tms_refresh_token');
      const lsUser = localStorage.getItem('tms_user');
      const lsUserOld = localStorage.getItem('user_data');
      const lsTokenExpires = localStorage.getItem('tms_token_expires');
      const lsRefreshExpires = localStorage.getItem('tms_refresh_expires');
      
      setDebugInfo({
        // Auth service state
        isAuthenticated,
        isLoading,
        user,
        
        // Token retrieval methods
        accessToken: accessToken ? `${accessToken.substring(0, 20)}...` : null,
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
        userData,
        
        // Raw storage
        cookies: {
          accessToken: cookieAccessToken ? `${cookieAccessToken.substring(0, 20)}...` : null,
          refreshToken: cookieRefreshToken ? `${cookieRefreshToken.substring(0, 20)}...` : null,
        },
        localStorage: {
          accessToken: lsAccessToken ? `${lsAccessToken.substring(0, 20)}...` : null,
          refreshToken: lsRefreshToken ? `${lsRefreshToken.substring(0, 20)}...` : null,
          user: lsUser ? 'Present' : null,
          userOld: lsUserOld ? 'Present' : null,
          tokenExpires: lsTokenExpires ? new Date(parseInt(lsTokenExpires)).toLocaleString() : null,
          refreshExpires: lsRefreshExpires ? new Date(parseInt(lsRefreshExpires)).toLocaleString() : null,
        },
        
        // Network error tracking
        networkErrorCount: (parentAuthService as any).networkErrorCount,
        maxNetworkErrors: (parentAuthService as any).maxNetworkErrors,
        isAutoRefreshDisabled: parentAuthService.isAutoRefreshDisabled(),
      });
    };

    gatherDebugInfo();
    
    // Refresh debug info every 2 seconds
    const interval = setInterval(gatherDebugInfo, 2000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, user]);

  const handleTestTokenRefresh = async () => {
    console.log('🔄 Testing token refresh...');
    try {
      const result = await parentAuthService.refreshToken();
      console.log('Token refresh result:', result);
      alert(`Token refresh ${result ? 'successful' : 'failed'}`);
    } catch (error) {
      console.error('Token refresh error:', error);
      alert(`Token refresh error: ${error}`);
    }
  };

  const handleTestSessionValidation = async () => {
    console.log('🔍 Testing session validation...');
    try {
      const result = await parentAuthService.validateSession();
      console.log('Session validation result:', result);
      alert(`Session validation ${result ? 'successful' : 'failed'}`);
    } catch (error) {
      console.error('Session validation error:', error);
      alert(`Session validation error: ${error}`);
    }
  };

  const handleClearSession = () => {
    console.log('🗑️ Clearing session...');
    parentAuthService.clearSession();
    alert('Session cleared');
  };

  const handleTestConnectivity = async () => {
    console.log('🌐 Testing connectivity...');
    try {
      const result = await parentAuthService.testConnectivity();
      console.log('Connectivity test result:', result);
      alert(`Connectivity test ${result ? 'successful' : 'failed'}`);
    } catch (error) {
      console.error('Connectivity test error:', error);
      alert(`Connectivity test error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth State */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Authentication State</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Authenticated:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugInfo.isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Loading:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {debugInfo.isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">User Email:</span> 
              <span className="ml-2">{debugInfo.user?.email || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">User Role:</span> 
              <span className="ml-2">{debugInfo.user?.role || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Token Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Token Status</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Access Token:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.accessToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugInfo.accessToken || 'None'}
              </span>
            </div>
            <div>
              <span className="font-medium">Refresh Token:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.refreshToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {debugInfo.refreshToken || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Cookie Storage */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Cookie Storage</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Access Token:</span> 
              <span className="ml-2">{debugInfo.cookies?.accessToken || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Refresh Token:</span> 
              <span className="ml-2">{debugInfo.cookies?.refreshToken || 'None'}</span>
            </div>
          </div>
        </div>

        {/* localStorage */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">localStorage</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Access Token:</span> 
              <span className="ml-2">{debugInfo.localStorage?.accessToken || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Refresh Token:</span> 
              <span className="ml-2">{debugInfo.localStorage?.refreshToken || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">User Data:</span> 
              <span className="ml-2">{debugInfo.localStorage?.user || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">User Data (Old):</span> 
              <span className="ml-2">{debugInfo.localStorage?.userOld || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Token Expires:</span> 
              <span className="ml-2">{debugInfo.localStorage?.tokenExpires || 'None'}</span>
            </div>
            <div>
              <span className="font-medium">Refresh Expires:</span> 
              <span className="ml-2">{debugInfo.localStorage?.refreshExpires || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Network Status</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Network Errors:</span> 
              <span className="ml-2">{debugInfo.networkErrorCount || 0} / {debugInfo.maxNetworkErrors || 0}</span>
            </div>
            <div>
              <span className="font-medium">Auto-refresh Disabled:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${debugInfo.isAutoRefreshDisabled ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {debugInfo.isAutoRefreshDisabled ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">Test Actions</h2>
          <div className="space-y-2">
            <button 
              onClick={handleTestTokenRefresh}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Token Refresh
            </button>
            <button 
              onClick={handleTestSessionValidation}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Session Validation
            </button>
            <button 
              onClick={handleTestConnectivity}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Test Connectivity
            </button>
            <button 
              onClick={handleClearSession}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Session
            </button>
          </div>
        </div>
      </div>

      {/* Raw Debug Data */}
      <div className="mt-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Raw Debug Data</h2>
        <pre className="text-xs overflow-auto max-h-96">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
}



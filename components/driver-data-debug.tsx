'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';

interface DriverDataDebugProps {
  showDetails?: boolean;
}

export default function DriverDataDebug({ showDetails = false }: DriverDataDebugProps) {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const [debugData, setDebugData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const gatherDebugData = async () => {
      if (!isAuthenticated || userType !== 'driver' || !user) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check localStorage
        const storageData = {
          driverUser: localStorage.getItem('tms_driver_user'),
          driverSession: localStorage.getItem('tms_driver_session'),
          driverData: localStorage.getItem('tms_driver_data'),
          accessToken: localStorage.getItem('tms_access_token'),
          refreshToken: localStorage.getItem('tms_refresh_token')
        };

        // Test API calls
        let routesData = null;
        let profileData = null;

        try {
          const routesResponse = await fetch(`/api/driver/routes?driverId=${encodeURIComponent(user.id)}`);
          routesData = await routesResponse.json();
        } catch (e) {
          routesData = { error: e.message };
        }

        try {
          const profileResponse = await fetch('/api/driver/profile');
          profileData = await profileResponse.json();
        } catch (e) {
          profileData = { error: e.message };
        }

        // Test driver helpers
        let helpersData = null;
        try {
          helpersData = await driverHelpers.getAssignedRoutes(user.id);
        } catch (e) {
          helpersData = { error: e.message };
        }

        setDebugData({
          auth: {
            isAuthenticated,
            userType,
            user: {
              id: user.id,
              email: user.email,
              name: user.driver_name || user.full_name || user.name
            }
          },
          storage: storageData,
          apis: {
            routes: routesData,
            profile: profileData
          },
          helpers: helpersData
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    gatherDebugData();
  }, [isAuthenticated, userType, user]);

  if (!isAuthenticated || userType !== 'driver') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Driver Data Debug</h3>
        <p className="text-yellow-700">
          {!isAuthenticated ? 'Not authenticated' : 'Not a driver user'}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Driver Data Debug</h3>
        <p className="text-blue-700">Loading debug data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Driver Data Debug</h3>
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Driver Data Debug</h3>
      
      {/* Authentication Status */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Authentication</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Status: <span className="font-mono">{debugData.auth?.isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}</span></div>
          <div>Type: <span className="font-mono">{debugData.auth?.userType}</span></div>
          <div>ID: <span className="font-mono">{debugData.auth?.user?.id}</span></div>
          <div>Email: <span className="font-mono">{debugData.auth?.user?.email}</span></div>
        </div>
      </div>

      {/* Storage Status */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Local Storage</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(debugData.storage || {}).map(([key, value]) => (
            <div key={key}>
              {key}: <span className="font-mono">{value ? '✅ Present' : '❌ Missing'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* API Status */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">API Status</h4>
        <div className="space-y-2 text-sm">
          <div>
            Routes API: <span className="font-mono">
              {debugData.apis?.routes?.success ? '✅ Working' : '❌ Failed'}
            </span>
            {debugData.apis?.routes?.routes && (
              <span className="ml-2">({debugData.apis.routes.routes.length} routes)</span>
            )}
          </div>
          <div>
            Profile API: <span className="font-mono">
              {debugData.apis?.profile?.success ? '✅ Working' : '❌ Failed'}
            </span>
          </div>
        </div>
      </div>

      {/* Helpers Status */}
      <div className="mb-4">
        <h4 className="font-medium text-gray-700 mb-2">Driver Helpers</h4>
        <div className="text-sm">
          Status: <span className="font-mono">
            {Array.isArray(debugData.helpers) ? '✅ Working' : '❌ Failed'}
          </span>
          {Array.isArray(debugData.helpers) && (
            <span className="ml-2">({debugData.helpers.length} routes)</span>
          )}
        </div>
      </div>

      {/* Detailed Data (if requested) */}
      {showDetails && (
        <div className="mt-4">
          <h4 className="font-medium text-gray-700 mb-2">Detailed Data</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="font-medium text-gray-700 mb-2">Summary</h4>
        <div className="text-sm">
          {debugData.auth?.isAuthenticated && 
           debugData.storage?.driverUser && 
           debugData.apis?.routes?.success ? (
            <div className="text-green-700">
              ✅ Driver data fetching is working correctly
            </div>
          ) : (
            <div className="text-red-700">
              ❌ Issues detected with driver data fetching
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

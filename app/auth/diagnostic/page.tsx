'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import parentAuthServiceV2 from '@/lib/auth/parent-auth-service-v2';

interface EndpointTest {
  endpoint: string;
  status: string;
  error?: string;
}

interface DiagnosticInfo {
  baseURL: string;
  appId: string;
  apiKey: string;
  redirectUri: string;
  hasAccessToken: boolean;
  hasUser: boolean;
  isTokenExpired: boolean;
  authEndpoints: string[];
  tokenEndpoints: string[];
}

export default function AuthDiagnosticPage() {
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo | null>(null);
  const [endpointTests, setEndpointTests] = useState<EndpointTest[]>([]);
  const [testing, setTesting] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    const info = parentAuthServiceV2.getDiagnosticInfo();
    setDiagnosticInfo(info);
    addLog('Diagnostic page loaded');
  }, []);

  const testEndpoints = async () => {
    setTesting(true);
    addLog('Starting endpoint tests...');
    
    try {
      const results = await parentAuthServiceV2.testAuthorizationEndpoints();
      setEndpointTests(results);
      addLog(`Tested ${results.length} endpoints`);
    } catch (error) {
      addLog(`Error testing endpoints: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const testPrimaryAuth = () => {
    addLog('Testing primary authorization URL...');
    const authUrl = parentAuthServiceV2.getAuthorizationUrl();
    addLog(`Generated URL: ${authUrl}`);
    window.open(authUrl, '_blank');
  };

  const testAlternativeAuth = () => {
    addLog('Testing alternative authorization URL...');
    const authUrl = parentAuthServiceV2.getAlternativeAuthorizationUrl();
    addLog(`Generated alternative URL: ${authUrl}`);
    window.open(authUrl, '_blank');
  };

  const testDirectAPI = async () => {
    addLog('Testing direct API call...');
    
    try {
      const response = await fetch('https://my.jkkn.ac.in/api/health', {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        const data = await response.text();
        addLog(`API Health Check: SUCCESS - ${data}`);
      } else {
        addLog(`API Health Check: FAILED - ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addLog(`API Health Check: ERROR - ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearTokens = () => {
    parentAuthServiceV2.clearTokens();
    addLog('Tokens cleared');
    // Refresh diagnostic info
    const info = parentAuthServiceV2.getDiagnosticInfo();
    setDiagnosticInfo(info);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Parent App Authentication Diagnostic
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Debug and test the MYJKKN parent app integration
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Diagnostic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Current Configuration
              </h2>
              {diagnosticInfo && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Base URL</dt>
                      <dd className="text-sm text-gray-900 font-mono">{diagnosticInfo.baseURL}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">App ID</dt>
                      <dd className="text-sm text-gray-900 font-mono">{diagnosticInfo.appId}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">API Key</dt>
                      <dd className="text-sm text-gray-900">{diagnosticInfo.apiKey}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Redirect URI</dt>
                      <dd className="text-sm text-gray-900 font-mono">{diagnosticInfo.redirectUri}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Has Access Token</dt>
                      <dd className={`text-sm font-semibold ${diagnosticInfo.hasAccessToken ? 'text-green-600' : 'text-red-600'}`}>
                        {diagnosticInfo.hasAccessToken ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Has User Data</dt>
                      <dd className={`text-sm font-semibold ${diagnosticInfo.hasUser ? 'text-green-600' : 'text-red-600'}`}>
                        {diagnosticInfo.hasUser ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Token Expired</dt>
                      <dd className={`text-sm font-semibold ${diagnosticInfo.isTokenExpired ? 'text-red-600' : 'text-green-600'}`}>
                        {diagnosticInfo.isTokenExpired ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            {/* Test Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Test Actions
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Button 
                  onClick={testEndpoints} 
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? 'Testing...' : 'Test All Endpoints'}
                </Button>
                
                <Button 
                  onClick={testPrimaryAuth}
                  variant="outline"
                  className="w-full"
                >
                  Test Primary Auth URL
                </Button>
                
                <Button 
                  onClick={testAlternativeAuth}
                  variant="outline"
                  className="w-full"
                >
                  Test Alternative Auth URL
                </Button>
                
                <Button 
                  onClick={testDirectAPI}
                  variant="outline"
                  className="w-full"
                >
                  Test Direct API Call
                </Button>
                
                <Button 
                  onClick={clearTokens}
                  variant="destructive"
                  className="w-full"
                >
                  Clear All Tokens
                </Button>
                
                <Button 
                  onClick={clearLogs}
                  variant="secondary"
                  className="w-full"
                >
                  Clear Logs
                </Button>
              </div>
            </div>

            {/* Endpoint Test Results */}
            {endpointTests.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Endpoint Test Results
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {endpointTests.map((test, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="font-mono text-sm">{test.endpoint}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            test.status === 'accessible' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {test.status}
                          </span>
                          {test.error && (
                            <span className="text-xs text-gray-500 max-w-xs truncate" title={test.error}>
                              {test.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Available Endpoints */}
            {diagnosticInfo && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Available Endpoints
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Authorization Endpoints</h3>
                    <ul className="space-y-1">
                      {diagnosticInfo.authEndpoints.map((endpoint, index) => (
                        <li key={index} className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                          {endpoint}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Token Endpoints</h3>
                    <ul className="space-y-1">
                      {diagnosticInfo.tokenEndpoints.map((endpoint, index) => (
                        <li key={index} className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                          {endpoint}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Logs */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Debug Logs
              </h2>
              <div className="bg-black text-green-400 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <div className="text-gray-500">No logs yet...</div>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manual URL Testing */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Manual URL Testing
              </h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">Current Issue: 500 Internal Server Error</h3>
                <p className="text-sm text-yellow-700 mb-4">
                  The parent app is returning a 500 error, which suggests an internal server issue. 
                  Try these alternative approaches:
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>1. Contact MYJKKN Support:</strong> The app might not be properly registered
                  </div>
                  <div>
                    <strong>2. Verify Credentials:</strong> Ensure the app_id and api_key are correct
                  </div>
                  <div>
                    <strong>3. Check Redirect URI:</strong> Ensure it's registered in the parent system
                  </div>
                  <div>
                    <strong>4. Try Alternative Endpoints:</strong> Use the buttons above to test different endpoints
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function CallbackDebugPage() {
  const searchParams = useSearchParams();
  const [allParams, setAllParams] = useState<Record<string, string>>({});
  const [timestamps, setTimestamps] = useState<string>('');

  useEffect(() => {
    // Get all URL parameters
    const params: Record<string, string> = {};
    if (searchParams) {
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }
    
    setAllParams(params);
    setTimestamps(new Date().toISOString());

    // Also log to console for debugging
    console.log('OAuth Callback Debug - URL Parameters:', params);
    console.log('OAuth Callback Debug - Full URL:', window.location.href);
    console.log('OAuth Callback Debug - Referrer:', document.referrer);
  }, [searchParams]);

  const hasCode = allParams.code;
  const hasError = allParams.error;
  const hasState = allParams.state;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            OAuth Callback Debug
          </h1>
          <p className="text-gray-600">
            Debug information for OAuth authentication callback
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Timestamp: {timestamps}
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Authorization Code Status */}
          <div className={`bg-white rounded-lg border-2 p-6 ${
            hasCode ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center">
              <div className={`rounded-full p-2 ${
                hasCode ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                {hasCode ? '✓' : '✗'}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Authorization Code
                </h3>
                <p className={`text-sm ${
                  hasCode ? 'text-green-600' : 'text-red-600'
                }`}>
                  {hasCode ? 'Present' : 'Missing'}
                </p>
              </div>
            </div>
          </div>

          {/* State Parameter Status */}
          <div className={`bg-white rounded-lg border-2 p-6 ${
            hasState ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
          }`}>
            <div className="flex items-center">
              <div className={`rounded-full p-2 ${
                hasState ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
              }`}>
                {hasState ? '✓' : '⚠'}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  State Parameter
                </h3>
                <p className={`text-sm ${
                  hasState ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {hasState ? 'Present' : 'Missing'}
                </p>
              </div>
            </div>
          </div>

          {/* Error Status */}
          <div className={`bg-white rounded-lg border-2 p-6 ${
            hasError ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
          }`}>
            <div className="flex items-center">
              <div className={`rounded-full p-2 ${
                hasError ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}>
                {hasError ? '✗' : '✓'}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Error Status
                </h3>
                <p className={`text-sm ${
                  hasError ? 'text-red-600' : 'text-green-600'
                }`}>
                  {hasError ? 'Error Present' : 'No Error'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              URL Parameters Received
            </h2>
          </div>
          <div className="px-6 py-4">
            {Object.keys(allParams).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No URL parameters received</p>
                <p className="text-sm text-gray-400 mt-2">
                  This usually means the OAuth provider didn't redirect with parameters
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(allParams).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 pb-3">
                    <div className="w-32 flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {key}
                      </span>
                    </div>
                    <div className="flex-1 mt-1 sm:mt-0 sm:ml-4">
                      <code className="text-sm text-gray-900 bg-gray-50 px-3 py-1 rounded border break-all">
                        {value}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Current Configuration
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-40 text-sm font-medium text-gray-700">Parent App URL:</span>
                <code className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
                  {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PARENT_APP_URL}
                </code>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-40 text-sm font-medium text-gray-700">App ID:</span>
                <code className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
                  {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_APP_ID}
                </code>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-40 text-sm font-medium text-gray-700">Redirect URI:</span>
                <code className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded">
                  {typeof window !== 'undefined' && process.env.NEXT_PUBLIC_REDIRECT_URI}
                </code>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="w-40 text-sm font-medium text-gray-700">Current URL:</span>
                <code className="text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded break-all">
                  {typeof window !== 'undefined' && window.location.href}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            Troubleshooting
          </h2>
          <div className="space-y-2 text-sm text-blue-800">
            {!hasCode && !hasError && (
              <p>• No authorization code received - check if redirect URI is configured correctly in parent app</p>
            )}
            {hasError && (
              <p>• OAuth error received: {allParams.error} - {allParams.error_description}</p>
            )}
            {!hasState && (
              <p>• No state parameter - this could indicate a security issue</p>
            )}
            {hasCode && hasState && (
              <p className="text-green-800 font-medium">✓ OAuth callback appears successful</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-x-4">
          <Link 
            href="/login" 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to Login
          </Link>
          
          {hasCode && (
            <Link 
              href="/auth/callback"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Normal Callback
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}






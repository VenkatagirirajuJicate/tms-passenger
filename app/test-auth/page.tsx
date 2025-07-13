'use client';

import React, { useState } from 'react';
import { sessionManager } from '@/lib/session';
import toast from 'react-hot-toast';

export default function TestAuthPage() {
  const [authResult, setAuthResult] = useState<any>(null);
  const [apiResult, setApiResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const testSessionData = () => {
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      const student = sessionManager.getCurrentStudent();
      
      console.log('Session data:', {
        session,
        studentId,
        student
      });
      
      setAuthResult({
        hasSession: !!session,
        hasEmail: !!session?.user?.email,
        hasStudentId: !!studentId,
        email: session?.user?.email,
        studentId: studentId,
        student: student,
        isAuthenticated: sessionManager.isAuthenticated(),
        fullSession: session
      });
      
      if (session?.user?.email && studentId) {
        toast.success('Session data is valid!');
      } else {
        toast.error('Session data is invalid!');
      }
    } catch (error) {
      console.error('Session test error:', error);
      toast.error('Session test failed');
    }
  };
  
  const testAPI = async () => {
    setIsLoading(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        toast.error('No session data available');
        return;
      }
      
      const response = await fetch('/api/test-auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        },
      });
      
      const data = await response.json();
      
      setApiResult({
        status: response.status,
        ok: response.ok,
        data: data,
        headers: {
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        }
      });
      
      if (response.ok) {
        toast.success('API test passed!');
      } else {
        toast.error('API test failed!');
      }
    } catch (error) {
      console.error('API test error:', error);
      toast.error('API test failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  const testGrievanceAPI = async () => {
    setIsLoading(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        toast.error('No session data available');
        return;
      }
      
      // Use a test grievance ID - this should return a 404 if the ID doesn't exist
      const testGrievanceId = 'test-grievance-id';
      
      const response = await fetch(`/api/grievances/${testGrievanceId}/communications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        },
      });
      
      const data = await response.json();
      
      setApiResult({
        endpoint: `/api/grievances/${testGrievanceId}/communications`,
        status: response.status,
        ok: response.ok,
        data: data,
        headers: {
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        }
      });
      
      if (response.status === 404) {
        toast.success('API is working! (404 expected for test ID)');
      } else if (response.ok) {
        toast.success('API test passed with real data!');
      } else {
        toast.error(`API test failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Grievance API test error:', error);
      toast.error('Grievance API test failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Test</h1>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Session Data Test</h2>
          <button
            onClick={testSessionData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Session Data
          </button>
          
          {authResult && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Session Test Results:</h3>
              <pre className="text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(authResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">API Tests</h2>
          <div className="space-x-4">
            <button
              onClick={testAPI}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Auth API'}
            </button>
            
            <button
              onClick={testGrievanceAPI}
              disabled={isLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Grievance API'}
            </button>
          </div>
          
          {apiResult && (
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">API Test Results:</h3>
              <pre className="text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { sessionManager } from '@/lib/session';
import toast from 'react-hot-toast';

export default function DebugAuth() {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const testAuth = async () => {
    setIsLoading(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      console.log('Session:', session);
      console.log('Student ID:', studentId);
      
      setDebugResult({
        hasSession: !!session,
        hasEmail: !!session?.user?.email,
        hasStudentId: !!studentId,
        sessionUser: session?.user,
        studentId: studentId,
        isAuthenticated: sessionManager.isAuthenticated()
      });
      
      if (!session?.user?.email || !studentId) {
        toast.error('Authentication data missing');
        return;
      }

      toast.success('Authentication data found!');
      
    } catch (error) {
      console.error('Error:', error);
      setDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('Authentication test failed');
    } finally {
      setIsLoading(false);
    }
  };

  const testGroupChatAPI = async () => {
    setIsLoading(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      if (!session?.user?.email || !studentId) {
        toast.error('Authentication data missing');
        return;
      }

      // Test with a dummy grievance ID
      const dummyGrievanceId = 'test-123';
      
      console.log('Testing group chat API with:', {
        email: session.user.email,
        studentId: studentId,
        grievanceId: dummyGrievanceId
      });

      const response = await fetch(`/api/grievances/${dummyGrievanceId}/communications`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        },
      });

      const data = await response.json();
      
      setDebugResult({
        apiCall: true,
        status: response.status,
        ok: response.ok,
        headers: {
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId,
        },
        response: data
      });
      
      if (response.ok) {
        toast.success('API call successful!');
      } else {
        toast.error(`API call failed: ${data.error}`);
      }
      
    } catch (error) {
      console.error('API test error:', error);
      setDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast.error('API test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">Debug Authentication</h3>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={testAuth}
            disabled={isLoading}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Session Data'}
          </button>
          
          <button
            onClick={testGroupChatAPI}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Testing...' : 'Test Group Chat API'}
          </button>
        </div>
        
        {debugResult && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Debug Results:</h4>
            <pre className="text-sm text-gray-800 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(debugResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 
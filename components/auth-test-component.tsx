'use client';

import React, { useState } from 'react';
import { sessionManager } from '@/lib/session';
import toast from 'react-hot-toast';

export default function AuthTestComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testAuth = async () => {
    setIsLoading(true);
    try {
      const session = sessionManager.getSession();
      const studentId = sessionManager.getCurrentStudentId();
      
      console.log('Session:', session);
      console.log('Student ID:', studentId);
      
      if (!session?.user?.email || !studentId) {
        toast.error('No session data found');
        setResult({ error: 'No session data found' });
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
      console.log('API Response:', data);
      setResult(data);
      
      if (data.success) {
        toast.success('Authentication test passed!');
      } else {
        toast.error('Authentication test failed');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Test failed');
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Authentication Test</h3>
      <button
        onClick={testAuth}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Authentication'}
      </button>
      
      {result && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h4 className="font-semibold">Result:</h4>
          <pre className="text-sm whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 
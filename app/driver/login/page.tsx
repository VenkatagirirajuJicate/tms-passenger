'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function DriverLoginPage() {
  const router = useRouter();
  const { loginDriverDirect } = useAuth();
  const [email, setEmail] = useState('arthanareswaran22@jkkn.ac.in');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🚗 Driver login attempt using auth context:', { email, hasPassword: !!password });

      // Use the auth context's loginDriverDirect method
      const loginSuccess = await loginDriverDirect(email, password);
      
      if (loginSuccess) {
        console.log('✅ Driver login successful via auth context');
        setSuccess('Login successful! Redirecting to driver dashboard...');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/driver');
        }, 1500);
      } else {
        throw new Error('Driver login failed. Please check your credentials.');
      }

    } catch (error) {
      console.error('❌ Driver login error:', error);
      
      // Handle specific error types gracefully
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = 'Invalid credentials. Please check your email and password.';
        } else if (error.message.includes('forbidden') || error.message.includes('403')) {
          errorMessage = 'Access denied. This account may not have driver privileges.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = 'Account not found. Please check your email or contact support.';
        } else if (error.message.includes('server') || error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (error.message.includes('credentials')) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Auto-clear error after 8 seconds
      setTimeout(() => setError(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  const createDriverAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/create-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Arthanareswaran',
          email: email,
          phone: '9876543210',
          licenseNumber: 'DL123456789',
          password: password || 'temp123', // Temporary password
          adminKey: 'admin_setup_key'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setSuccess('Driver account created successfully! You can now login.');
      } else {
        throw new Error(result.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('❌ Account creation error:', error);
      
      // Handle specific error types gracefully
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
          errorMessage = 'Unauthorized. Admin key may be invalid.';
        } else if (error.message.includes('forbidden') || error.message.includes('403')) {
          errorMessage = 'Access denied. Contact administrator for assistance.';
        } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          errorMessage = 'Account already exists. Please try logging in instead.';
        } else if (error.message.includes('server') || error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Auto-clear error after 8 seconds
      setTimeout(() => setError(null), 8000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Driver Login
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Direct authentication - No OAuth required
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
            {error.includes('not found') && (
              <div className="mt-3">
                <button
                  onClick={createDriverAccount}
                  disabled={loading}
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Driver Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {error?.includes('not found') ? 'Creating Account...' : 'Signing in...'}
                </div>
              ) : (
                'Sign in as Driver'
              )}
            </button>
          </div>

          {/* Alternative Options */}
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-green-600 hover:text-green-700 underline"
            >
              ← Back to main login
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Direct Authentication</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ✅ No OAuth - bypasses parent app completely</li>
            <li>• ✅ No confirmation token errors</li>
            <li>• ✅ Direct database authentication</li>
            <li>• ✅ Works even when parent app is down</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function DriverLoginPage() {
  const router = useRouter();
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
      console.log('🚗 Direct driver login attempt (no OAuth):', { email, hasPassword: !!password });

      // First, let's check if the driver account exists
      const checkResponse = await fetch('/api/check-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const checkResult = await checkResponse.json();
      console.log('Driver account check:', checkResult);

      if (!checkResult.exists) {
        throw new Error('Driver account not found. Please contact administration to create your account.');
      }

      if (!checkResult.hasPassword) {
        throw new Error('Driver account exists but password is not set. Please contact administration.');
      }

      if (!checkResult.isActive) {
        throw new Error('Driver account is not active. Please contact administration.');
      }

      // Now try to authenticate
      const loginResponse = await fetch('/api/auth/driver-direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          app_id: 'transport_management_system_menrm674',
          api_key: 'app_e20655605d48ebce_cfa1ffe34268949a'
        })
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const loginData = await loginResponse.json();
      console.log('✅ Driver login successful:', loginData);

      // Store authentication data in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('tms_driver_user', JSON.stringify(loginData.user));
        localStorage.setItem('tms_driver_token', loginData.access_token);
        localStorage.setItem('tms_driver_expires', loginData.session?.expires_at || (Date.now() + 24 * 60 * 60 * 1000));
        
        // Also set cookies for session management
        const maxAge = 24 * 60 * 60; // 24 hours
        document.cookie = `tms_driver_token=${loginData.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        if (loginData.refresh_token) {
          document.cookie = `tms_driver_refresh=${loginData.refresh_token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        }
      }

      setSuccess('Login successful! Redirecting to driver dashboard...');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/driver');
      }, 1500);

    } catch (error) {
      console.error('❌ Driver login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
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
      setError(error instanceof Error ? error.message : 'Failed to create account');
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Authentication Error</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
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

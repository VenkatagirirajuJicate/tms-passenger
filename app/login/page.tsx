'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Phone, Lock, Mail, GraduationCap, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import { isValidEmail, validatePassword, getErrorMessage } from '@/lib/utils';

type LoginMode = 'regular' | 'first-time';
type AuthMethod = 'mobile' | 'dob';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('regular');
  const [authMethod, setAuthMethod] = useState<AuthMethod>('mobile');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Regular login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // First-time login form state
  const [firstTimeEmail, setFirstTimeEmail] = useState('');
  const [firstTimeMobile, setFirstTimeMobile] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted before rendering forms
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Validation functions
  const validateRegularLogin = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFirstTimeLogin = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstTimeEmail.trim()) {
      newErrors.firstTimeEmail = 'Email is required';
    } else if (!isValidEmail(firstTimeEmail)) {
      newErrors.firstTimeEmail = 'Please enter a valid email address';
    }

    // Validate authentication method specific fields
    if (authMethod === 'mobile') {
      if (!firstTimeMobile.trim()) {
        newErrors.firstTimeMobile = 'Mobile number is required';
      } else if (!/^[6-9]\d{9}$/.test(firstTimeMobile)) {
        newErrors.firstTimeMobile = 'Please enter a valid 10-digit mobile number';
      }
    } else if (authMethod === 'dob') {
      if (!dateOfBirth.trim()) {
        newErrors.dateOfBirth = 'Date of birth is required';
      } else {
        const dobDate = new Date(dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dobDate.getFullYear();
        
        if (isNaN(dobDate.getTime())) {
          newErrors.dateOfBirth = 'Please enter a valid date';
        } else if (dobDate > today) {
          newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        } else if (age < 16 || age > 100) {
          newErrors.dateOfBirth = 'Please enter a valid date of birth';
        }
      }
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        newErrors.newPassword = passwordValidation.errors[0];
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle regular login
  const handleRegularLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRegularLogin()) return;

    setIsLoading(true);
    try {
      const { user, session, student } = await studentHelpers.signIn(email, password);
      
      // Store session using session manager with the correct structure
      sessionManager.setSession({
        user: user,
        session: {
          access_token: session.access_token,
          expires_at: session.expires_at,
          refresh_token: session.refresh_token
        }
      });
      
      toast.success(`Welcome back, ${student.student_name}!`);
      router.push('/dashboard');
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage.includes('first time login')) {
        toast.error('Please complete your first-time setup using external authentication');
        setMode('first-time');
        setFirstTimeEmail(email);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle first-time login
  const handleFirstTimeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFirstTimeLogin()) return;

    setIsLoading(true);
    try {
      let response;
      
      if (authMethod === 'mobile') {
        // Mobile number authentication via external API
        response = await fetch('/api/auth/external-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: firstTimeEmail,
            mobile: firstTimeMobile,
            newPassword
          }),
        });
      } else {
        // Date of birth authentication via first-login API
        response = await fetch('/api/auth/first-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: firstTimeEmail,
            dateOfBirth: dateOfBirth,
            newPassword
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      toast.success(`Welcome to TMS, ${data.student.student_name}! Your account has been set up successfully.`);
      
      // Now sign in the user to create a session
      const { user, session } = await studentHelpers.signIn(firstTimeEmail, newPassword);
      
      // Store session using session manager with the correct structure
      sessionManager.setSession({
        user: user,
        session: {
          access_token: session.access_token,
          expires_at: session.expires_at,
          refresh_token: session.refresh_token
        }
      });
      
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setErrors({});
    // Clear form fields when switching modes
    if (newMode === 'regular') {
      setFirstTimeEmail('');
      setFirstTimeMobile('');
      setDateOfBirth('');
      setNewPassword('');
      setConfirmPassword('');
      setAuthMethod('mobile'); // Reset to default auth method
    } else {
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Student Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            MYJKKN TMS - JKKN College Transport
          </p>
        </div>

        {/* Mode Toggle */}
        {isMounted ? (
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => switchMode('regular')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                mode === 'regular'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode('first-time')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                mode === 'first-time'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              First Time Setup
            </button>
          </div>
        ) : (
          <div className="flex rounded-lg bg-gray-100 p-1 animate-pulse">
            <div className="flex-1 py-2 px-4 bg-gray-200 rounded-md"></div>
            <div className="flex-1 py-2 px-4 bg-gray-200 rounded-md"></div>
          </div>
        )}

        {/* Login Forms */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg">
          {isMounted ? (
            mode === 'regular' ? (
              // Regular Login Form
              <form onSubmit={handleRegularLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-12 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
            ) : (
              // First-Time Login Form
              <form onSubmit={handleFirstTimeLogin} className="space-y-6">
                <div>
                  <label htmlFor="firstTimeEmail" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstTimeEmail"
                      name="firstTimeEmail"
                      type="email"
                      value={firstTimeEmail}
                      onChange={(e) => setFirstTimeEmail(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.firstTimeEmail ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your registered email"
                    />
                  </div>
                  {errors.firstTimeEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstTimeEmail}</p>
                  )}
                </div>

                {/* Authentication Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Verification Method
                  </label>
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('mobile');
                        setDateOfBirth(''); // Clear DOB when switching to mobile
                        setErrors({}); // Clear any validation errors
                      }}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
                        authMethod === 'mobile'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Phone className="h-4 w-4" />
                      <span>Mobile Number</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('dob');
                        setFirstTimeMobile(''); // Clear mobile when switching to DOB
                        setErrors({}); // Clear any validation errors
                      }}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${
                        authMethod === 'dob'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Date of Birth</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Authentication Fields */}
                {authMethod === 'mobile' ? (
                  <div>
                    <label htmlFor="firstTimeMobile" className="block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="firstTimeMobile"
                        name="firstTimeMobile"
                        type="tel"
                        value={firstTimeMobile}
                        onChange={(e) => setFirstTimeMobile(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.firstTimeMobile ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your mobile number"
                      />
                    </div>
                    {errors.firstTimeMobile && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstTimeMobile}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your mobile number registered in the system
                    </p>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                        }`}
                        max={new Date().toISOString().split('T')[0]} // Prevent future dates
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Enter your date of birth as registered in the system
                    </p>
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`block w-full pl-10 pr-12 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.newPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`block w-full pl-10 pr-12 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Setting up account...' : 'Complete Setup'}
                  </button>
                </div>
              </form>
            )
          ) : (
            // Loading skeleton for forms
            <div className="space-y-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center">
          <div className="text-sm text-gray-600">
            {mode === 'regular' ? (
              <p>
                First time user?{' '}
                <button
                  onClick={() => switchMode('first-time')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Complete your first-time login
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('regular')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>Need help? Contact your transport administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
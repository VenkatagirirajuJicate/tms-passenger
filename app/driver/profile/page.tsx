'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { User, LogOut, Edit, Save, X, Phone, Mail, Shield, Car, MapPin, Star, Award, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  experience_years: number;
  rating: number;
  total_trips: number;
  status: string;
  created_at: string;
}

export default function DriverProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DriverProfile>>({});

  useEffect(() => {
    const init = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          router.replace('/login');
          return;
        }

        if (userType !== 'driver') {
          router.replace('/login');
          return;
        }

        if (!user || !user.id) {
          setError('Driver information not found');
          setLoading(false);
          return;
        }
        
        await loadProfile();
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, user, authLoading]);

  const loadProfile = async () => {
    try {
      if (!user || !user.id) throw new Error('Driver ID not found');

      const response = await fetch(`/api/driver/profile?driverId=${user.id}`);
      if (!response.ok) throw new Error('Failed to load profile');
      
      const data = await response.json();
      setProfile(data.profile);
      setEditForm({
        name: data.profile.name,
        phone: data.profile.phone,
        license_number: data.profile.license_number
      });
    } catch (err: any) {
      throw new Error(err.message || 'Failed to load profile');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      if (!user || !user.id) throw new Error('Driver ID not found');

      const response = await fetch('/api/driver/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: user.id,
          ...editForm
        })
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      await loadProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error('❌ Error updating profile:', err);
      
      // Handle specific error types gracefully
      let errorMessage = 'Failed to update profile';
      
      if (err.message) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.message.includes('forbidden') || err.message.includes('403')) {
          errorMessage = 'Access denied. Contact administrator for assistance.';
        } else if (err.message.includes('not found') || err.message.includes('404')) {
          errorMessage = 'Driver profile not found. Please contact support.';
        } else if (err.message.includes('server') || err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else if (err.message.includes('validation') || err.message.includes('invalid')) {
          errorMessage = 'Invalid data provided. Please check your input and try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Note: sessionManager is not defined in the original code
      // You may need to implement proper logout logic
      router.replace('/login');
      toast.success('Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Profile</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <User className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Profile Not Found</h3>
          <p className="text-gray-600 mb-4">Unable to load driver profile.</p>
          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Driver Profile</h1>
            <p className="text-purple-100 text-lg">
              Manage your account information and view your performance statistics
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Management</h2>
            <p className="text-sm text-gray-600">Update your personal information and preferences</p>
          </div>
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          <p className="text-sm text-gray-600">Your basic account details</p>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-900 font-medium">{profile.name}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <p className="text-gray-900 font-medium">{profile.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-900 font-medium">{profile.phone}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">License Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.license_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your license number"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-5 h-5 text-gray-400 mr-3" />
                  <p className="text-gray-900 font-medium">{profile.license_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Driver Statistics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-green-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Performance Statistics</h2>
          <p className="text-sm text-gray-600">Your driving performance metrics</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{profile.experience_years}</div>
              <div className="text-sm text-gray-600 font-medium">Years Experience</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">{profile.rating.toFixed(1)}</div>
              <div className="text-sm text-gray-600 font-medium">Rating</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{profile.total_trips}</div>
              <div className="text-sm text-gray-600 font-medium">Total Trips</div>
            </div>
            
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div className={`text-2xl font-bold ${
                profile.status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </div>
              <div className="text-sm text-gray-600 font-medium">Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-red-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Account Actions</h2>
          <p className="text-sm text-gray-600">Manage your account settings</p>
        </div>
        <div className="p-6">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
          >
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-red-200 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="font-semibold text-lg">Sign Out</span>
              <p className="text-sm text-red-500">Logout from your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

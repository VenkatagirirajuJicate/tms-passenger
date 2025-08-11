'use client';

import React, { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session';
import { useRouter } from 'next/navigation';
import { User, LogOut, Edit, Save, X, Phone, Mail, Shield, Car, MapPin } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<DriverProfile>>({});

  useEffect(() => {
    const init = async () => {
      try {
        if (!sessionManager.isAuthenticated() || !sessionManager.getCurrentDriverId()) {
          router.replace('/login');
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
  }, [router]);

  const loadProfile = async () => {
    try {
      const driverId = sessionManager.getCurrentDriverId();
      if (!driverId) throw new Error('Driver ID not found');

      const response = await fetch(`/api/driver/profile?driverId=${driverId}`);
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
      const driverId = sessionManager.getCurrentDriverId();
      if (!driverId) throw new Error('Driver ID not found');

      const response = await fetch('/api/driver/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          ...editForm
        })
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      await loadProfile();
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      sessionManager.clearSession();
      router.replace('/login');
      toast.success('Logged out successfully');
    } catch (err: any) {
      console.error('Logout error:', err);
      toast.error('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading profile</div>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
        <p className="text-gray-600">Unable to load driver profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <User className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Driver Profile</h2>
              <p className="text-sm text-gray-600">Manage your account information</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Personal Information</h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="text-gray-900">{profile.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <p className="text-gray-900">{profile.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{profile.phone}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.license_number || ''}
                  onChange={(e) => setEditForm({ ...editForm, license_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{profile.license_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Driver Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Driver Statistics</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profile.experience_years}</div>
              <div className="text-sm text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{profile.rating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{profile.total_trips}</div>
              <div className="text-sm text-gray-600">Total Trips</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                profile.status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
              </div>
              <div className="text-sm text-gray-600">Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Account Actions</h3>
        </div>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}

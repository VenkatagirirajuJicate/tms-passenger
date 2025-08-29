'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Settings, Shield, Clock, Wifi, WifiOff, Navigation } from 'lucide-react';
import DriverLocationTracker from '@/components/driver-location-tracker';
import DriverLocationSettings from '@/components/driver-location-settings';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';

interface LocationSettings {
  locationSharingEnabled: boolean;
  locationTrackingEnabled: boolean;
  updateInterval: number;
  shareWithAdmin: boolean;
  shareWithPassengers: boolean;
  trackingStatus: string;
}

const DriverLocationPage = () => {
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [settings, setSettings] = useState<LocationSettings>({
    locationSharingEnabled: false,
    locationTrackingEnabled: false,
    updateInterval: 30000,
    shareWithAdmin: true,
    shareWithPassengers: true,
    trackingStatus: 'inactive'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDriverInfo = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          toast.error('Please log in to access location settings');
          setIsLoading(false);
          return;
        }

        if (userType !== 'driver') {
          toast.error('Only drivers can access location settings');
          setIsLoading(false);
          return;
        }

        if (!user || !user.id) {
          toast.error('Driver information not found');
          setIsLoading(false);
          return;
        }

        setDriverId(user.id);
        setDriverName(user.driver_name || user.full_name || user.name || 'Unknown Driver');
        
      } catch (error) {
        console.error('Error fetching driver info:', error);
        toast.error('Failed to load driver information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDriverInfo();
  }, [isAuthenticated, userType, user, authLoading]);

  const handleSettingsChange = (newSettings: LocationSettings) => {
    setSettings(newSettings);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading location settings...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to access location settings.</p>
      </div>
    );
  }

  if (userType !== 'driver') {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only drivers can access location settings.</p>
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="text-center py-8">
        <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Driver Information Not Found</h2>
        <p className="text-gray-600">Unable to retrieve driver information. Please try logging in again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MapPin className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Location Settings</h2>
              <p className="text-sm text-gray-600">Manage your location sharing preferences</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center text-sm ${
              settings.locationSharingEnabled ? 'text-green-600' : 'text-gray-500'
            }`}>
              {settings.locationSharingEnabled ? (
                <Wifi className="w-4 h-4 mr-1" />
              ) : (
                <WifiOff className="w-4 h-4 mr-1" />
              )}
              {settings.locationSharingEnabled ? 'Sharing' : 'Not Sharing'}
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Current Status</h3>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            settings.trackingStatus === 'active' ? 'bg-green-100 text-green-800' :
            settings.trackingStatus === 'paused' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {settings.trackingStatus}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Update Interval:</span>
            <span className="ml-auto font-medium">{settings.updateInterval / 1000}s</span>
          </div>
          <div className="flex items-center">
            <Navigation className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Tracking:</span>
            <span className={`ml-auto font-medium ${
              settings.locationTrackingEnabled ? 'text-green-600' : 'text-gray-500'
            }`}>
              {settings.locationTrackingEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Location Tracker */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Live Location</h3>
        </div>
        <div className="p-4">
          <DriverLocationTracker 
            driverId={driverId}
            driverName={driverName}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>

      {/* Location Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Settings</h3>
        </div>
        <div className="p-4">
          <DriverLocationSettings 
            driverId={driverId}
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </div>
    </div>
  );
};

export default DriverLocationPage;

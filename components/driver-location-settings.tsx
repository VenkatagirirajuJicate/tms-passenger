'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Settings, Shield, Clock, Wifi, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationSettings {
  locationSharingEnabled: boolean;
  locationTrackingEnabled: boolean;
  updateInterval: number;
  shareWithAdmin: boolean;
  shareWithPassengers: boolean;
  trackingStatus: string;
}

interface DriverLocationSettingsProps {
  driverId: string;
  onSettingsChange?: (settings: LocationSettings) => void;
}

const DriverLocationSettings: React.FC<DriverLocationSettingsProps> = ({
  driverId,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<LocationSettings>({
    locationSharingEnabled: false,
    locationTrackingEnabled: false,
    updateInterval: 30000, // 30 seconds
    shareWithAdmin: true,
    shareWithPassengers: true,
    trackingStatus: 'inactive'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [driverId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/driver/location/settings?driverId=${driverId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading driver location settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: LocationSettings) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/driver/location/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          driverId,
          settings: newSettings
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(newSettings);
          onSettingsChange?.(newSettings);
          toast.success('Location settings updated successfully');
        } else {
          toast.error(data.error || 'Failed to update settings');
        }
      } else {
        toast.error('Failed to update location settings');
      }
    } catch (error) {
      console.error('Error saving driver location settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof LocationSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key]
    };
    
    // If location sharing is disabled, also disable tracking
    if (key === 'locationSharingEnabled' && !newSettings.locationSharingEnabled) {
      newSettings.locationTrackingEnabled = false;
    }
    
    // If tracking is enabled, ensure sharing is also enabled
    if (key === 'locationTrackingEnabled' && newSettings.locationTrackingEnabled) {
      newSettings.locationSharingEnabled = true;
    }
    
    saveSettings(newSettings);
  };

  const handleIntervalChange = (interval: number) => {
    const newSettings = {
      ...settings,
      updateInterval: interval
    };
    saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading location settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Location Settings</h3>
      </div>

      {/* Location Sharing Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900">Location Sharing</h4>
              <p className="text-sm text-gray-600">
                Allow your location to be shared with passengers and administrators
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('locationSharingEnabled')}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.locationSharingEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.locationSharingEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Location Tracking Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Navigation className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Live Location Tracking</h4>
              <p className="text-sm text-gray-600">
                Continuously update your location for real-time tracking
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('locationTrackingEnabled')}
            disabled={isSaving || !settings.locationSharingEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.locationTrackingEnabled ? 'bg-green-600' : 'bg-gray-200'
            } ${!settings.locationSharingEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.locationTrackingEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Update Interval */}
      <div className="mb-6">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <h4 className="font-medium text-gray-900">Update Interval</h4>
            </div>
            <span className="text-sm text-gray-600">
              {settings.updateInterval / 1000} seconds
            </span>
          </div>
          <div className="space-y-2">
            {[15, 30, 60].map((interval) => (
              <button
                key={interval}
                onClick={() => handleIntervalChange(interval * 1000)}
                disabled={isSaving}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  settings.updateInterval === interval * 1000
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {interval} seconds
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sharing Options */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Sharing Options</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-700">Share with Administrators</span>
            </div>
            <span className="text-xs text-green-600 font-medium">Always Enabled</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Share with Passengers</span>
            </div>
            <span className="text-xs text-green-600 font-medium">Always Enabled</span>
          </div>
        </div>
      </div>

      {/* Status Information */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Privacy & Security</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Your location is only shared when you enable location tracking. 
              You can disable sharing at any time to stop location updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLocationSettings;

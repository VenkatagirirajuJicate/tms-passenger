'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Shield, MapPin, Clock, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationSettingsProps {
  studentId: string;
  onSettingsChange?: (settings: LocationSettings) => void;
}

interface LocationSettings {
  locationSharingEnabled: boolean;
  locationTrackingEnabled: boolean;
  updateInterval: number;
  shareWithAdmin: boolean;
  shareWithDriver: boolean;
  shareWithParents: boolean;
}

const LocationSettings: React.FC<LocationSettingsProps> = ({
  studentId,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<LocationSettings>({
    locationSharingEnabled: false,
    locationTrackingEnabled: false,
    updateInterval: 30000, // 30 seconds
    shareWithAdmin: true,
    shareWithDriver: false,
    shareWithParents: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, [studentId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/location/settings?studentId=${studentId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading location settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: LocationSettings) => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/location/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
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
      console.error('Error saving location settings:', error);
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

  const updateIntervals = [
    { value: 15000, label: '15 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 120000, label: '2 minutes' },
    { value: 300000, label: '5 minutes' }
  ];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
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

      {/* Main Location Sharing Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900">Location Sharing</h4>
              <p className="text-sm text-gray-600">
                Allow your location to be shared with authorized personnel
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
            <Clock className="w-5 h-5 text-green-600" />
            <div>
              <h4 className="font-medium text-gray-900">Live Location Tracking</h4>
              <p className="text-sm text-gray-600">
                Continuously track and update your location
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

      {/* Update Interval Selection */}
      {settings.locationSharingEnabled && (
        <div className="mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="w-5 h-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Update Frequency</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              How often should your location be updated?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {updateIntervals.map((interval) => (
                <button
                  key={interval.value}
                  onClick={() => handleIntervalChange(interval.value)}
                  disabled={isSaving}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.updateInterval === interval.value
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {interval.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Controls */}
      {settings.locationSharingEnabled && (
        <div className="mb-6">
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Privacy Controls</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Choose who can see your location information
            </p>
            
            <div className="space-y-3">
              {/* Admin Access */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <h5 className="font-medium text-gray-900">Transport Administrators</h5>
                  <p className="text-sm text-gray-600">Allow admin staff to view your location</p>
                </div>
                <button
                  onClick={() => handleToggle('shareWithAdmin')}
                  disabled={isSaving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.shareWithAdmin ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.shareWithAdmin ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Driver Access */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <h5 className="font-medium text-gray-900">Bus Driver</h5>
                  <p className="text-sm text-gray-600">Allow your assigned driver to see your location</p>
                </div>
                <button
                  onClick={() => handleToggle('shareWithDriver')}
                  disabled={isSaving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.shareWithDriver ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.shareWithDriver ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Parents Access */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                <div>
                  <h5 className="font-medium text-gray-900">Parents/Guardians</h5>
                  <p className="text-sm text-gray-600">Allow parents to view your location (if configured)</p>
                </div>
                <button
                  onClick={() => handleToggle('shareWithParents')}
                  disabled={isSaving}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    settings.shareWithParents ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      settings.shareWithParents ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Privacy Notice</p>
            <p className="text-xs">
              Your location data is used only for transport safety and coordination. 
              Data is encrypted and stored securely. You can disable location sharing at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {isSaving && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span>Saving settings...</span>
        </div>
      )}
    </div>
  );
};

export default LocationSettings; 
'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Settings, Shield, Clock, Wifi, WifiOff } from 'lucide-react';
import LocationTracker from '@/components/location-tracker';
import LocationSettings from '@/components/location-settings';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';

interface LocationSettings {
  locationSharingEnabled: boolean;
  locationTrackingEnabled: boolean;
  updateInterval: number;
  shareWithAdmin: boolean;
  shareWithDriver: boolean;
  shareWithParents: boolean;
}

const LocationPage = () => {
  const [studentId, setStudentId] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [settings, setSettings] = useState<LocationSettings>({
    locationSharingEnabled: false,
    locationTrackingEnabled: false,
    updateInterval: 30000,
    shareWithAdmin: true,
    shareWithDriver: false,
    shareWithParents: false
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get student information on page load
  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        // Check if user is logged in
        const session = sessionManager.getSession();
        console.log('Session:', session);
        
        if (!session) {
          toast.error('Please log in to access location settings');
          setIsLoading(false);
          return;
        }

        // Get current student from session
        const currentStudent = sessionManager.getCurrentStudent();
        console.log('Current student:', currentStudent);
        
        if (currentStudent) {
          setStudentName(currentStudent.student_name);
          console.log('Student name:', currentStudent.student_name);
          console.log('Student ID:', currentStudent.student_id);
          
          // Fetch external_id from database using student_id
          try {
            const response = await fetch(`/api/students/external-id?studentId=${currentStudent.student_id}`);
            console.log('External ID API response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('External ID API data:', data);
              
              if (data.success && data.externalId) {
                setStudentId(data.externalId);
                console.log('Set external ID:', data.externalId);
              } else {
                // Fallback: use student_id if external_id not found
                setStudentId(currentStudent.student_id);
                console.log('Fallback to student ID:', currentStudent.student_id);
              }
            } else {
              // Fallback: use student_id if API call fails
              setStudentId(currentStudent.student_id);
              console.log('API failed, fallback to student ID:', currentStudent.student_id);
            }
          } catch (error) {
            console.error('Error fetching external ID:', error);
            // Fallback: use student_id if API call fails
            setStudentId(currentStudent.student_id);
            console.log('Error occurred, fallback to student ID:', currentStudent.student_id);
          }
        } else {
          toast.error('Student information not found');
        }
      } catch (error) {
        console.error('Error fetching student info:', error);
        toast.error('Failed to load student information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentInfo();
  }, []);

  const handleSettingsChange = (newSettings: LocationSettings) => {
    setSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading location settings...</span>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please log in to access location settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Location Settings</h1>
              <p className="text-gray-600">Manage your location sharing preferences</p>
            </div>
          </div>
          
          {studentName && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Student:</strong> {studentName}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Settings */}
          <div>
            <LocationSettings
              studentId={studentId}
              onSettingsChange={handleSettingsChange}
            />
          </div>

          {/* Location Tracker */}
          <div>
            <LocationTracker
              studentId={studentId}
              isEnabled={settings.locationSharingEnabled && settings.locationTrackingEnabled}
              updateInterval={settings.updateInterval}
            />
          </div>
        </div>

        {/* Information Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">How Location Sharing Works</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Enable Location Sharing</h4>
                    <p className="text-sm text-gray-600">
                      Toggle on location sharing to allow transport administrators to view your location for safety purposes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Start Live Tracking</h4>
                    <p className="text-sm text-gray-600">
                      Enable live tracking to continuously update your location. You can choose how often updates are sent.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Privacy Controls</h4>
                    <p className="text-sm text-gray-600">
                      Choose who can see your location: administrators, drivers, or parents. You can change these settings anytime.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium text-green-900">Privacy & Security</h4>
                  </div>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Location data is encrypted and stored securely</li>
                    <li>• Only authorized personnel can access your location</li>
                    <li>• You can disable sharing at any time</li>
                    <li>• Data is used only for transport safety</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Update Frequency</h4>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 15 seconds: Real-time tracking</li>
                    <li>• 30 seconds: Standard tracking</li>
                    <li>• 1-5 minutes: Battery saving</li>
                    <li>• Manual updates available</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wifi className="w-4 h-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-900">Connection Status</h4>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Location updates require an internet connection. Updates will be queued and sent when connection is restored.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Information */}
        <div className="mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Shield className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-2">Emergency Use</h4>
                <p className="text-sm text-red-800">
                  Your location may be shared with emergency services and transport administrators in case of safety concerns or emergencies. 
                  This helps ensure your safety during transport.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPage; 
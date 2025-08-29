'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Wifi, WifiOff, AlertCircle, Play, Pause, Map } from 'lucide-react';
import DriverLocationTracker from '@/components/driver-location-tracker';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/auth-context';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

const DriverLiveTrackingPage = () => {
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const [driverId, setDriverId] = useState<string>('');
  const [driverName, setDriverName] = useState<string>('');
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDriverInfo = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          toast.error('Please log in to access live tracking');
          setIsLoading(false);
          return;
        }

        if (userType !== 'driver') {
          toast.error('Only drivers can access live tracking');
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

  const handleLocationUpdate = (location: LocationData) => {
    setCurrentLocation(location);
  };

  const handleTrackingToggle = () => {
    setIsTracking(!isTracking);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Please log in to access live tracking.</p>
      </div>
    );
  }

  if (userType !== 'driver') {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only drivers can access live tracking.</p>
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
            <Navigation className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Live Tracking</h2>
              <p className="text-sm text-gray-600">Real-time location tracking</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center text-sm ${
              isTracking ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isTracking ? (
                <Wifi className="w-4 h-4 mr-1" />
              ) : (
                <WifiOff className="w-4 h-4 mr-1" />
              )}
              {isTracking ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Controls */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Tracking Controls</h3>
          <button
            onClick={handleTrackingToggle}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isTracking 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isTracking ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Status:</span>
            <span className={`ml-auto font-medium ${
              isTracking ? 'text-green-600' : 'text-gray-500'
            }`}>
              {isTracking ? 'Tracking' : 'Stopped'}
            </span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">Location:</span>
            <span className="ml-auto font-medium text-gray-900">
              {currentLocation ? 'Available' : 'Not available'}
            </span>
          </div>
        </div>
      </div>

      {/* Location Display */}
      {currentLocation && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center mb-4">
            <Map className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-gray-900">Current Location</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <span className="ml-2 font-mono text-gray-900">
                {currentLocation.latitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Longitude:</span>
              <span className="ml-2 font-mono text-gray-900">
                {currentLocation.longitude.toFixed(6)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <span className="ml-2 font-medium text-gray-900">
                ±{currentLocation.accuracy.toFixed(1)}m
              </span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>
              <span className="ml-2 font-medium text-gray-900">
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Location Tracker Component */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Location Tracker</h3>
        </div>
        <div className="p-4">
          <DriverLocationTracker 
            driverId={driverId}
            driverName={driverName}
            isEnabled={isTracking}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">How it works</h4>
            <p className="text-sm text-blue-800">
              Enable live tracking to share your real-time location with passengers and administrators. 
              Your location will be updated automatically and can be viewed on the map.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLiveTrackingPage;

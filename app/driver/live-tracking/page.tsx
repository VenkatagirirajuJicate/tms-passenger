'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Wifi, WifiOff, AlertCircle, Play, Pause, Map, Satellite, Activity, Target } from 'lucide-react';
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-800 font-semibold text-xl mb-2">Access Denied</h2>
          <p className="text-red-600">Please log in to access live tracking.</p>
        </div>
      </div>
    );
  }

  if (userType !== 'driver') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-800 font-semibold text-xl mb-2">Access Denied</h2>
          <p className="text-red-600">Only drivers can access live tracking.</p>
        </div>
      </div>
    );
  }

  if (!driverId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-red-800 font-semibold text-xl mb-2">Driver Information Not Found</h2>
          <p className="text-red-600">Unable to retrieve driver information. Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Live Location Tracking</h1>
            <p className="text-green-100 text-lg">
              Share your real-time location with passengers and administrators
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Satellite className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tracking Status</p>
              <p className={`text-2xl font-bold ${
                isTracking ? 'text-green-600' : 'text-gray-600'
              }`}>
                {isTracking ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isTracking ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isTracking ? (
                <Wifi className="w-6 h-6 text-green-600" />
              ) : (
                <WifiOff className="w-6 h-6 text-gray-600" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Location Status</p>
              <p className={`text-2xl font-bold ${
                currentLocation ? 'text-green-600' : 'text-gray-600'
              }`}>
                {currentLocation ? 'Available' : 'Not Available'}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              currentLocation ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Driver</p>
              <p className="text-2xl font-bold text-gray-900">{driverName}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tracking Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tracking Controls</h2>
            <p className="text-sm text-gray-600">Start or stop location sharing</p>
          </div>
          <button
            onClick={handleTrackingToggle}
            className={`flex items-center px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              isTracking 
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl' 
                : 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isTracking ? (
              <>
                <Pause className="w-5 h-5 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="w-5 h-5 mr-2" />
                Start Tracking
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <span className={`ml-2 font-medium ${
                isTracking ? 'text-green-600' : 'text-gray-500'
              }`}>
                {isTracking ? 'Tracking Active' : 'Tracking Stopped'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center p-4 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <span className="text-sm text-gray-600">Location:</span>
              <span className="ml-2 font-medium text-gray-900">
                {currentLocation ? 'GPS Signal Available' : 'GPS Signal Not Available'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-6">
            <Map className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Current Location</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Coordinates</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Latitude:</span>
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {currentLocation.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Longitude:</span>
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {currentLocation.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Activity className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Details</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Accuracy:</span>
                  <span className="font-medium text-gray-900">
                    ±{currentLocation.accuracy.toFixed(1)}m
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Updated:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Tracker Component */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Location Tracker</h2>
          <p className="text-sm text-gray-600">Real-time GPS location sharing system</p>
        </div>
        <div className="p-6">
          <DriverLocationTracker 
            driverId={driverId}
            driverName={driverName}
            isEnabled={isTracking}
            onLocationUpdate={handleLocationUpdate}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-blue-600 mr-4 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 text-lg mb-2">How Live Tracking Works</h3>
            <p className="text-blue-800 mb-3">
              Enable live tracking to share your real-time location with passengers and administrators. 
              Your location will be updated automatically and can be viewed on the map in real-time.
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Click "Start Tracking" to begin sharing your location</li>
              <li>• Your GPS coordinates will be updated every few seconds</li>
              <li>• Passengers can see your live location on their app</li>
              <li>• Administrators can monitor your route progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLiveTrackingPage;

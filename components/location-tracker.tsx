'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface LocationTrackerProps {
  studentId: string;
  isEnabled: boolean;
  onLocationUpdate?: (location: LocationData) => void;
  updateInterval?: number; // in milliseconds, default 30 seconds
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  studentId,
  isEnabled,
  onLocationUpdate,
  updateInterval = 30000 // 30 seconds default
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Start location tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      toast.error('Location tracking not supported by your browser');
      return;
    }

    setIsTracking(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        setCurrentLocation(locationData);
        sendLocationToServer(locationData);
        
        // Start watching for position changes
        watchIdRef.current = navigator.geolocation.watchPosition(
          (newPosition) => {
            const newLocationData: LocationData = {
              latitude: newPosition.coords.latitude,
              longitude: newPosition.coords.longitude,
              accuracy: newPosition.coords.accuracy,
              timestamp: newPosition.timestamp
            };
            
            setCurrentLocation(newLocationData);
            sendLocationToServer(newLocationData);
          },
          (error) => {
            handleLocationError(error);
          },
          options
        );
      },
      (error) => {
        handleLocationError(error);
      },
      options
    );

    // Set up periodic updates as backup
    intervalRef.current = setInterval(() => {
      if (currentLocation) {
        sendLocationToServer(currentLocation);
      }
    }, updateInterval);
  };

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false);
    setLocationError(null);
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Handle location errors
  const handleLocationError = (error: GeolocationPositionError) => {
    let errorMessage = 'Unknown location error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information is unavailable. Please check your GPS settings.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
    }
    
    setLocationError(errorMessage);
    toast.error(errorMessage);
    setIsTracking(false);
  };

  // Send location to server
  const sendLocationToServer = async (locationData: LocationData) => {
    if (!isOnline) {
      console.log('Offline - location data cached for later sync');
      return;
    }

    try {
      const response = await fetch('/api/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp
        }),
      });

      if (response.ok) {
        setLastUpdateTime(new Date());
        setUpdateCount(prev => prev + 1);
        onLocationUpdate?.(locationData);
      } else {
        console.error('Failed to send location to server:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending location to server:', error);
    }
  };

  // Start/stop tracking based on isEnabled prop
  useEffect(() => {
    if (isEnabled && !isTracking) {
      startTracking();
    } else if (!isEnabled && isTracking) {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [isEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Live Location Tracking</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            {isTracking ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            )}
            <span className="text-sm font-medium">
              {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Updates:</span> {updateCount}
          </div>
          {lastUpdateTime && (
            <div className="text-xs text-gray-500">
              Last: {formatTime(lastUpdateTime)}
            </div>
          )}
        </div>
      </div>

      {/* Current Location Display */}
      {currentLocation && (
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Current Location</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Latitude:</span>
              <p className="text-blue-800 font-mono">{currentLocation.latitude.toFixed(6)}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Longitude:</span>
              <p className="text-blue-800 font-mono">{currentLocation.longitude.toFixed(6)}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Accuracy:</span>
              <p className={`font-mono ${getAccuracyColor(currentLocation.accuracy)}`}>
                ±{currentLocation.accuracy.toFixed(1)}m
              </p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Updated:</span>
              <p className="text-blue-800">
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {locationError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm text-red-800">{locationError}</span>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={isTracking ? stopTracking : startTracking}
          disabled={!isEnabled}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
            isTracking
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          } ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </button>
        
        <button
          onClick={() => {
            if (currentLocation) {
              sendLocationToServer(currentLocation);
              toast.success('Location manually updated');
            }
          }}
          disabled={!currentLocation || !isOnline}
          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update Now
        </button>
      </div>

      {/* Settings Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>• Location updates every {updateInterval / 1000} seconds</p>
        <p>• High accuracy GPS enabled</p>
        <p>• Location sharing: {isEnabled ? 'Enabled' : 'Disabled'}</p>
      </div>
    </div>
  );
};

export default LocationTracker; 
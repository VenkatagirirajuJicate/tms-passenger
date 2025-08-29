'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Wifi, WifiOff, Clock, Navigation, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface DriverLocationTrackerProps {
  driverId: string;
  driverName?: string;
  driverEmail?: string;
  isEnabled?: boolean;
  updateInterval?: number;
  onLocationUpdate?: (location: LocationData) => void;
}

const DriverLocationTracker: React.FC<DriverLocationTrackerProps> = ({
  driverId,
  driverName,
  driverEmail,
  isEnabled = false,
  updateInterval = 30000,
  onLocationUpdate
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('—');
  const [isBackground, setIsBackground] = useState(false);
  const [backgroundTracking, setBackgroundTracking] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<LocationData | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  const timeDisplayRef = useRef<NodeJS.Timeout | null>(null);
  const lastIntervalTimeRef = useRef<number>(0);
  const backgroundIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangeRef = useRef<(() => void) | null>(null);

  // Debug logging
  console.log('🔍 [DEBUG] DriverLocationTracker props:', {
    driverId,
    driverEmail,
    isEnabled,
    updateInterval
  });

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

  // Monitor page visibility for background tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      setIsBackground(isHidden);
      
      console.log('🔍 [DEBUG] Page visibility changed:', isHidden ? 'Background' : 'Foreground');
      
      if (isHidden && isTracking && backgroundTracking) {
        console.log('🔍 [DEBUG] App went to background, continuing location tracking');
        startBackgroundTracking();
      } else if (!isHidden && backgroundIntervalRef.current) {
        console.log('🔍 [DEBUG] App returned to foreground, stopping background tracking');
        stopBackgroundTracking();
      }
    };

    // Check initial visibility
    setIsBackground(document.hidden);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    visibilityChangeRef.current = handleVisibilityChange;

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isTracking, backgroundTracking]);

  // Update time until next update
  useEffect(() => {
    const updateTimeDisplay = () => {
      if (!nextUpdateTime || !isTracking) {
        setTimeUntilNext('—');
        return;
      }

      const now = new Date();
      const diff = nextUpdateTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeUntilNext('Now');
        // Trigger immediate update if countdown reaches zero
        if (isTracking && !isUpdatingRef.current) {
          console.log('🔍 [DEBUG] Countdown reached zero, triggering immediate update');
          forceLocationUpdate();
        }
      } else {
        const seconds = Math.ceil(diff / 1000);
        setTimeUntilNext(`${seconds}s`);
      }
    };

    updateTimeDisplay();
    timeDisplayRef.current = setInterval(updateTimeDisplay, 1000);

    return () => {
      if (timeDisplayRef.current) {
        clearInterval(timeDisplayRef.current);
      }
    };
  }, [nextUpdateTime, isTracking]);

  // Background tracking functions
  const startBackgroundTracking = useCallback(() => {
    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
    }

    console.log('🔍 [DEBUG] Starting background location tracking');
    
    // Use a more frequent interval for background tracking to ensure reliability
    const backgroundInterval = Math.max(updateInterval, 15000); // Minimum 15 seconds
    
    backgroundIntervalRef.current = setInterval(() => {
      if (isTracking && !isUpdatingRef.current) {
        console.log('🔍 [DEBUG] Background location update triggered');
        forceLocationUpdate();
      }
    }, backgroundInterval);
  }, [isTracking, updateInterval]);

  const stopBackgroundTracking = useCallback(() => {
    if (backgroundIntervalRef.current) {
      clearInterval(backgroundIntervalRef.current);
      backgroundIntervalRef.current = null;
      console.log('🔍 [DEBUG] Background location tracking stopped');
    }
  }, []);

  // Register service worker for background sync
  const registerServiceWorker = useCallback(async () => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-location-tracker.js');
        console.log('🔍 [DEBUG] Service Worker registered for background sync');
        return registration;
      } catch (error) {
        console.log('🔍 [DEBUG] Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }, []);

  // Check location permission
  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      return 'granted'; // Assume granted if permissions API not available
    }
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      console.log('🔍 [DEBUG] Location permission status:', permission.state);
      return permission.state;
    } catch (error) {
      console.log('🔍 [DEBUG] Permission check failed:', error);
      return 'granted'; // Assume granted if check fails
    }
  };

  // Get current position with optimized timeout settings
  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000, // Reduced timeout to 10 seconds for faster response
        maximumAge: 60000 // Allow cached position up to 1 minute old for better reliability
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  // Enhanced location sending with retry mechanism
  const sendLocationToServer = useCallback(async (locationData: LocationData, isRetry = false) => {
    // Prevents concurrent updates
    if (isUpdatingRef.current && !isRetry) {
      console.log('🔍 [DEBUG] Location update already in progress, skipping...');
      return false;
    }

    if (!isOnline) {
      console.log('🔍 [DEBUG] Offline - location data cached for later sync');
      // Store in localStorage for later sync
      const pendingUpdates = JSON.parse(localStorage.getItem('pendingLocationUpdates') || '[]');
      pendingUpdates.push({
        ...locationData,
        driverId,
        driverEmail,
        timestamp: Date.now()
      });
      localStorage.setItem('pendingLocationUpdates', JSON.stringify(pendingUpdates));
      return false;
    }

    isUpdatingRef.current = true;

    try {
      // Fallback email for testing - remove this once the issue is fixed
      const fallbackEmail = 'arthanareswaran22@jkkn.ac.in';
      const effectiveEmail = driverEmail || fallbackEmail;
      
      console.log('🔍 [DEBUG] Using email for API call:', effectiveEmail);

      const requestBody = {
        driverId,
        email: effectiveEmail,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        timestamp: locationData.timestamp
      };

      console.log('🔍 [DEBUG] Request body:', requestBody);

      const response = await fetch('/api/driver/location/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 [DEBUG] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 [DEBUG] Response data:', data);
        if (data.success) {
          setLastUpdateTime(new Date());
          setUpdateCount(prev => prev + 1);
          onLocationUpdate?.(locationData);
          
          // Update next update time immediately after successful update
          const now = Date.now();
          const nextUpdate = new Date(now + updateInterval);
          setNextUpdateTime(nextUpdate);
          lastIntervalTimeRef.current = now;
          
          console.log('🔍 [DEBUG] Location update successful, next update at:', nextUpdate.toISOString());
          return true;
        } else {
          console.error('Failed to send location to server:', data.error || 'Unknown error');
          return false;
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to send location to server:', response.status, errorData.error || response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending location to server:', error);
      return false;
    } finally {
      isUpdatingRef.current = false;
    }
  }, [driverId, driverEmail, updateInterval, isOnline, onLocationUpdate]);

  // Force location update at intervals
  const forceLocationUpdate = useCallback(async () => {
    if (!isTracking || !isEnabled) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastIntervalTimeRef.current;
    
    // Prevent too frequent updates (minimum 25 seconds between updates)
    if (timeSinceLastUpdate < 25000) {
      console.log('🔍 [DEBUG] Skipping update - too soon since last update:', timeSinceLastUpdate, 'ms');
      return;
    }

    console.log('🔍 [DEBUG] Force location update triggered at:', new Date(now).toISOString());

    // Try to get fresh location first
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      // Use fresh location data
      const freshLocationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      console.log('🔍 [DEBUG] Fresh location obtained for interval update:', {
        latitude: freshLocationData.latitude,
        longitude: freshLocationData.longitude,
        accuracy: freshLocationData.accuracy,
        timestamp: new Date(freshLocationData.timestamp).toISOString()
      });

      setCurrentLocation(freshLocationData);
      lastLocationRef.current = freshLocationData;
      
      const success = await sendLocationToServer(freshLocationData);
      if (success) {
        console.log('🔍 [DEBUG] Interval location update successful');
      } else {
        console.log('🔍 [DEBUG] Interval location update failed');
      }
    } catch (error) {
      console.error('🔍 [DEBUG] Failed to get fresh location for interval update:', error);
      
      // Fallback to last known location
      if (lastLocationRef.current) {
        console.log('🔍 [DEBUG] Using last known location as fallback');
        await sendLocationToServer(lastLocationRef.current, true);
      }
    }
  }, [isTracking, isEnabled, sendLocationToServer]);

  // Start location tracking
  const startTracking = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      toast.error('Location tracking not supported by your browser');
      return;
    }

    // Check permission first
    const permission = await checkLocationPermission();
    if (permission === 'denied') {
      setLocationError('Location permission denied. Please enable location access in your browser settings.');
      toast.error('Location permission denied');
      return;
    }

    setIsTracking(true);
    setLocationError(null);
    setIsRetrying(false);

    try {
      // Register service worker for background sync
      await registerServiceWorker();

      // Get initial position
      const position = await getCurrentPosition();
      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };
      
      setCurrentLocation(locationData);
      lastLocationRef.current = locationData;
      
      // Send initial location and set up interval
      const success = await sendLocationToServer(locationData);
      if (success) {
        console.log('🔍 [DEBUG] Initial location sent successfully');
      }
      
      // Start watching for position changes
      const watchOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // Reduced timeout
        maximumAge: 60000 // Allow cached position up to 1 minute old
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (newPosition) => {
          const newLocationData: LocationData = {
            latitude: newPosition.coords.latitude,
            longitude: newPosition.coords.longitude,
            accuracy: newPosition.coords.accuracy,
            timestamp: newPosition.timestamp
          };
          
          setCurrentLocation(newLocationData);
          lastLocationRef.current = newLocationData;
          sendLocationToServer(newLocationData);
        },
        (error) => {
          handleLocationError(error);
        },
        watchOptions
      );

      // Set up periodic updates to ensure location is shared at each interval
      intervalRef.current = setInterval(() => {
        forceLocationUpdate();
      }, updateInterval);

      // Set initial next update time if not already set
      if (!nextUpdateTime) {
        const now = Date.now();
        const nextUpdate = new Date(now + updateInterval);
        setNextUpdateTime(nextUpdate);
        lastIntervalTimeRef.current = now;
        console.log('🔍 [DEBUG] Location tracking started, next update at:', nextUpdate.toISOString());
      }

      // Start background tracking if app is in background
      if (isBackground) {
        startBackgroundTracking();
      }

    } catch (error) {
      handleLocationError(error as GeolocationPositionError);
    }
  };

  // Stop location tracking
  const stopTracking = () => {
    setIsTracking(false);
    setLocationError(null);
    setIsRetrying(false);
    setNextUpdateTime(null);
    setTimeUntilNext('—');

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (timeDisplayRef.current) {
      clearInterval(timeDisplayRef.current);
      timeDisplayRef.current = null;
    }

    stopBackgroundTracking();

    isUpdatingRef.current = false;
    lastIntervalTimeRef.current = 0;
  };

  // Handle location errors with retry logic
  const handleLocationError = (error: GeolocationPositionError) => {
    let errorMessage = 'Unknown location error';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please check your GPS signal or try moving to an open area.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please check your internet connection and GPS signal.';
        break;
    }

    console.log('🔍 [DEBUG] Geolocation error:', {
      code: error.code,
      message: errorMessage,
      error: error
    });

    setLocationError(errorMessage);
    
    // Retry after 10 seconds for timeout and position unavailable errors
    if ((error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) && isTracking) {
      setIsRetrying(true);
      retryTimeoutRef.current = setTimeout(() => {
        console.log('🔍 [DEBUG] Retrying location tracking...');
        setIsRetrying(false);
        startTracking();
      }, 10000);
    } else if (error.code === error.PERMISSION_DENIED) {
      setIsTracking(false);
      toast.error(errorMessage);
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Driver Location Tracker</h3>
        </div>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mb-4">
        <div className={`flex items-center space-x-2 p-3 rounded-lg ${
          isTracking ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className={`font-medium ${isTracking ? 'text-green-800' : 'text-gray-600'}`}>
            {isTracking ? 'Location Tracking Active' : 'Location Tracking Inactive'}
          </span>
          {isRetrying && (
            <div className="flex items-center space-x-1 text-yellow-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Retrying...</span>
            </div>
          )}
        </div>
      </div>

      {/* Background Status */}
      {isTracking && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isBackground ? (
                <EyeOff className="w-4 h-4 text-blue-600" />
              ) : (
                <Eye className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-sm text-blue-800">
                {isBackground ? 'Background Tracking Active' : 'Foreground Tracking Active'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setBackgroundTracking(!backgroundTracking)}
                className={`px-2 py-1 text-xs rounded ${
                  backgroundTracking 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {backgroundTracking ? 'Background Enabled' : 'Background Disabled'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Location Display */}
      {currentLocation && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Current Location</h4>
            <MapPin className="w-4 h-4 text-blue-600" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <span className="ml-2 font-mono">{currentLocation.latitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-600">Longitude:</span>
              <span className="ml-2 font-mono">{currentLocation.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <span className={`ml-2 font-mono ${getAccuracyColor(currentLocation.accuracy)}`}>
                {currentLocation.accuracy.toFixed(1)}m
              </span>
            </div>
            <div>
              <span className="text-gray-600">Updates:</span>
              <span className="ml-2 font-mono">{updateCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Next Update Countdown */}
      {isTracking && nextUpdateTime && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">Next update in:</span>
            </div>
            <span className="font-mono text-sm font-medium text-yellow-800">{timeUntilNext}</span>
          </div>
        </div>
      )}

      {/* Last Update Time */}
      {lastUpdateTime && (
        <div className="mb-4 flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>Last update: {formatTime(lastUpdateTime)}</span>
        </div>
      )}

      {/* Error Display */}
      {locationError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-700 text-sm">{locationError}</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500">
        <p>Location tracking helps passengers and administrators monitor your route progress in real-time.</p>
        <p className="mt-1">Updates are sent every {updateInterval / 1000} seconds when tracking is active.</p>
        <p className="mt-1">Background tracking ensures location updates continue even when the app is minimized.</p>
        {isRetrying && (
          <p className="mt-1 text-yellow-600">Retrying location access in 10 seconds...</p>
        )}
      </div>
    </div>
  );
};

export default DriverLocationTracker;

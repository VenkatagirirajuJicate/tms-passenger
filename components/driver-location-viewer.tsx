'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface DriverLocation {
  id: string;
  name: string;
  currentLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
    lastUpdate: string;
  };
  trackingStatus: string;
  sharingEnabled: boolean;
  trackingEnabled: boolean;
}

interface DriverLocationViewerProps {
  driverId: string;
  routeId?: string;
  onLocationUpdate?: (location: DriverLocation) => void;
}

const DriverLocationViewer: React.FC<DriverLocationViewerProps> = ({
  driverId,
  routeId,
  onLocationUpdate
}) => {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDriverLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = routeId 
        ? `/api/location/driver/${driverId}?routeId=${routeId}`
        : `/api/location/driver/${driverId}`;

      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch driver location');
      }

      const data = await response.json();
      
      if (data.success && data.driver) {
        setDriverLocation(data.driver);
        setLastUpdate(new Date());
        onLocationUpdate?.(data.driver);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching driver location:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch driver location');
      toast.error('Failed to fetch driver location');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch location on component mount and when driverId/routeId changes
  useEffect(() => {
    if (driverId) {
      fetchDriverLocation();
    }
  }, [driverId, routeId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!driverId) return;

    const interval = setInterval(() => {
      fetchDriverLocation();
    }, 30000);

    return () => clearInterval(interval);
  }, [driverId, routeId]);

  const formatTime = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-gray-600';
      case 'paused':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy <= 10) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading && !driverLocation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading driver location...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error Loading Driver Location</span>
        </div>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        <button
          onClick={fetchDriverLocation}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!driverLocation) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Driver Location Available</h3>
          <p className="text-gray-600">Driver location information is not available at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Navigation className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Driver Location</h3>
        </div>
        <button
          onClick={fetchDriverLocation}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* Driver Information */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900">{driverLocation.name}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            driverLocation.trackingStatus === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-700'
          }`}>
            {driverLocation.trackingStatus}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Sharing:</span>
            <span className={`ml-2 ${driverLocation.sharingEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {driverLocation.sharingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Tracking:</span>
            <span className={`ml-2 ${driverLocation.trackingEnabled ? 'text-green-600' : 'text-red-600'}`}>
              {driverLocation.trackingEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Current Location */}
      {driverLocation.currentLocation && (
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900">Current Location</h4>
            <MapPin className="w-4 h-4 text-green-600" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Latitude:</span>
              <span className="ml-2 font-mono">{driverLocation.currentLocation.latitude?.toFixed(6) || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Longitude:</span>
              <span className="ml-2 font-mono">{driverLocation.currentLocation.longitude?.toFixed(6) || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Accuracy:</span>
              <span className={`ml-2 font-mono ${getAccuracyColor(driverLocation.currentLocation.accuracy || 0)}`}>
                {driverLocation.currentLocation.accuracy ? `${driverLocation.currentLocation.accuracy.toFixed(1)}m` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Update:</span>
              <span className="ml-2 font-mono">{formatTime(driverLocation.currentLocation.lastUpdate)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Information */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <Wifi className="w-4 h-4 text-green-500" />
          <span>Real-time updates</span>
        </div>
        {lastUpdate && (
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Last refresh: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Location Information</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Driver location is updated every 30 seconds when tracking is active. 
              Location sharing must be enabled by the driver for this information to be available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverLocationViewer;

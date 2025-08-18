'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Bus,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const LiveTrackingMap = dynamic(() => import('@/components/live-tracking-map'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
});

interface TrackingData {
  route: {
    id: string;
    routeNumber: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    departureTime: string;
    arrivalTime: string;
    distance: number;
    duration: string;
    status: string;
    stops: any[];
  };
  gps: {
    enabled: boolean;
    status: 'online' | 'recent' | 'offline';
    locationSource?: 'vehicle_gps' | 'driver_app' | 'route_gps' | 'none';
    locationStatus?: string;
    statusMessage?: string;
    currentLocation: {
      latitude: number;
      longitude: number;
      accuracy: number;
      speed: number | null;
      heading: number | null;
      lastUpdate: string;
      source?: string;
    } | null;
    timeSinceUpdate?: number;
    device: {
      id: string;
      name: string;
      status: string;
      lastHeartbeat: string;
    } | null;
    fallbackInfo?: {
      hasVehicle: boolean;
      hasDriver: boolean;
      driverSharingEnabled: boolean;
      vehicleTrackingEnabled: boolean;
      routeTrackingEnabled: boolean;
    };
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    model: string;
    capacity: number;
    status: string;
  };
  driver?: {
    id: string;
    name: string;
    phone: string;
    status: string;
  };
}

export default function LiveTrackPage() {
  const router = useRouter();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    checkSessionAndLoadData();
  }, []);

  const checkSessionAndLoadData = async () => {
    try {
      const session = sessionManager.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent) {
        router.push('/login');
        return;
      }

      setStudentId(currentStudent.student_id);
      await fetchLiveTrackingData(currentStudent.student_id);
    } catch (error) {
      console.error('Session check failed:', error);
      setError('Failed to load tracking data');
      setIsLoading(false);
    }
  };

  const fetchLiveTrackingData = async (studentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/routes/live-tracking?student_id=${studentId}`);
      const result = await response.json();

      if (result.success) {
        setTrackingData(result.data);
      } else {
        setError(result.message || 'Failed to load tracking data');
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setError('Failed to load tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!studentId) return;
    
    setIsRefreshing(true);
    await fetchLiveTrackingData(studentId);
    setIsRefreshing(false);
    toast.success('Tracking data refreshed');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50 border-green-200';
      case 'recent': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'offline': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4" />;
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatTimeSince = (date: string | Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const updateTime = new Date(date);
    const diffMs = now.getTime() - updateTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes === 0) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return updateTime.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Tracking</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={checkSessionAndLoadData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Bus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Route Assigned</h2>
          <p className="text-gray-600 mb-4">You don't have a route assigned yet. Please contact your administration.</p>
          <button
            onClick={() => router.push('/dashboard/routes')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            View My Routes
          </button>
        </div>
      </div>
    );
  }

  const { route, gps, vehicle, driver } = trackingData;
  const isGPSEnabled = gps?.enabled;
  const gpsStatus = gps?.status || 'offline';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Navigation className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">Live Bus Tracking</h1>
              </div>
              <div className="text-sm text-gray-500">
                Route {route.routeNumber} - {route.routeName}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Live Location</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(gpsStatus)}`}>
                  {getStatusIcon(gpsStatus)}
                  <span className="ml-1 capitalize">{gpsStatus}</span>
                </div>
              </div>
              
              {gps?.currentLocation ? (
                <LiveTrackingMap
                  latitude={gps.currentLocation.latitude}
                  longitude={gps.currentLocation.longitude}
                  routeName={`Route ${route.routeNumber}`}
                  driverName={driver?.name || 'Unknown Driver'}
                  vehicleNumber={vehicle?.registrationNumber || 'Unknown Vehicle'}
                />
              ) : (
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Location not available</p>
                    {gps?.statusMessage && (
                      <p className="text-sm text-gray-500 mt-2">{gps.statusMessage}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Status Information */}
          <div className="space-y-6">
            {/* GPS Status Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Status</h3>
              
              <div className="space-y-4">
                {/* GPS Status */}
                <div className={`border rounded-lg p-4 ${getStatusColor(gpsStatus)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(gpsStatus)}
                      <div>
                        <h4 className="font-semibold">
                          {gpsStatus === 'online' ? 'Bus is Live' : 
                           gpsStatus === 'recent' ? 'Recently Active' : 'Bus Offline'}
                        </h4>
                        <p className="text-sm opacity-75">
                          Last update: {formatTimeSince(gps?.currentLocation?.lastUpdate || '')}
                        </p>
                        {gps?.locationSource && (
                          <p className="text-xs opacity-75 mt-1">
                            Source: {gps.locationSource.replace('_', ' ').toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {gps?.statusMessage && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{gps.statusMessage}</p>
                    </div>
                  )}
                </div>

                {/* Location Information */}
                {gps?.currentLocation && (
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Current Location</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Latitude:</span>
                        <span className="font-mono">{gps.currentLocation.latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Longitude:</span>
                        <span className="font-mono">{gps.currentLocation.longitude.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accuracy:</span>
                        <span className="text-green-600">±{gps.currentLocation.accuracy}m</span>
                      </div>
                      {gps.currentLocation.speed !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Speed:</span>
                          <span>{gps.currentLocation.speed} km/h</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback Information */}
                {gps?.fallbackInfo && (
                  <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">System Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Vehicle:</span>
                        <span className={gps.fallbackInfo.hasVehicle ? 'text-green-600' : 'text-red-600'}>
                          {gps.fallbackInfo.hasVehicle ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Driver:</span>
                        <span className={gps.fallbackInfo.hasDriver ? 'text-green-600' : 'text-red-600'}>
                          {gps.fallbackInfo.hasDriver ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Location Sharing:</span>
                        <span className={gps.fallbackInfo.driverSharingEnabled ? 'text-green-600' : 'text-red-600'}>
                          {gps.fallbackInfo.driverSharingEnabled ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Route Number</p>
                  <p className="font-semibold">{route.routeNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Route Name</p>
                  <p className="font-semibold">{route.routeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-semibold">{route.startLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To</p>
                  <p className="font-semibold">{route.endLocation}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Departure Time</p>
                  <p className="font-semibold">{route.departureTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Arrival Time</p>
                  <p className="font-semibold">{route.arrivalTime}</p>
                </div>
              </div>
            </div>

            {/* Driver & Vehicle Information */}
            {(driver || vehicle) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Driver & Vehicle</h3>
                
                <div className="space-y-4">
                  {driver && (
                    <div>
                      <p className="text-sm text-gray-600">Driver</p>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-sm text-gray-500">{driver.phone}</p>
                    </div>
                  )}
                  
                  {vehicle && (
                    <div>
                      <p className="text-sm text-gray-600">Vehicle</p>
                      <p className="font-semibold">{vehicle.registrationNumber}</p>
                      <p className="text-sm text-gray-500">{vehicle.model}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

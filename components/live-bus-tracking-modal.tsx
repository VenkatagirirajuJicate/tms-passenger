'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Navigation, 
  Clock, 
  MapPin, 
  Activity, 
  Wifi, 
  WifiOff, 
  Bus,
  User,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target,
  Route as RouteIcon,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';

interface LiveBusTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId?: string;
}

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
    currentLocation: {
      latitude: number;
      longitude: number;
      accuracy: number;
      speed: number;
      heading: number;
      lastUpdate: string;
      timeSinceUpdate: number;
    } | null;
    device: {
      id: string;
      name: string;
      status: string;
      lastHeartbeat: string;
    } | null;
  };
  estimatedArrival: {
    boardingStop: string;
    estimatedMinutes: number;
    estimatedTime: string;
    confidence: 'high' | 'medium' | 'low';
  } | null;
  lastUpdated: string;
}

interface ProgressData {
  route: {
    id: string;
    routeNumber: string;
    routeName: string;
    startLocation: string;
    endLocation: string;
    departureTime: string;
    arrivalTime: string;
    status: string;
  };
  progress: {
    totalStops: number;
    completedStops: number;
    remainingStops: number;
    progressPercentage: number;
    currentStop: any;
    nextStop: any;
    estimatedTimeToCompletion: number | null;
  };
  stops: any[];
  studentBoardingInfo: {
    stopName: string;
    stopTime: string;
    completed: boolean;
    current: boolean;
    upcoming: boolean;
    estimatedArrival: string | null;
    stopsUntilBoarding: number;
  } | null;
  gpsStatus: 'online' | 'recent' | 'offline';
  liveTrackingEnabled: boolean;
  lastUpdated: string;
}

export default function LiveBusTrackingModal({ isOpen, onClose, routeId }: LiveBusTrackingModalProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTrackingData();
      // Set up auto-refresh every 10 seconds
      intervalRef.current = setInterval(fetchTrackingData, 10000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, routeId]);

  const fetchTrackingData = useCallback(async () => {
    try {
      setError(null);
      
      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent) {
        throw new Error('No student session found');
      }

      // Check if it's a student object
      if (!('student_id' in currentStudent)) {
        throw new Error('Invalid session type - student required');
      }

      const studentId = currentStudent.student_id;
      const queryParams = new URLSearchParams();
      
      if (routeId) {
        queryParams.append('route_id', routeId);
      } else {
        queryParams.append('student_id', studentId);
      }

      // Fetch both tracking and progress data
      const [trackingResponse, progressResponse] = await Promise.all([
        fetch(`/api/routes/live-tracking?${queryParams.toString()}`),
        fetch(`/api/routes/route-progress?${queryParams.toString()}`)
      ]);

      if (!trackingResponse.ok || !progressResponse.ok) {
        throw new Error('Failed to fetch tracking data');
      }

      const trackingResult = await trackingResponse.json();
      const progressResult = await progressResponse.json();

      if (trackingResult.success) {
        setTrackingData(trackingResult.data);
      }

      if (progressResult.success) {
        setProgressData(progressResult.data);
      }

      if (!trackingResult.data && !progressResult.data) {
        setError('No route allocation found. Please contact administration.');
      }

      setLastUpdate(new Date());
    } catch (error: any) {
      console.error('Error fetching tracking data:', error);
      setError(error.message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [routeId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingData();
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
      case 'online': return <Activity className="w-4 h-4" />;
      case 'recent': return <Clock className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      default: return <Wifi className="w-4 h-4" />;
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

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Bus Location</h3>
            <p className="text-gray-600">Fetching real-time tracking data...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error && !trackingData && !progressData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tracking Error</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button onClick={handleRefresh} className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Try Again
              </button>
              <button onClick={onClose} className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const routeInfo = trackingData?.route || progressData?.route;
  const gpsStatus = trackingData?.gps?.status || progressData?.gpsStatus || 'offline';
  const isGPSEnabled = trackingData?.gps?.enabled || progressData?.liveTrackingEnabled || false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Live Bus Tracking</h2>
              <p className="text-blue-100 text-sm">
                {routeInfo ? `Route ${routeInfo.routeNumber} - ${routeInfo.routeName}` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* GPS Status */}
          {isGPSEnabled ? (
            <div className={`border rounded-lg p-4 ${getStatusColor(gpsStatus)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(gpsStatus)}
                  <div>
                    <h3 className="font-semibold">
                      {gpsStatus === 'online' ? 'Bus is Live' : 
                       gpsStatus === 'recent' ? 'Recently Active' : 'Bus Offline'}
                    </h3>
                    <p className="text-sm opacity-75">
                      Last update: {formatTimeSince(trackingData?.gps?.currentLocation?.lastUpdate || '')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Target className="w-5 h-5 text-gray-500" />
                <div>
                  <h3 className="font-semibold text-gray-700">GPS Tracking Not Available</h3>
                  <p className="text-sm text-gray-600">This route does not have live tracking enabled</p>
                </div>
              </div>
            </div>
          )}

          {/* Student Boarding Information */}
          {progressData?.studentBoardingInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Your Boarding Information</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Boarding Stop</p>
                  <p className="font-medium text-blue-900">{progressData.studentBoardingInfo.stopName}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Scheduled Time</p>
                  <p className="font-medium text-blue-900">{progressData.studentBoardingInfo.stopTime}</p>
                </div>
                {progressData.studentBoardingInfo.estimatedArrival && (
                  <div className="col-span-2">
                    <p className="text-sm text-blue-700">Estimated Arrival</p>
                    <p className="font-medium text-blue-900">{progressData.studentBoardingInfo.estimatedArrival}</p>
                  </div>
                )}
              </div>
              
              {/* Boarding Status */}
              <div className="mt-3 flex items-center space-x-2">
                {progressData.studentBoardingInfo.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : progressData.studentBoardingInfo.current ? (
                  <Activity className="w-5 h-5 text-yellow-600" />
                ) : (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
                <span className={`text-sm font-medium ${
                  progressData.studentBoardingInfo.completed ? 'text-green-700' :
                  progressData.studentBoardingInfo.current ? 'text-yellow-700' :
                  'text-gray-600'
                }`}>
                  {progressData.studentBoardingInfo.completed ? 'Bus has passed your stop' :
                   progressData.studentBoardingInfo.current ? 'Bus approaching your stop' :
                   `${progressData.studentBoardingInfo.stopsUntilBoarding} stops until your stop`}
                </span>
              </div>
            </div>
          )}

          {/* Current Location */}
          {trackingData?.gps?.currentLocation && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                Current Bus Location
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Latitude</p>
                  <p className="font-mono text-lg">{trackingData.gps.currentLocation.latitude.toFixed(6)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Longitude</p>
                  <p className="font-mono text-lg">{trackingData.gps.currentLocation.longitude.toFixed(6)}</p>
                </div>
              </div>

              {/* GPS Metadata */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {trackingData.gps.currentLocation.speed && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{Math.round(trackingData.gps.currentLocation.speed)}</p>
                    <p className="text-sm text-gray-600">km/h</p>
                  </div>
                )}
                {trackingData.gps.currentLocation.accuracy && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">±{Math.round(trackingData.gps.currentLocation.accuracy)}m</p>
                    <p className="text-sm text-gray-600">Accuracy</p>
                  </div>
                )}
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    {gpsStatus === 'online' ? (
                      <Activity className="w-6 h-6 text-green-600" />
                    ) : (
                      <WifiOff className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{gpsStatus}</p>
                </div>
              </div>

              {/* Map Link */}
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600 mb-3">View on Map</p>
                <button 
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${trackingData.gps.currentLocation!.latitude},${trackingData.gps.currentLocation!.longitude}`;
                    window.open(url, '_blank');
                  }}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in Google Maps</span>
                </button>
              </div>
            </div>
          )}

          {/* Route Progress */}
          {progressData && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <RouteIcon className="w-5 h-5 mr-2 text-blue-600" />
                Journey Progress
              </h3>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progressData.progress.progressPercentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressData.progress.progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{routeInfo?.startLocation}</span>
                  <span>{routeInfo?.endLocation}</span>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{progressData.progress.completedStops}</p>
                  <p className="text-sm text-gray-600">Stops Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{progressData.progress.remainingStops}</p>
                  <p className="text-sm text-gray-600">Stops Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{progressData.progress.totalStops}</p>
                  <p className="text-sm text-gray-600">Total Stops</p>
                </div>
              </div>
            </div>
          )}

          {/* Estimated Arrival */}
          {trackingData?.estimatedArrival && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Estimated Arrival</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700">
                    <span className="font-medium">{trackingData.estimatedArrival.boardingStop}</span>
                  </p>
                  <p className="text-2xl font-bold text-green-800">
                    {trackingData.estimatedArrival.estimatedTime}
                  </p>
                  <p className="text-sm text-green-600">
                    In approximately {trackingData.estimatedArrival.estimatedMinutes} minutes
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  trackingData.estimatedArrival.confidence === 'high' ? 'bg-green-200 text-green-800' :
                  trackingData.estimatedArrival.confidence === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                  'bg-red-200 text-red-800'
                }`}>
                  {trackingData.estimatedArrival.confidence} confidence
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {lastUpdate && (
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={onClose} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
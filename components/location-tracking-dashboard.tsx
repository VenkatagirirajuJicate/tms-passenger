'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Car, Clock, TrendingUp, Activity, Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationTrackingDashboardProps {
  driverId?: string;
  routeId?: string;
  date?: string;
}

interface TrackingSummary {
  totalRecords: number;
  uniqueRoutes: number;
  uniqueDrivers: number;
  uniqueVehicles: number;
  avgSpeed: number;
  avgAccuracy: number;
  maxSpeed: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface TrackingRecord {
  id: string;
  tracking_date: string;
  tracking_timestamp: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number;
  speed: number;
  heading: number;
  location_source: string;
  data_quality: string;
  routes: {
    id: string;
    route_number: string;
    route_name: string;
  };
  drivers: {
    id: string;
    name: string;
    license_number: string;
  };
  vehicles?: {
    id: string;
    registration_number: string;
    model: string;
  };
}

interface DailySummary {
  date: string;
  totalRecords: number;
  avgSpeed: number;
  avgAccuracy: number;
  firstRecord: string;
  lastRecord: string;
}

export default function LocationTrackingDashboard({ 
  driverId, 
  routeId, 
  date = new Date().toISOString().split('T')[0] 
}: LocationTrackingDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TrackingSummary | null>(null);
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [selectedDate, setSelectedDate] = useState(date);

  useEffect(() => {
    loadTrackingData();
  }, [selectedDate, driverId, routeId]);

  const loadTrackingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        date: selectedDate
      });

      if (driverId) {
        params.append('driverId', driverId);
      }

      if (routeId) {
        params.append('routeId', routeId);
      }

      const response = await fetch(`/api/location/tracking/daily?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load tracking data');
      }

      const data = await response.json();
      
      if (data.success) {
        setSummary(data.data.summary);
        setRecords(data.data.records);
        setDailySummaries(data.data.dailySummaries || []);
      } else {
        throw new Error(data.error || 'Failed to load tracking data');
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load tracking data');
      toast.error('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    try {
      const csvData = records.map(record => ({
        Date: record.tracking_date,
        Time: new Date(record.tracking_timestamp).toLocaleTimeString(),
        Route: record.routes.route_name,
        Driver: record.drivers.name,
        Vehicle: record.vehicles?.registration_number || 'N/A',
        Latitude: record.latitude,
        Longitude: record.longitude,
        Speed: record.speed || 0,
        Accuracy: record.accuracy || 0,
        Heading: record.heading || 0,
        Quality: record.data_quality
      }));

      const csvContent = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `location-tracking-${selectedDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  const formatSpeed = (speed: number) => {
    return `${speed.toFixed(1)} km/h`;
  };

  const formatAccuracy = (accuracy: number) => {
    return `${accuracy.toFixed(1)}m`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading tracking data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-500 mb-2">Error loading tracking data</div>
          <div className="text-sm text-gray-600">{error}</div>
          <button
            onClick={loadTrackingData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Location Tracking Dashboard</h2>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={exportData}
              disabled={records.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Total Records</div>
                  <div className="text-2xl font-bold text-blue-600">{summary.totalRecords}</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-900">Active Routes</div>
                  <div className="text-2xl font-bold text-green-600">{summary.uniqueRoutes}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Car className="w-5 h-5 text-yellow-600" />
                <div>
                  <div className="text-sm font-medium text-yellow-900">Active Drivers</div>
                  <div className="text-2xl font-bold text-yellow-600">{summary.uniqueDrivers}</div>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-purple-900">Avg Speed</div>
                  <div className="text-2xl font-bold text-purple-600">{formatSpeed(summary.avgSpeed)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Summaries */}
      {dailySummaries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Speed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Accuracy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Record</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailySummaries.map((summary) => (
                  <tr key={summary.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(summary.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.totalRecords}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatSpeed(summary.avgSpeed)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAccuracy(summary.avgAccuracy)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.firstRecord ? formatTime(summary.firstRecord) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {summary.lastRecord ? formatTime(summary.lastRecord) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracking Records */}
      {records.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tracking Records</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Speed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.slice(0, 50).map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.tracking_timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.routes.route_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.drivers.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.vehicles?.registration_number || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatSpeed(record.speed || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAccuracy(record.accuracy || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.data_quality === 'good' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.data_quality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length > 50 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing first 50 records of {records.length} total records
            </div>
          )}
        </div>
      )}

      {records.length === 0 && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-gray-500">No tracking data found for the selected date</div>
        </div>
      )}
    </div>
  );
}

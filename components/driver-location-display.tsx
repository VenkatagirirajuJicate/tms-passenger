'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Car, Clock, Users } from 'lucide-react';

interface DriverLocation {
  id: string;
  name: string;
  current_latitude: number;
  current_longitude: number;
  location_timestamp: string;
  location_accuracy: number;
  location_enabled: boolean;
  location_sharing_enabled: boolean;
  route_name?: string;
  route_number?: string;
  vehicle_registration?: string;
}

interface DriverLocationDisplayProps {
  routeId?: string;
  routeNumber?: string;
}

export default function DriverLocationDisplay({ routeId, routeNumber }: DriverLocationDisplayProps) {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchDriverLocations = async () => {
    try {
      setError(null);
      
      // Fetch driver locations from the API
      const response = await fetch('/api/driver/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch driver locations');
      }
      
      const data = await response.json();
      setDrivers(data.drivers || []);
      setLastUpdate(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load driver locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverLocations();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDriverLocations, 30000);
    return () => clearInterval(interval);
  }, [routeId, routeNumber]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading driver locations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center py-4">
          <div className="text-red-600 mb-2">Error loading driver locations</div>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDriverLocations}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Filter drivers by route if specified
  const filteredDrivers = routeId || routeNumber 
    ? drivers.filter(driver => 
        (routeId && driver.route_name) || 
        (routeNumber && driver.route_number === routeNumber)
      )
    : drivers;

  if (filteredDrivers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Driver Locations Available</h3>
          <p className="text-gray-600">
            {routeId || routeNumber 
              ? 'No drivers are currently tracking for this route.'
              : 'No drivers are currently sharing their location.'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Driver Locations</h3>
            <p className="text-sm text-gray-600">
              Real-time location updates from drivers
              {lastUpdate && (
                <span className="ml-2">
                  • Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <button 
            onClick={fetchDriverLocations}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Refresh locations"
          >
            <Navigation className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Car className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{driver.name}</h4>
                      {driver.route_name && (
                        <p className="text-sm text-gray-500">
                          Route {driver.route_number}: {driver.route_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-13 space-y-2">
                    {/* Location Coordinates */}
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">Location:</span>
                      <span className="ml-2 font-mono text-xs">
                        {driver.current_latitude?.toFixed(6)}, {driver.current_longitude?.toFixed(6)}
                      </span>
                    </div>

                    {/* Vehicle Info */}
                    {driver.vehicle_registration && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Car className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">Vehicle:</span>
                        <span className="ml-2">{driver.vehicle_registration}</span>
                      </div>
                    )}

                    {/* Status Indicators */}
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          driver.location_enabled ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={driver.location_enabled ? 'text-green-600' : 'text-red-600'}>
                          {driver.location_enabled ? 'Location Enabled' : 'Location Disabled'}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          driver.location_sharing_enabled ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className={driver.location_sharing_enabled ? 'text-green-600' : 'text-red-600'}>
                          {driver.location_sharing_enabled ? 'Sharing Enabled' : 'Sharing Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Last Update */}
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Last update: {new Date(driver.location_timestamp).toLocaleString()}</span>
                    </div>

                    {/* Accuracy */}
                    {driver.location_accuracy && (
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Accuracy: ±{driver.location_accuracy}m</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button 
                    onClick={() => {
                      // Open in Google Maps
                      const url = `https://www.google.com/maps?q=${driver.current_latitude},${driver.current_longitude}`;
                      window.open(url, '_blank');
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    View on Map
                  </button>
                  
                  <button 
                    onClick={() => {
                      // Copy coordinates to clipboard
                      navigator.clipboard.writeText(`${driver.current_latitude}, ${driver.current_longitude}`);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Copy Coordinates
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Users, Car, Route, AlertCircle, CheckCircle, Navigation } from 'lucide-react';
import Link from 'next/link';

export default function DriverRoutesPage() {
  const router = useRouter();
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        // Wait for auth to load
        if (authLoading) {
          return;
        }

        if (!isAuthenticated) {
          router.replace('/login');
          return;
        }

        if (userType !== 'driver') {
          router.replace('/login');
          return;
        }

        if (!user || !user.id) {
          setError('Driver information not found');
          setLoading(false);
          return;
        }

        // Pass both driverId and email to ensure the API can find routes
        const assignedRoutes = await driverHelpers.getAssignedRoutes(user.id, user.email);
        console.log('Fetched routes:', assignedRoutes);
        setRoutes(assignedRoutes);
      } catch (err: any) {
        setError(err.message || 'Failed to load routes');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, user, authLoading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your routes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Routes</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeRoutes = routes.filter(route => route.status === 'active');
  const inactiveRoutes = routes.filter(route => route.status !== 'active');

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Routes</h1>
            <p className="text-blue-100 text-lg">
              Manage and view all your assigned transportation routes
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Route className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Route className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-green-600">{activeRoutes.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactive Routes</p>
              <p className="text-2xl font-bold text-gray-600">{inactiveRoutes.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Routes List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Route Details</h2>
          <div className="text-sm text-gray-600">
            {routes.length} route{routes.length !== 1 ? 's' : ''} assigned
          </div>
        </div>

        {routes.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <MapPin className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Routes Assigned</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              You haven't been assigned to any routes yet. Contact your administrator for route assignments.
            </p>
            <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {routes.map((route) => (
              <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  {/* Route Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{route.route_name}</h3>
                          <p className="text-sm text-gray-500">Route {route.route_number}</p>
                        </div>
                      </div>
                      <div className="text-lg text-gray-700 ml-16 font-medium">
                        {route.start_location} → {route.end_location}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3">
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        route.status === 'active' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {route.status}
                      </div>
                      
                      <Link 
                        href={`/driver/bookings?routeId=${route.id}`}
                        className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        View Bookings
                      </Link>
                    </div>
                  </div>

                  {/* Route Details */}
                  <div className="ml-16 space-y-4">
                    {/* Vehicle Information */}
                    {route.vehicles && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Car className="w-4 h-4 mr-3 text-gray-400" />
                        <span className="font-medium">Vehicle:</span>
                        <span className="ml-2">{route.vehicles.registration_number} ({route.vehicles.model})</span>
                      </div>
                    )}

                    {/* Passenger Count */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="font-medium">Passengers:</span>
                      <span className="ml-2">{route.current_passengers || 0} / {route.total_capacity}</span>
                    </div>

                    {/* Route Stops */}
                    {Array.isArray(route.route_stops) && route.route_stops.length > 0 && (
                      <div>
                        <div className="flex items-center mb-3">
                          <Clock className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Route Stops</span>
                        </div>
                        <div className="space-y-2">
                          {route.route_stops
                            .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                            .map((stop: any, index: number) => (
                              <div key={stop.id} className="flex items-center text-sm text-gray-600">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 text-xs font-medium text-blue-600">
                                  {stop.sequence_order}
                                </div>
                                <span className="flex-1 font-medium">{stop.stop_name}</span>
                                <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                                  {stop.stop_time}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 mt-6 ml-16">
                    <Link 
                      href={`/driver/bookings?routeId=${route.id}`}
                      className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Bookings
                    </Link>
                    <Link 
                      href={`/driver/routes/${route.id}`}
                      className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Route Details
                    </Link>
                    <Link 
                      href="/driver/live-tracking"
                      className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Start Tracking
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Clock, Users, Car, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DriverHomePage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        // Check if user is authenticated and is a driver
        if (isLoading) {
          return; // Wait for auth to load
        }
        
        if (!isAuthenticated || userType !== 'driver') {
          console.log('❌ Driver access denied:', { isAuthenticated, userType });
          router.replace('/login');
          return;
        }
        
        console.log('✅ Driver authenticated:', { user, userType });
        
        // Get driver ID from user object
        const driverId = user?.id;
        if (!driverId) {
          setError('Driver ID not found');
          return;
        }
        
        // Load assigned routes
        setRoutesLoading(true);
        const assignedRoutes = await driverHelpers.getAssignedRoutes(driverId, user?.email);
        setRoutes(assignedRoutes);
        console.log('✅ Routes loaded:', assignedRoutes);
      } catch (err: any) {
        console.error('❌ Error loading driver data:', err);
        setError(err.message || 'Failed to load driver data');
      } finally {
        setLoading(false);
        setRoutesLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, isLoading, user]);

  if (isLoading || loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mb-6"></div>
      <p className="text-gray-600 text-lg font-medium">Loading driver dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Dashboard</h3>
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

  const currentDriver = user;
  const activeRoutes = routes.filter(route => route.status === 'active');
  const totalPassengers = routes.reduce((sum, route) => sum + (route.current_passengers || 0), 0);

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {currentDriver?.email?.split('@')[0] || 'Driver'}!
            </h1>
            <p className="text-green-100 text-lg">
              Ready to start your journey? Check your routes and begin tracking.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Car className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">{activeRoutes.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Passengers</p>
              <p className="text-2xl font-bold text-gray-900">{totalPassengers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Routes</p>
              <p className="text-2xl font-bold text-gray-900">{routes.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className="text-2xl font-bold text-green-600">Active</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/driver/live-tracking" className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-green-300 group-hover:bg-green-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Navigation className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-800 transition-colors">Live Tracking</h3>
                  <p className="text-sm text-gray-600 group-hover:text-green-700">Start real-time location tracking</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/driver/routes" className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-purple-300 group-hover:bg-purple-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <MapPin className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-800 transition-colors">My Routes</h3>
                  <p className="text-sm text-gray-600 group-hover:text-purple-700">View assigned routes</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/driver/bookings" className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 group-hover:border-blue-300 group-hover:bg-blue-50">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">Bookings</h3>
                  <p className="text-sm text-gray-600 group-hover:text-blue-700">View passenger bookings</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Assigned Routes */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Assigned Routes</h2>
          {routesLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              Loading routes...
            </div>
          )}
        </div>
        
        {routesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <div key={route.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Route {route.route_number}</div>
                      <div className="font-semibold text-lg text-gray-900">{route.route_name}</div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      route.status === 'active' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {route.status}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="font-medium">{route.start_location} → {route.end_location}</span>
                    </div>
                    
                    {route.vehicles && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Car className="w-4 h-4 mr-3 text-gray-400" />
                        <span>{route.vehicles.registration_number} ({route.vehicles.model})</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{route.current_passengers || 0} / {route.total_capacity} passengers</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Link 
                      href={`/driver/bookings?routeId=${route.id}`}
                      className="flex-1 text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Bookings
                    </Link>
                    <Link 
                      href={`/driver/routes/${route.id}`}
                      className="flex-1 text-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Route Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            
            {routes.length === 0 && !routesLoading && (
              <div className="col-span-full">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No Routes Assigned</h3>
                  <p className="text-gray-600 mb-4 max-w-md mx-auto">
                    You don't have any active routes assigned at the moment. 
                    Contact your administrator for route assignments.
                  </p>
                  <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



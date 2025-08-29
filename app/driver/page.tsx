'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Clock, Users, Car } from 'lucide-react';
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
        const assignedRoutes = await driverHelpers.getAssignedRoutes(driverId);
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
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Loading driver dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  const currentDriver = user;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Welcome, {currentDriver?.driver_name || currentDriver?.full_name || currentDriver?.name || 'Driver'}</h2>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/driver/live-tracking" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Live Tracking</h3>
                <p className="text-sm text-gray-600">Start real-time location tracking</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/driver/routes" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">My Routes</h3>
                <p className="text-sm text-gray-600">View assigned routes</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/driver/bookings" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Bookings</h3>
                <p className="text-sm text-gray-600">View passenger bookings</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Assigned Routes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Assigned Routes</h3>
          {routesLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
              Loading routes...
            </div>
          )}
        </div>
        
        {routesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-200 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <div key={route.id} className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm text-gray-500">Route {route.route_number}</div>
                    <div className="font-medium text-lg">{route.route_name}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {route.status}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{route.start_location} → {route.end_location}</span>
                  </div>
                  
                  {route.vehicles && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Car className="w-4 h-4 mr-2" />
                      <span>{route.vehicles.registration_number} ({route.vehicles.model})</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{route.current_passengers || 0} / {route.total_capacity} passengers</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link 
                    href={`/driver/bookings?routeId=${route.id}`}
                    className="flex-1 text-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    View Bookings
                  </Link>
                  <Link 
                    href={`/driver/routes/${route.id}`}
                    className="flex-1 text-center px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                  >
                    Route Details
                  </Link>
                </div>
              </div>
            ))}
            
            {routes.length === 0 && !routesLoading && (
              <div className="col-span-full text-center py-8">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Assigned</h3>
                <p className="text-gray-600">You don't have any active routes assigned at the moment.</p>
                <p className="text-sm text-gray-500 mt-2">Contact your administrator for route assignments.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



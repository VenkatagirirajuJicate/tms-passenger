'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Users } from 'lucide-react';
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

        const assignedRoutes = await driverHelpers.getAssignedRoutes(user.id);
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading routes</div>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">My Routes</h2>
        <div className="text-sm text-gray-600">{routes.length} route{routes.length !== 1 ? 's' : ''}</div>
      </div>

      {routes.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Assigned</h3>
          <p className="text-gray-600">You haven't been assigned to any routes yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.map((route) => (
            <div key={route.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{route.route_name}</h3>
                        <p className="text-sm text-gray-500">Route {route.route_number}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 ml-11">
                      {route.start_location} → {route.end_location}
                    </div>
                  </div>
                  <Link 
                    href={`/driver/bookings?routeId=${route.id}`}
                    className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-800"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Bookings
                  </Link>
                </div>

                {Array.isArray(route.route_stops) && route.route_stops.length > 0 && (
                  <div className="ml-11">
                    <div className="flex items-center mb-2">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Stops</span>
                    </div>
                    <div className="space-y-1">
                      {route.route_stops
                        .sort((a: any, b: any) => a.sequence_order - b.sequence_order)
                        .map((stop: any) => (
                          <div key={stop.id} className="flex items-center text-sm text-gray-600">
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 text-xs font-medium text-gray-500">
                              {stop.sequence_order}
                            </div>
                            <span className="flex-1">{stop.stop_name}</span>
                            <span className="text-gray-500 text-xs">{stop.stop_time}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



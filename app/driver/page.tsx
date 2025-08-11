'use client';

import React, { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/session';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Users, Clock, Calendar, Car } from 'lucide-react';
import Link from 'next/link';

export default function DriverHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [todayBookings, setTodayBookings] = useState(0);

  useEffect(() => {
    const init = async () => {
      try {
        if (!sessionManager.isAuthenticated() || !sessionManager.getCurrentDriverId()) {
          router.replace('/login');
          return;
        }
        const driverId = sessionManager.getCurrentDriverId() as string;
        const assignedRoutes = await driverHelpers.getAssignedRoutes(driverId);
        setRoutes(assignedRoutes);
        
        // Get today's bookings count
        if (assignedRoutes.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const bookings = await driverHelpers.getRouteBookings({
            routeNumber: assignedRoutes[0].route_number,
            date: today
          });
          setTodayBookings(bookings?.length || 0);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load driver data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading data</div>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  const currentDriver = sessionManager.getCurrentDriver();
  const driverName = 'driver_name' in (currentDriver || {}) 
    ? (currentDriver as any).driver_name 
    : (currentDriver as any).name || 'Driver';
    
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Get primary route and vehicle info
  const primaryRoute = routes.length > 0 ? routes[0] : null;
  const vehicleInfo = primaryRoute?.vehicles;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome back, {driverName}
            </h2>
            <p className="text-gray-600 mt-1">{currentDate}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{currentTime}</div>
            <p className="text-sm text-gray-500">Current Time</p>
          </div>
        </div>

        {/* Route and Vehicle Information */}
        {primaryRoute && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <div className="text-sm text-blue-600 font-medium">Route</div>
                  <div className="font-semibold text-gray-900">
                    {primaryRoute.route_number} - {primaryRoute.route_name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {primaryRoute.start_location} → {primaryRoute.end_location}
                  </div>
                </div>
              </div>

              {vehicleInfo && (
                <div className="flex items-center">
                  <Car className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <div className="text-sm text-green-600 font-medium">Vehicle</div>
                    <div className="font-semibold text-gray-900">
                      {vehicleInfo.registration_number}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicleInfo.model} • {vehicleInfo.capacity} seats
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <Users className="w-5 h-5 text-purple-600 mr-3" />
                <div>
                  <div className="text-sm text-purple-600 font-medium">Capacity</div>
                  <div className="font-semibold text-gray-900">
                    {primaryRoute.current_passengers || 0} / {primaryRoute.total_capacity}
                  </div>
                  <div className="text-sm text-gray-600">
                    Passengers today
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{routes.length}</div>
              <div className="text-sm text-gray-600">Active Routes</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{todayBookings}</div>
              <div className="text-sm text-gray-600">Today's Bookings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-4 space-y-3">
          <Link href="/driver/bookings" className="block">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-600 mr-3" />
                <span className="font-medium">View Today's Bookings</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>

          <Link href="/driver/routes" className="block">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-green-600 mr-3" />
                <span className="font-medium">My Routes</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>

          <Link href="/driver/live-tracking" className="block">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-600 mr-3" />
                <span className="font-medium">Start Tracking</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Current Routes */}
      {routes.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Your Routes</h3>
          </div>
          <div className="p-4 space-y-3">
            {routes.slice(0, 3).map((route) => (
              <div key={route.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">{route.route_name}</div>
                  <div className="text-sm text-gray-600">
                    {route.start_location} → {route.end_location}
                  </div>
                </div>
                <Link 
                  href={`/driver/bookings?routeId=${route.id}`}
                  className="text-blue-600 text-sm font-medium hover:text-blue-800"
                >
                  View
                </Link>
              </div>
            ))}
            {routes.length > 3 && (
              <Link href="/driver/routes" className="block text-center text-blue-600 text-sm font-medium py-2">
                View all {routes.length} routes
              </Link>
            )}
          </div>
        </div>
      )}

      {routes.length === 0 && (
        <div className="bg-white rounded-lg p-6 text-center shadow-sm border border-gray-200">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">No Routes Assigned</h3>
          <p className="text-gray-600 text-sm">Contact your administrator to get assigned to routes.</p>
        </div>
      )}
    </div>
  );
}



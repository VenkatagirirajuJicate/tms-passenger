'use client';

import React, { useEffect, useState } from 'react';
import { sessionManager } from '@/lib/session';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { MapPin, Navigation, Settings, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DriverHomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);

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
      } catch (err: any) {
        setError(err.message || 'Failed to load driver data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const currentDriver = sessionManager.getCurrentDriver();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Welcome, {currentDriver?.driver_name || currentDriver?.name}</h2>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link href="/driver/location" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Location Settings</h3>
                <p className="text-sm text-gray-600">Manage location sharing preferences</p>
              </div>
            </div>
          </div>
        </Link>

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
      </div>

      {/* Assigned Routes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Assigned Routes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {routes.map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">Route {r.route_number}</div>
                  <div className="font-medium">{r.route_name}</div>
                </div>
                <Link 
                  href={`/driver/bookings?routeId=${r.id}`}
                  className="text-blue-600 text-sm hover:text-blue-800"
                >
                  View bookings
                </Link>
              </div>
              <div className="mt-3 text-xs text-gray-600">{r.start_location} → {r.end_location}</div>
            </div>
          ))}
          {routes.length === 0 && (
            <div className="text-gray-600">No active routes assigned.</div>
          )}
        </div>
      </div>
    </div>
  );
}



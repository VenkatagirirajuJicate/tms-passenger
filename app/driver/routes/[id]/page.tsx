'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Users, Car, ArrowRight, Navigation, Calendar } from 'lucide-react';
import Link from 'next/link';

interface RouteStop {
  id: string;
  stop_name: string;
  stop_time: string;
  sequence_order: number;
  is_major_stop: boolean;
}

interface Route {
  id: string;
  route_number: string;
  route_name: string;
  start_location: string;
  end_location: string;
  status: string;
  total_capacity: number;
  current_passengers: number;
  vehicle_id: string;
  vehicles: {
    id: string;
    registration_number: string;
    model: string;
    capacity: number;
  };
  route_stops: RouteStop[];
}

export default function RouteDetailsPage({ params }: { params: { id: string } }) {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<Route | null>(null);

  useEffect(() => {
    const fetchRouteDetails = async () => {
      try {
        if (isLoading) return;
        
        if (!isAuthenticated || userType !== 'driver') {
          router.replace('/login');
          return;
        }

        const response = await fetch(`/api/driver/routes/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch route details');
        }

        const data = await response.json();
        if (data.success) {
          setRoute(data.route);
        } else {
          throw new Error(data.error || 'Failed to load route details');
        }
      } catch (err: any) {
        console.error('Error fetching route details:', err);
        setError(err.message || 'Failed to load route details');
      } finally {
        setLoading(false);
      }
    };

    fetchRouteDetails();
  }, [params.id, isAuthenticated, userType, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Loading route details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Route</h3>
          <p className="text-red-600">{error}</p>
          <Link 
            href="/driver"
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h3 className="text-yellow-800 font-semibold mb-2">Route Not Found</h3>
          <p className="text-yellow-600">The requested route could not be found.</p>
          <Link 
            href="/driver"
            className="mt-4 inline-block px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/driver"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowRight className="w-4 h-4 mr-1 rotate-180" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Route {route.route_number}</h1>
          <p className="text-gray-600">{route.route_name}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          route.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {route.status}
        </div>
      </div>

      {/* Route Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Route</h3>
              <p className="text-sm text-gray-600">{route.start_location} → {route.end_location}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Passengers</h3>
              <p className="text-sm text-gray-600">{route.current_passengers} / {route.total_capacity}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Car className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Vehicle</h3>
              <p className="text-sm text-gray-600">{route.vehicles?.registration_number || 'Not assigned'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Details */}
      {route.vehicles && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Registration Number</p>
              <p className="font-medium">{route.vehicles.registration_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Model</p>
              <p className="font-medium">{route.vehicles.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="font-medium">{route.vehicles.capacity} passengers</p>
            </div>
          </div>
        </div>
      )}

      {/* Route Stops */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Route Stops</h3>
          <span className="text-sm text-gray-600">{route.route_stops?.length || 0} stops</span>
        </div>
        
        {route.route_stops && route.route_stops.length > 0 ? (
          <div className="space-y-3">
            {route.route_stops.map((stop, index) => (
              <div key={stop.id} className="flex items-center space-x-4 p-3 rounded-lg border border-gray-100">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stop.is_major_stop 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {stop.sequence_order}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${stop.is_major_stop ? 'text-blue-900' : 'text-gray-900'}`}>
                        {stop.stop_name}
                      </p>
                      {stop.is_major_stop && (
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full mt-1">
                          Major Stop
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      {stop.stop_time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No stops defined for this route.</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Link 
          href={`/driver/bookings?routeId=${route.id}`}
          className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users className="w-5 h-5 mr-2" />
          View Bookings
        </Link>
        
        <Link 
          href="/driver/live-tracking"
          className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Navigation className="w-5 h-5 mr-2" />
          Start Tracking
        </Link>
      </div>
    </div>
  );
}

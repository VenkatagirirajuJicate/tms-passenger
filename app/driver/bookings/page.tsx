'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';
import { Users, Calendar, Clock, MapPin } from 'lucide-react';

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, userType, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [grouped, setGrouped] = useState<Record<string, any[]>>({});
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const routeId = searchParams?.get('routeId') || '';

  const load = async (targetRouteId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (targetRouteId) params.routeId = targetRouteId;
      else params.routeNumber = '29';
      params.date = date;
      const data = await driverHelpers.getRouteBookings(params);
      setBookings(data);
      
      const byStop: Record<string, any[]> = {};
      (data || []).forEach((b: any) => {
        const key = b.boarding_stop || 'Unknown Stop';
        if (!byStop[key]) byStop[key] = [];
        byStop[key].push(b);
      });
      setGrouped(byStop);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

    load(routeId || undefined);
  }, [routeId, router, isAuthenticated, userType, user, authLoading]);

  const total = useMemo(() => bookings.length, [bookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Error loading bookings</div>
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Bookings {routeId ? '' : '(Sample: Route 29)'}
              </h2>
              <p className="text-sm text-gray-600">Stop-wise bookings for {date}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => load(routeId || undefined)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Load
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-600">No bookings available for the selected date.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([stop, list]) => (
            <div key={stop} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="font-medium text-gray-900">{stop}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-sm text-gray-600">{list.length} booking{list.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {list.map((booking: any) => (
                  <div key={booking.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-gray-900">
                            {booking.students?.student_name || 'Student'}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            ({booking.students?.roll_number || '—'})
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span>Seat: {booking.seat_number || '—'}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                            booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.payment_status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {booking.schedules?.departure_time || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingsFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading bookings...</p>
      </div>
    </div>
  );
}

export default function DriverBookingsPage() {
  return (
    <Suspense fallback={<BookingsFallback />}>
      <BookingsContent />
    </Suspense>
  );
}



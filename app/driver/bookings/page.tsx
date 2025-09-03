'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';
import { Users, Calendar, Clock, MapPin, AlertCircle, CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';

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
      console.error('❌ Error fetching bookings:', err);
      
      // Handle specific error types gracefully
      let errorMessage = 'Failed to load bookings';
      
      if (err.message) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and refresh the page.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please refresh the page and try again.';
        } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.message.includes('forbidden') || err.message.includes('403')) {
          errorMessage = 'Access denied. Contact administrator for assistance.';
        } else if (err.message.includes('not found') || err.message.includes('404')) {
          errorMessage = 'No bookings found for the selected date.';
        } else if (err.message.includes('server') || err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later or contact support.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      // Auto-clear error after 10 seconds
      setTimeout(() => setError(null), 10000);
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
  const confirmedBookings = useMemo(() => bookings.filter(b => b.status === 'confirmed').length, [bookings]);
  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pending').length, [bookings]);
  const paidBookings = useMemo(() => bookings.filter(b => b.payment_status === 'paid').length, [bookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Bookings</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => load(routeId || undefined)} 
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Passenger Bookings {routeId ? '' : '(Sample: Route 29)'}
            </h1>
            <p className="text-blue-100 text-lg">
              Manage and view all passenger bookings for your routes
            </p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">{confirmedBookings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingBookings}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-green-600">{paidBookings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Date Selection</h2>
              <p className="text-sm text-gray-600">Choose a date to view bookings</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{total}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={() => load(routeId || undefined)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Load Bookings
          </button>
        </div>
      </div>

      {/* Bookings List */}
      {Object.keys(grouped).length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
          <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Bookings Found</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            No bookings available for the selected date. Try selecting a different date or check your route assignments.
          </p>
          <div className="w-16 h-1 bg-gray-200 rounded-full mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([stop, list]) => (
            <div key={stop} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-blue-500 mr-3" />
                    <span className="font-semibold text-gray-900 text-lg">{stop}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600 font-medium">
                      {list.length} booking{list.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {list.map((booking: any) => (
                  <div key={booking.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className="font-semibold text-gray-900 text-lg">
                            {booking.students?.student_name || 'Student'}
                          </span>
                          <span className="text-gray-500 text-sm ml-3 bg-gray-100 px-3 py-1 rounded-full">
                            Roll: {booking.students?.roll_number || '—'}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium mr-2">Seat:</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {booking.seat_number || '—'}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            {getStatusIcon(booking.status)}
                            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            {getPaymentStatusIcon(booking.payment_status)}
                            <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                              booking.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                              booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {booking.payment_status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4 mr-2" />
                          <span className="font-medium">{booking.schedules?.departure_time || '—'}</span>
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
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-200 border-t-green-600 mx-auto mb-6"></div>
        <p className="text-gray-600 text-lg font-medium">Loading bookings...</p>
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



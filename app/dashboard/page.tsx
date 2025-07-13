'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  Bell,
  User
} from 'lucide-react';
import Link from 'next/link';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import EnrollmentDashboard from '@/components/enrollment-dashboard';
import { StudentDashboardData } from '@/types';
import { formatCurrency, formatDate, formatTime, getStatusColor, getStatusText } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check authentication using session manager
        if (!sessionManager.isAuthenticated()) {
          throw new Error('Not authenticated');
        }

        const studentId = sessionManager.getCurrentStudentId();
        if (!studentId) {
          throw new Error('Invalid session data');
        }

        const data = await studentHelpers.getDashboardData(studentId);
        setDashboardData(data);
      } catch (error) {
        console.error('Dashboard error:', error);
        toast.error('Failed to load dashboard data');
        // Redirect to login if authentication fails
        if (error instanceof Error && (error.message.includes('authenticated') || error.message.includes('expired'))) {
          window.location.href = '/login';
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 h-32 bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
        <p className="text-gray-600">Please refresh the page or try again later.</p>
      </div>
    );
  }

  const { profile, upcomingBookings, recentPayments, notifications, transportStatus, quickStats } = dashboardData;

  // Debug: Check if student has route allocation
  const hasRouteAllocation = transportStatus.hasActiveRoute || (profile as any)?.allocated_route_id;
  console.log('🚀 DASHBOARD OVERRIDE CHECK:');
  console.log('   - transportStatus.hasActiveRoute:', transportStatus.hasActiveRoute);
  console.log('   - profile.allocated_route_id:', (profile as any)?.allocated_route_id);
  console.log('   - Final hasRouteAllocation:', hasRouteAllocation);
  console.log('   - Will show enrollment:', !hasRouteAllocation);

  // Quick stats cards
  const statsCards = [
    {
      title: 'Total Trips',
      value: quickStats.totalTrips,
      icon: Bus,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Spent',
      value: formatCurrency(quickStats.totalSpent),
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Upcoming Trips',
      value: quickStats.upcomingTrips,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Active Issues',
      value: quickStats.activeGrievances,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-lg font-medium text-white">
              {profile?.studentName?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.studentName}!
            </h1>
            <p className="text-gray-600">
              {profile?.rollNumber} • {profile?.department?.departmentName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last login</p>
          <p className="text-sm font-medium text-gray-900">
            {profile?.lastLogin ? formatDate(profile.lastLogin, 'MMM dd, h:mm a') : 'First time'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transport Status or Enrollment */}
      {/* OVERRIDE: If student has allocated_route_id, hide enrollment */}
      {hasRouteAllocation ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Transport Route</h2>
            <Link
              href="/dashboard/routes"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              View Details <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          {transportStatus.routeInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Route</p>
                <p className="font-medium text-gray-900">
                  {transportStatus.routeInfo.route_number} - {transportStatus.routeInfo.route_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Departure</p>
                <p className="font-medium text-gray-900">
                  {formatTime(transportStatus.routeInfo.departure_time)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fare</p>
                <p className="font-medium text-gray-900">
                  {formatCurrency(transportStatus.routeInfo.fare)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transportStatus.routeInfo.status)}`}>
                  {getStatusText(transportStatus.routeInfo.status)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EnrollmentDashboard 
          student={{
            id: profile?.id || '',
            student_name: profile?.studentName || '',
            email: profile?.email || '',
            transport_enrolled: profile?.transportProfile?.transport_status === 'active',
            enrollment_status: profile?.transportProfile?.enrollment_status || 'pending'
          }}
        />
      )}

      {/* Upcoming Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
            <Link
              href="/dashboard/bookings"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Bus className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.route?.route_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(booking.trip_date)} • {booking.boarding_stop}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{formatCurrency(booking.amount)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming bookings</p>
                <Link
                  href="/dashboard/bookings"
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm mt-2 inline-block"
                >
                  Book a trip
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <Link
              href="/dashboard/payments"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentPayments.length > 0 ? (
              recentPayments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{payment.description}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(payment.created_at)} • {payment.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent payments</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            <Link
              href="/dashboard/notifications"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${notification.type === 'error' ? 'bg-red-100' : notification.type === 'warning' ? 'bg-yellow-100' : notification.type === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
                  <Bell className={`h-4 w-4 ${notification.type === 'error' ? 'text-red-600' : notification.type === 'warning' ? 'text-yellow-600' : notification.type === 'success' ? 'text-green-600' : 'text-blue-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notification.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile Completion */}
      {profile?.profile_completion_percentage && profile.profile_completion_percentage < 100 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-orange-600" />
              <div>
                <h3 className="text-lg font-medium text-orange-900">Complete Your Profile</h3>
                <p className="text-sm text-orange-700">
                  Your profile is {profile.profile_completion_percentage}% complete. 
                  Complete it to get better transport services.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors duration-200"
            >
              Complete Profile
            </Link>
          </div>
          <div className="mt-4">
            <div className="bg-orange-200 rounded-full h-2">
              <div 
                className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profile.profile_completion_percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/bookings"
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
          >
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Book a Trip</p>
              <p className="text-sm text-blue-700">Schedule your next journey</p>
            </div>
          </Link>
          <Link
            href="/dashboard/grievances"
            className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-200"
          >
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900">Report Issue</p>
              <p className="text-sm text-orange-700">Submit a grievance or feedback</p>
            </div>
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
          >
            <User className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Update Profile</p>
              <p className="text-sm text-green-700">Manage your account details</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
} 
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  Bell,
  User,
  MapPin,
  Clock,
  Star,
  Award,
  Activity,
  TrendingUp,
  Shield,
  Zap,
  Target,
  RefreshCw,
  CheckCircle,
  Route,
  Smartphone,
  Mail,
  Phone,
  MessageSquare,
  Settings,
  Eye,
  Gift,
  Heart,
  PlusCircle,
  BookOpen,
  Navigation,
  ChevronRight,
  Play,
  Pause,
  Square,
  BarChart3,
  Users,
  Timer
} from 'lucide-react';
import Link from 'next/link';
import { StudentDashboardData } from '@/types';

interface EnhancedPassengerDashboardProps {
  data: StudentDashboardData;
  loading: boolean;
  onRefresh: () => void;
}

const StatCard = ({ title, value, icon: Icon, change, delay = 0 }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: { value: number; direction: 'up' | 'down' };
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1 }}
    className="modern-card p-6 group cursor-pointer"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-green-100 transition-colors">
        <Icon className="h-6 w-6 text-gray-600 group-hover:text-green-600 transition-colors" />
      </div>
      {change && (
        <div className={`flex items-center space-x-1 text-sm font-medium ${
          change.direction === 'up' ? 'text-green-600' : 'text-red-500'
        }`}>
          <TrendingUp className={`h-4 w-4 ${change.direction === 'down' ? 'rotate-180' : ''}`} />
          <span>{change.value}%</span>
        </div>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
    </div>
  </motion.div>
);

const QuickActionCard = ({ title, description, icon: Icon, href, badge, delay = 0 }: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1 }}
  >
    <Link href={href} className="block group">
      <div className="modern-card p-6 h-full group-hover:shadow-lg transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
            <Icon className="h-6 w-6 text-green-600" />
          </div>
          {badge && badge > 0 && (
            <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
              {badge}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
        <div className="flex items-center text-green-600 mt-4 group-hover:translate-x-1 transition-transform">
          <span className="text-sm font-medium mr-2">View Details</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  </motion.div>
);

const UpcomingBookingCard = ({ booking, delay = 0 }: {
  booking: any;
  delay?: number;
}) => {
  // Format date safely
  const formatBookingDate = (dateValue: any) => {
    if (!dateValue) return 'TBD';
    try {
      const date = new Date(dateValue);
      return !isNaN(date.getTime()) ? date.toLocaleDateString() : 'TBD';
    } catch {
      return 'TBD';
    }
  };

  // Get route name with fallback
  const routeName = booking.route?.routeName || booking.route?.route_name || 'Route';
  
  // Get departure time with fallback
  const departureTime = booking.schedule?.departureTime || 
                       booking.schedule?.departure_time || 
                       booking.departureTime || 
                       'TBD';

  // Format trip date
  const tripDate = formatBookingDate(booking.tripDate || booking.trip_date || booking.scheduleDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="modern-card p-4 hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <Bus className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{routeName}</h4>
          <p className="text-sm text-gray-600">
            {tripDate} • {departureTime}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {booking.status || 'confirmed'}
          </span>
          <p className="text-xs text-gray-500 mt-1">{booking.seatNumber || booking.seat_number || 'N/A'}</p>
        </div>
      </div>
    </motion.div>
  );
};

const RecentPaymentCard = ({ payment, delay = 0 }: {
  payment: any;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1 }}
    className="modern-card p-4 hover:shadow-md transition-all duration-200"
  >
    <div className="flex items-center space-x-4">
      <div className="p-3 bg-green-50 rounded-xl">
        <CreditCard className="h-6 w-6 text-green-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900">{payment.description}</h4>
        <p className="text-sm text-gray-600">{new Date(payment.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">₹{payment.amount}</p>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {payment.status}
        </span>
      </div>
    </div>
  </motion.div>
);

export default function EnhancedPassengerDashboard({ 
  data, 
  loading, 
  onRefresh 
}: EnhancedPassengerDashboardProps) {
  const [refreshing, setRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const { profile, upcomingBookings, recentPayments, notifications, transportStatus, quickStats } = data;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-2xl mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-2xl"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Transport-related stats with modern design
  const statsCards = [
    {
      title: 'Total Trips',
      value: quickStats.totalTrips,
      icon: Bus,
      change: { value: 12, direction: 'up' as const }
    },
    {
      title: 'Total Spent',
      value: `₹${quickStats.totalSpent.toLocaleString()}`,
      icon: CreditCard,
      change: { value: 8, direction: 'up' as const }
    },
    {
      title: 'Upcoming Trips',
      value: quickStats.upcomingTrips,
      icon: Calendar,
      change: { value: 3, direction: 'up' as const }
    },
    {
      title: 'Active Issues',
      value: quickStats.activeGrievances,
      icon: AlertCircle,
      change: { value: 2, direction: 'down' as const }
    }
  ];

  // Transport quick actions with clean design
  const quickActions = [
    {
      title: 'Book a Trip',
      description: 'Schedule your journey',
      icon: Calendar,
      href: '/dashboard/schedules',
    },
    {
      title: 'My Routes',
      description: 'View transport routes',
      icon: MapPin,
      href: '/dashboard/routes',
    },
    {
      title: 'Payments',
      description: 'Manage transactions',
      icon: CreditCard,
      href: '/dashboard/payments',
    },
    {
      title: 'Report Issue',
      description: 'Submit grievance',
      icon: AlertCircle,
      href: '/dashboard/grievances',
      badge: quickStats.activeGrievances
    },
    {
      title: 'Notifications',
      description: 'Important updates',
      icon: Bell,
      href: '/dashboard/notifications',
      badge: notifications.filter(n => !n.readBy?.includes(profile?.id || '')).length
    },
    {
      title: 'Profile',
      description: 'Update details',
      icon: User,
      href: '/dashboard/profile',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Clean Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-heading-1 mb-2">Dashboard</h1>
          <p className="text-body">Plan, prioritize, and accomplish your transport tasks with ease.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="btn-secondary">Import Data</button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </motion.div>

      {/* Transport Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            change={card.change}
            delay={index}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Transport Actions & Bookings */}
        <div className="lg:col-span-3 space-y-8">
          {/* Transport Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="modern-card p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-heading-3">Quick Actions</h2>
                  <p className="text-body">Access your most-used transport features</p>
                </div>
              </div>
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={action.title}
                  title={action.title}
                  description={action.description}
                  icon={action.icon}
                  href={action.href}
                  badge={action.badge}
                  delay={index}
                />
              ))}
            </div>
          </motion.div>

          {/* Upcoming Bookings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="modern-card p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-heading-3">Upcoming Bookings</h2>
                  <p className="text-body">Your scheduled trips</p>
                </div>
              </div>
              
              <Link href="/dashboard/schedules" className="text-blue-600 hover:text-blue-700 transition-colors">
                <Eye className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {upcomingBookings.slice(0, 3).map((booking, index) => (
                <UpcomingBookingCard
                  key={booking.id}
                  booking={booking}
                  delay={index}
                />
              ))}
              
              {upcomingBookings.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming bookings</p>
                  <Link href="/dashboard/schedules" className="text-blue-600 hover:text-blue-700 text-sm">
                    Book your next trip
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Column - Payments & Notifications */}
        <div className="space-y-8">
          {/* Recent Payments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="modern-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-heading-3 mb-1">Recent Payments</h3>
                <p className="text-body text-sm">Your transaction history</p>
              </div>
              <Link href="/dashboard/payments" className="text-green-600 hover:text-green-700 transition-colors">
                <Eye className="w-5 h-5" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentPayments.slice(0, 3).map((payment, index) => (
                <RecentPaymentCard
                  key={payment.id}
                  payment={payment}
                  delay={index}
                />
              ))}
              
              {recentPayments.length === 0 && (
                <div className="text-center py-6">
                  <CreditCard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm">No recent payments</p>
                  <Link href="/dashboard/payments" className="text-green-600 hover:text-green-700 text-sm">
                    View payment history
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Transport Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="modern-card p-6"
          >
            <h3 className="text-heading-3 mb-4">Transport Status</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Route Status</span>
                </div>
                <span className="text-sm text-green-700">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Next Trip</span>
                </div>
                <span className="text-sm text-yellow-700">Tomorrow</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Star className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Service Rating</span>
                </div>
                <span className="text-sm text-blue-700">4.8/5</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
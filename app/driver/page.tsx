'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { driverHelpers } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  MapPin, 
  Navigation, 
  Settings, 
  Clock, 
  Users, 
  Calendar,
  User,
  Route,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  Shield,
  Zap,
  Target,
  RefreshCw,
  Bell,
  BarChart3,
  Timer,
  Car,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  PlusCircle,
  ChevronRight,
  Play,
  Pause,
  Square,
  BookOpen,
  Smartphone,
  Heart,
  Gift,
  Route as RouteIcon
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DriverHomePage() {
  const { user, isAuthenticated, userType, isLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalPassengers: 0,
    averageRating: 0,
    activeRoutes: 0,
    todayBookings: 0,
    weeklyEarnings: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

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
        
        // Load all driver data
        await Promise.all([
          loadAssignedRoutes(driverId),
          loadDriverStats(driverId),
          loadRecentActivities(driverId)
        ]);
      } catch (err: any) {
        setError(err.message || 'Failed to load driver data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router, isAuthenticated, userType, isLoading, user]);

  const loadAssignedRoutes = async (driverId: string) => {
    try {
      const assignedRoutes = await driverHelpers.getAssignedRoutes(driverId);
      setRoutes(assignedRoutes);
    } catch (error) {
      console.error('Failed to load routes:', error);
    }
  };

  const loadDriverStats = async (driverId: string) => {
    try {
      // Mock stats for now - replace with actual API calls
      setStats({
        totalTrips: 156,
        totalPassengers: 1247,
        averageRating: 4.8,
        activeRoutes: routes.length,
        todayBookings: 23,
        weeklyEarnings: 8500
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadRecentActivities = async (driverId: string) => {
    try {
      // Mock activities - replace with actual API calls
      setRecentActivities([
        {
          id: 1,
          type: 'trip_completed',
          title: 'Trip completed',
          description: 'Route 29 - Morning shift completed',
          time: '2 hours ago',
          icon: CheckCircle,
          color: 'text-green-600'
        },
        {
          id: 2,
          type: 'booking_received',
          title: 'New booking',
          description: '5 new passengers for Route 15',
          time: '4 hours ago',
          icon: Users,
          color: 'text-blue-600'
        },
        {
          id: 3,
          type: 'rating_received',
          title: '5-star rating',
          description: 'Received excellent feedback',
          time: '6 hours ago',
          icon: Star,
          color: 'text-yellow-600'
        }
      ]);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  if (isLoading || loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Loading driver dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="text-center py-8">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <div className="text-red-600 mb-2">Error loading dashboard</div>
      <p className="text-sm text-gray-600">{error}</p>
    </div>
  );

  const currentDriver = user;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {currentDriver?.driver_name || currentDriver?.full_name || currentDriver?.name || 'Driver'}!
            </h1>
            <p className="text-blue-100">Ready to start your journey?</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{stats.averageRating}</div>
            <div className="text-blue-100 text-sm">Average Rating</div>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(stats.averageRating) ? 'text-yellow-300 fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Route className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Passengers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPassengers}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today's Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayBookings}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weekly Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.weeklyEarnings}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Link href="/driver/location" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Location Settings</h3>
                <p className="text-sm text-gray-600">Manage location sharing</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/driver/live-tracking" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Live Tracking</h3>
                <p className="text-sm text-gray-600">Start real-time tracking</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/driver/routes" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
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
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-105">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Bookings</h3>
                <p className="text-sm text-gray-600">View passenger bookings</p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Routes */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Assigned Routes</h3>
            <Link href="/driver/routes" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="space-y-3">
            {routes.map((route, index) => (
              <div key={route.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Route {route.route_number}</div>
                    <div className="font-medium text-gray-900">{route.route_name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {route.start_location} → {route.end_location}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      href={`/driver/bookings?routeId=${route.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Bookings
                    </Link>
                    <Link 
                      href={`/driver/live-tracking?routeId=${route.id}`}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Track
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {routes.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <RouteIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No active routes assigned.</p>
                <p className="text-sm">Contact your administrator for route assignments.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Activities */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{activity.title}</div>
                  <div className="text-sm text-gray-600">{activity.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                </div>
              </div>
            ))}
            {recentActivities.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No recent activities.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Additional Quick Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Link href="/driver/profile" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Profile</h3>
                <p className="text-sm text-gray-600">Update your information</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/notifications" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">View all notifications</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/settings" className="block">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">App preferences</p>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}



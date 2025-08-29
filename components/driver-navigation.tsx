'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  MapPin, 
  Navigation, 
  Settings, 
  Users, 
  User, 
  Route,
  Bell,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useState } from 'react';

export default function DriverNavigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/driver',
      icon: Home,
      description: 'Overview and statistics'
    },
    {
      name: 'My Routes',
      href: '/driver/routes',
      icon: Route,
      description: 'View assigned routes'
    },
    {
      name: 'Bookings',
      href: '/driver/bookings',
      icon: Users,
      description: 'Passenger bookings'
    },
    {
      name: 'Live Tracking',
      href: '/driver/live-tracking',
      icon: Navigation,
      description: 'Real-time location tracking'
    },
    {
      name: 'Location Settings',
      href: '/driver/location',
      icon: MapPin,
      description: 'Location preferences'
    },
    {
      name: 'Profile',
      href: '/driver/profile',
      icon: User,
      description: 'Update your information'
    },
    {
      name: 'Notifications',
      href: '/dashboard/notifications',
      icon: Bell,
      description: 'View notifications'
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      description: 'App preferences'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-lg shadow-lg border border-gray-200"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-gray-600" />
          ) : (
            <Menu className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Driver Menu</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3 p-3 text-gray-700">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="font-medium">
                      {user?.driver_name || user?.full_name || user?.name || 'Driver'}
                    </div>
                    <div className="text-xs text-gray-500">Driver</div>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900 mb-2">TMS Driver</h1>
            <p className="text-sm text-gray-600">Transport Management System</p>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-3 p-3 text-gray-700">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <div className="font-medium">
                  {user?.driver_name || user?.full_name || user?.name || 'Driver'}
                </div>
                <div className="text-xs text-gray-500">Driver</div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content margin for desktop */}
      <div className="hidden lg:block lg:ml-64" />
    </>
  );
}

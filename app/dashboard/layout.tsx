'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Calendar, 
  CreditCard, 
  MessageSquare, 
  Bell, 
  User, 
  LogOut, 
  Menu, 
  X,
  Bus,
  MapPin,
  Settings,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';
import { Student } from '@/types';
import NotificationCenter from '@/components/notification-center';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigation: NavigationItem[] = useMemo(() => [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: pathname === '/dashboard' },
    { name: 'My Routes', href: '/dashboard/routes', icon: MapPin, current: pathname === '/dashboard/routes' },
    { name: 'Schedules', href: '/dashboard/schedules', icon: Calendar, current: pathname === '/dashboard/schedules' },
    { name: 'Payments', href: '/dashboard/payments', icon: CreditCard, current: pathname === '/dashboard/payments' },
    { name: 'Grievances', href: '/dashboard/grievances', icon: MessageSquare, current: pathname === '/dashboard/grievances' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, current: pathname === '/dashboard/notifications' },
    { name: 'Profile', href: '/dashboard/profile', icon: User, current: pathname === '/dashboard/profile' },
  ], [pathname]);

  const studentId = student?.id;

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = sessionManager.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const currentStudent = sessionManager.getCurrentStudent();
      if (currentStudent) {
        setStudent({
          id: currentStudent.student_id,
          studentName: currentStudent.student_name,
          rollNumber: currentStudent.roll_number,
          email: session.user?.email || '',
          mobile: '',
          firstLoginCompleted: true,
          profileCompletionPercentage: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Student);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      sessionManager.clearSession();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Failed to logout');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden flex">
      {/* Enhanced Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300 ease-out ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-80 flex-col bg-white shadow-2xl transition-all duration-300 ease-out transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                <Bus className="h-6 w-6 text-white" />
              </div>
                             <div>
                 <h1 className="text-lg font-bold text-gray-900">TMS Student</h1>
                 <p className="text-sm text-gray-500">Transport Management</p>
               </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">MENU</p>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-nav-item ${item.current ? 'active' : ''} mb-1`}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">GENERAL</p>
              <Link
                href="/dashboard/settings"
                className="sidebar-nav-item mb-1"
              >
                <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </nav>

          {/* User Profile */}
          <div className="border-t border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {student?.studentName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {student?.studentName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {student?.email || 'student@email.com'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">TMS Student</h1>
              <p className="text-sm text-gray-500">Transport Management System</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-6 py-8 space-y-2 overflow-y-auto">
          <div className="mb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">MENU</p>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`sidebar-nav-item ${item.current ? 'active' : ''} mb-1`}
              >
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">GENERAL</p>
            <Link
              href="/dashboard/settings"
              className="sidebar-nav-item mb-1"
            >
              <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="font-medium">Settings</span>
            </Link>
          </div>
        </nav>
        
        {/* User Profile */}
        <div className="border-t border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="relative">
              <img
                src="/api/placeholder/40/40"
                alt={student?.studentName}
                className="h-10 w-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-sm font-bold text-white">
                  {student?.studentName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {student?.studentName || 'Student'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {student?.email || 'student@email.com'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80 flex flex-col h-full flex-1">
        {/* Enhanced Top bar */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 flex h-16 flex-shrink-0 items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center lg:hidden">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TMS</span>
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                                 <input
                   type="text"
                   placeholder="Search transport..."
                   className="w-96 pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                 />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                    ⌘ F
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Center */}
            {studentId && (
              <NotificationCenter 
                userId={studentId} 
                userType="student" 
                className="mr-1"
              />
            )}
            
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center cursor-pointer hover:bg-green-700 transition-colors">
                <span className="text-xs font-bold text-white">
                  {student?.studentName?.charAt(0).toUpperCase() || 'S'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container-modern py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 
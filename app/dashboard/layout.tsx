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
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { sessionManager } from '@/lib/session';
import { Student } from '@/types';
import NotificationCenter from '@/components/notification-center';
import NotificationBanner from '@/components/notification-banner';

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

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (!sessionManager.isAuthenticated()) {
          router.replace('/login');
          return;
        }

        const currentStudent = sessionManager.getCurrentStudent();
        if (currentStudent) {
          // Create a stable student object
          setStudent(prev => {
            // Only update if the student ID has changed
            if (prev?.id === currentStudent.student_id) {
              return prev;
            }
            
            return {
              id: currentStudent.student_id,
              studentName: currentStudent.student_name,
              rollNumber: currentStudent.roll_number,
              email: sessionManager.getSession()?.user?.email || '',
              mobile: '',
              firstLoginCompleted: true,
              profileCompletionPercentage: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            } as Student;
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]); // Only depend on router, not pathname

  // Memoize the student ID to prevent unnecessary re-renders of NotificationCenter
  const studentId = useMemo(() => student?.id || '', [student?.id]);

  const handleLogout = async () => {
    try {
      sessionManager.clearSession();
      toast.success('Logged out successfully');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bus className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-linear ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">TMS Student</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  item.current
                    ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {student?.studentName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {student?.studentName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {student?.rollNumber}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white shadow-lg">
        <div className="flex h-16 items-center px-4 border-b border-gray-200">
          <Bus className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-lg font-semibold text-gray-900">TMS Student</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                item.current
                  ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  item.current ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {student?.studentName?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {student?.studentName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {student?.rollNumber}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col h-full">
        {/* Top bar */}
        <div className="bg-white shadow-sm lg:shadow-none border-b border-gray-200 flex h-16 flex-shrink-0 items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center lg:hidden">
            <Bus className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-lg font-semibold text-gray-900">TMS</span>
          </div>

          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <div className="text-sm text-gray-500">
              Welcome back, <span className="font-medium text-gray-900">{student?.studentName}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Center */}
            {studentId && (
              <NotificationCenter 
                userId={studentId} 
                userType="student" 
                className="mr-2"
              />
            )}
            
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{student?.studentName}</p>
              <p className="text-xs text-gray-500">{student?.rollNumber}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {student?.studentName?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4">
            {/* Notification Banner */}
            {studentId && (
              <NotificationBanner 
                userId={studentId} 
                className="mb-4"
              />
            )}
            
            <div className="px-0">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
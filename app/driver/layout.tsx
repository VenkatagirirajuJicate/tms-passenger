import React from 'react';
import Link from 'next/link';
import { Home, MapPin, Users, Navigation, User } from 'lucide-react';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <h1 className="text-lg font-semibold text-gray-900 truncate">TMS - DRIVER</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pb-20 overflow-x-hidden">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 bottom-nav-safe">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-around py-2">
            <Link 
              href="/driver" 
              className="flex flex-col items-center py-2 px-2 sm:px-3 text-gray-600 hover:text-blue-600 transition-colors min-w-0"
            >
              <Home className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-xs truncate">Home</span>
            </Link>
            <Link 
              href="/driver/routes" 
              className="flex flex-col items-center py-2 px-2 sm:px-3 text-gray-600 hover:text-blue-600 transition-colors min-w-0"
            >
              <MapPin className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-xs truncate">Routes</span>
            </Link>
            <Link 
              href="/driver/bookings" 
              className="flex flex-col items-center py-2 px-2 sm:px-3 text-gray-600 hover:text-blue-600 transition-colors min-w-0"
            >
              <Users className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-xs truncate">Bookings</span>
            </Link>
            <Link 
              href="/driver/live-tracking" 
              className="flex flex-col items-center py-2 px-2 sm:px-3 text-gray-600 hover:text-blue-600 transition-colors min-w-0"
            >
              <Navigation className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-xs truncate">Track</span>
            </Link>
            <Link 
              href="/driver/profile" 
              className="flex flex-col items-center py-2 px-2 sm:px-3 text-gray-600 hover:text-blue-600 transition-colors min-w-0"
            >
              <User className="w-5 h-5 mb-1 flex-shrink-0" />
              <span className="text-xs truncate">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}



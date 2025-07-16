'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  CreditCard, 
  MapPin, 
  MessageSquare, 
  Bell, 
  User, 
  Search, 
  ArrowRight,
  Zap,
  Activity,
  RefreshCw,
  Bus,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Route,
  Wallet,
  Settings,
  HelpCircle,
  Star,
  Award,
  Target,
  BookOpen,
  Phone,
  Mail,
  Navigation,
  Heart,
  Gift
} from 'lucide-react';
import Link from 'next/link';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  badge?: string | number;
  isNew?: boolean;
  onClick?: () => void;
}

interface EnhancedQuickActionsProps {
  className?: string;
  onActionClick?: (actionId: string) => void;
}

const EnhancedQuickActions: React.FC<EnhancedQuickActionsProps> = ({
  className = '',
  onActionClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const allActions: QuickAction[] = [
    {
      id: 'book-trip',
      title: 'Book a Trip',
      description: 'Schedule your journey',
      href: '/dashboard/schedules',
      icon: Calendar,
      color: 'text-blue-700',
      bgColor: 'bg-gradient-to-br from-blue-100 to-blue-200',
      isNew: true
    },
    {
      id: 'view-routes',
      title: 'My Routes',
      description: 'View transport routes',
      href: '/dashboard/routes',
      icon: MapPin,
      color: 'text-green-700',
      bgColor: 'bg-gradient-to-br from-green-100 to-green-200'
    },
    {
      id: 'make-payment',
      title: 'Make Payment',
      description: 'Pay fees and fines',
      href: '/dashboard/payments',
      icon: CreditCard,
      color: 'text-purple-700',
      bgColor: 'bg-gradient-to-br from-purple-100 to-purple-200',
      badge: '₹450'
    },
    {
      id: 'track-bus',
      title: 'Track Bus',
      description: 'Real-time location',
      href: '/dashboard/tracking',
      icon: Bus,
      color: 'text-orange-700',
      bgColor: 'bg-gradient-to-br from-orange-100 to-orange-200',
      badge: 'Live'
    },
    {
      id: 'report-issue',
      title: 'Report Issue',
      description: 'Submit grievance',
      href: '/dashboard/grievances',
      icon: MessageSquare,
      color: 'text-red-700',
      bgColor: 'bg-gradient-to-br from-red-100 to-red-200',
      badge: 1
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Important updates',
      href: '/dashboard/notifications',
      icon: Bell,
      color: 'text-yellow-700',
      bgColor: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
      badge: 3
    },
    {
      id: 'profile',
      title: 'My Profile',
      description: 'Update your details',
      href: '/dashboard/profile',
      icon: User,
      color: 'text-indigo-700',
      bgColor: 'bg-gradient-to-br from-indigo-100 to-indigo-200'
    },
    {
      id: 'payment-history',
      title: 'Payment History',
      description: 'View transactions',
      href: '/dashboard/payments?tab=history',
      icon: Wallet,
      color: 'text-emerald-700',
      bgColor: 'bg-gradient-to-br from-emerald-100 to-emerald-200'
    },
    {
      id: 'schedule-history',
      title: 'Trip History',
      description: 'Past bookings',
      href: '/dashboard/schedules?tab=history',
      icon: Clock,
      color: 'text-teal-700',
      bgColor: 'bg-gradient-to-br from-teal-100 to-teal-200'
    },
    {
      id: 'help-support',
      title: 'Help & Support',
      description: 'Get assistance',
      href: '/dashboard/help',
      icon: HelpCircle,
      color: 'text-pink-700',
      bgColor: 'bg-gradient-to-br from-pink-100 to-pink-200'
    },
    {
      id: 'feedback',
      title: 'Give Feedback',
      description: 'Share your experience',
      href: '/dashboard/feedback',
      icon: Star,
      color: 'text-rose-700',
      bgColor: 'bg-gradient-to-br from-rose-100 to-rose-200'
    },
    {
      id: 'emergency-contact',
      title: 'Emergency Contact',
      description: 'Quick help access',
      href: '/dashboard/emergency',
      icon: Phone,
      color: 'text-red-700',
      bgColor: 'bg-gradient-to-br from-red-100 to-red-200'
    }
  ];

  const filteredActions = allActions.filter(action => {
    const matchesSearch = searchTerm === '' || 
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick();
    }
    if (onActionClick) {
      onActionClick(action.id);
    }
  };

  return (
    <div className={`bg-white rounded-3xl shadow-xl border border-gray-100 p-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-gray-600">Access your most-used features</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search actions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredActions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative"
          >
            <Link href={action.href} className="block">
              <div
                className={`${action.bgColor} p-6 rounded-2xl border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-gray-300 cursor-pointer group-hover:shadow-xl`}
                onClick={() => handleActionClick(action)}
              >
                {/* Badge */}
                {action.badge && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {action.badge}
                  </div>
                )}
                
                {/* New indicator */}
                {action.isNew && (
                  <div className="absolute -top-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Icon */}
                <div className={`${action.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                    {action.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="mt-4 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* No results */}
      {filteredActions.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No actions found matching your search.</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Transport Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{filteredActions.length} actions available</span>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-semibold">Student Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuickActions; 
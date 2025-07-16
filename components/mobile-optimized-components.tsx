'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, X, ChevronRight, Search, RefreshCw, Plus, Edit, Trash2, 
  Eye, MoreVertical, ArrowLeft, Home, Settings, Bell, User, LogOut,
  Bus, MapPin, Calendar, CreditCard, MessageSquare, Navigation
} from 'lucide-react';

// Mobile-First Responsive Grid
export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  );
};

// Mobile Touch-Friendly Button
export const TouchButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ children, onClick, variant = 'primary', size = 'md', className = '' }) => {
  const variants = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-500 text-white hover:bg-gray-600',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };
  
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-10',
    md: 'px-4 py-3 text-base min-h-12',
    lg: 'px-6 py-4 text-lg min-h-14'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        ${variants[variant]} ${sizes[size]} 
        rounded-xl font-semibold transition-all duration-200
        active:scale-95 touch-manipulation
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};

// Mobile Navigation Drawer
export const MobileDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right';
}> = ({ isOpen, onClose, children, position = 'left' }) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <div className={`
        fixed top-0 ${position === 'left' ? 'left-0' : 'right-0'} 
        h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'}
        md:hidden
      `}>
        <div className="p-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
          {children}
        </div>
      </div>
    </>
  );
};

// Mobile-Optimized Card
export const MobileCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
}> = ({ children, className = '', onTap }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-4
        ${onTap ? 'cursor-pointer active:scale-98' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

// Mobile Bottom Sheet
export const MobileBottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
}> = ({ isOpen, onClose, children, height = 'auto' }) => {
  const heightClasses = {
    auto: 'max-h-96',
    half: 'h-1/2',
    full: 'h-full'
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      <div className={`
        fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl
        transform transition-transform duration-300 z-50
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        ${heightClasses[height]}
      `}>
        <div className="p-4">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          {children}
        </div>
      </div>
    </>
  );
};

// Mobile-Optimized Input
export const MobileInput: React.FC<{
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  className?: string;
}> = ({ placeholder, value, onChange, type = 'text', className = '' }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full px-4 py-3 text-base border border-gray-300 rounded-xl
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        min-h-12 touch-manipulation
        ${className}
      `}
    />
  );
};

// Mobile Action Sheet
export const MobileActionSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  actions: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }>;
}> = ({ isOpen, onClose, actions }) => {
  return (
    <MobileBottomSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <TouchButton
            key={index}
            onClick={() => {
              action.onClick();
              onClose();
            }}
            variant={action.variant === 'danger' ? 'danger' : 'secondary'}
            className="w-full flex items-center justify-center space-x-3"
          >
            <action.icon className="w-5 h-5" />
            <span>{action.label}</span>
          </TouchButton>
        ))}
      </div>
    </MobileBottomSheet>
  );
};

// Mobile List Item
export const MobileListItem: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  onTap?: () => void;
  showChevron?: boolean;
}> = ({ title, subtitle, icon: Icon, badge, onTap, showChevron = false }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
      className={`
        flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200
        ${onTap ? 'cursor-pointer active:scale-98' : ''}
      `}
    >
      {Icon && (
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
        {subtitle && <p className="text-gray-600 text-sm truncate">{subtitle}</p>}
      </div>
      
      {badge && (
        <div className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
          {badge}
        </div>
      )}
      
      {showChevron && <ChevronRight className="w-5 h-5 text-gray-400" />}
    </motion.div>
  );
};

// Mobile Trip Card
export const MobileTripCard: React.FC<{
  title: string;
  subtitle: string;
  time: string;
  status: 'upcoming' | 'active' | 'completed';
  onTap?: () => void;
}> = ({ title, subtitle, time, status, onTap }) => {
  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800'
  };

  return (
    <MobileCard onTap={onTap}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bus className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
            {status}
          </div>
          <p className="text-sm text-gray-500 mt-1">{time}</p>
        </div>
      </div>
    </MobileCard>
  );
};

// Mobile Payment Card
export const MobilePaymentCard: React.FC<{
  title: string;
  amount: string;
  date: string;
  status: 'paid' | 'pending' | 'failed';
  onTap?: () => void;
}> = ({ title, amount, date, status, onTap }) => {
  const statusColors = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800'
  };

  return (
    <MobileCard onTap={onTap}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{date}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-gray-900">{amount}</p>
          <div className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[status]}`}>
            {status}
          </div>
        </div>
      </div>
    </MobileCard>
  );
};

// Mobile Floating Action Button
export const MobileFAB: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  className?: string;
}> = ({ icon: Icon, onClick, position = 'bottom-right', className = '' }) => {
  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`
        fixed ${positions[position]} w-14 h-14 bg-blue-500 hover:bg-blue-600
        text-white rounded-full shadow-lg z-50 flex items-center justify-center
        active:scale-90 transition-all duration-200
        ${className}
      `}
    >
      <Icon className="w-6 h-6" />
    </motion.button>
  );
};

// Mobile Pull-to-Refresh
export const MobilePullToRefresh: React.FC<{
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}> = ({ children, onRefresh, className = '' }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Pull to refresh indicator */}
      <div className="absolute top-0 left-0 right-0 flex justify-center py-4 z-10">
        <motion.div
          animate={{ rotate: refreshing ? 360 : 0 }}
          transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
        >
          <RefreshCw className={`w-6 h-6 ${refreshing ? 'text-blue-500' : 'text-gray-400'}`} />
        </motion.div>
      </div>

      <div className="overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

// Mobile Search Bar
export const MobileSearchBar: React.FC<{
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}> = ({ placeholder = 'Search...', value, onChange, onFocus, onBlur, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-12 touch-manipulation"
      />
    </div>
  );
};

// Mobile Tab Bar
export const MobileTabBar: React.FC<{
  tabs: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}> = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`flex bg-white border-t border-gray-200 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            flex-1 flex flex-col items-center justify-center py-3 px-2 relative
            ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}
            hover:text-blue-600 transition-colors touch-manipulation
          `}
        >
          <tab.icon className="w-6 h-6 mb-1" />
          <span className="text-xs font-medium">{tab.label}</span>
          {tab.badge && tab.badge > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {tab.badge > 9 ? '9+' : tab.badge}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}; 
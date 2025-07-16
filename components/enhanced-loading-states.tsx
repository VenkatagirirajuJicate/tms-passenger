'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  RefreshCw, 
  Zap, 
  Activity, 
  Heart, 
  Star,
  Circle,
  Square,
  Triangle,
  Bus,
  Users,
  CreditCard,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  MapPin,
  Car,
  Bell,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Route,
  Clock,
  Wallet
} from 'lucide-react';

// Base Skeleton Component
interface SkeletonProps {
  className?: string;
  animate?: boolean;
  variant?: 'default' | 'rounded' | 'circular' | 'text';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  animate = true,
  variant = 'default',
  width = 'w-full',
  height = 'h-4'
}) => {
  const baseClasses = 'bg-gray-200 relative overflow-hidden';
  const variantClasses = {
    default: 'rounded-md',
    rounded: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded-sm'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${width} ${height} ${className}`}>
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full"
          animate={{ translateX: '200%' }}
          transition={{ 
            repeat: Infinity, 
            duration: 1.5, 
            ease: 'linear',
            repeatDelay: 0.5
          }}
        />
      )}
    </div>
  );
};

// Enhanced Loading Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'ring' | 'dual-ring';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-blue-600',
  variant = 'default',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full bg-current ${color}`}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <motion.div
            className={`rounded-full bg-current ${color} ${sizeClasses[size]}`}
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        );
      
      case 'bounce':
        return (
          <motion.div
            className={`rounded-full bg-current ${color} ${sizeClasses[size]}`}
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        );
      
      case 'ring':
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            <div className={`absolute inset-0 rounded-full border-2 border-gray-200`} />
            <motion.div
              className={`absolute inset-0 rounded-full border-2 border-t-current ${color} border-transparent`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        );
      
      case 'dual-ring':
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            <motion.div
              className={`absolute inset-0 rounded-full border-2 border-t-current ${color} border-transparent`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className={`absolute inset-1 rounded-full border-2 border-b-current ${color} border-transparent`}
              animate={{ rotate: -360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        );
      
      default:
        return (
          <Loader2 className={`animate-spin ${color} ${sizeClasses[size]}`} />
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {renderSpinner()}
    </div>
  );
};

// Card Skeleton
interface CardSkeletonProps {
  showAvatar?: boolean;
  showActions?: boolean;
  lines?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  showAvatar = false,
  showActions = false,
  lines = 3,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <Skeleton variant="circular" width="w-12" height="h-12" />
        )}
        <div className="flex-1 space-y-3">
          <Skeleton width="w-3/4" height="h-5" />
          <Skeleton width="w-1/2" height="h-4" />
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} width={`w-${Math.floor(Math.random() * 3) + 5}/6`} height="h-4" />
          ))}
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <Skeleton variant="circular" width="w-8" height="h-8" />
            <Skeleton variant="circular" width="w-8" height="h-8" />
          </div>
        )}
      </div>
    </div>
  );
};

// Trip Card Skeleton
export const TripCardSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width="w-12" height="h-12" />
          <div className="space-y-2">
            <Skeleton width="w-24" height="h-4" />
            <Skeleton width="w-16" height="h-3" />
          </div>
        </div>
        <Skeleton variant="rounded" width="w-16" height="h-6" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton width="w-20" height="h-4" />
          <Skeleton width="w-16" height="h-4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton width="w-24" height="h-4" />
          <Skeleton width="w-12" height="h-4" />
        </div>
      </div>
    </div>
  );
};

// Payment Card Skeleton
export const PaymentCardSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width="w-10" height="h-10" />
          <div className="space-y-2">
            <Skeleton width="w-32" height="h-4" />
            <Skeleton width="w-20" height="h-3" />
          </div>
        </div>
        <div className="text-right space-y-2">
          <Skeleton width="w-16" height="h-5" />
          <Skeleton width="w-12" height="h-3" />
        </div>
      </div>
    </div>
  );
};

// Dashboard Skeleton
export const DashboardSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <Skeleton width="w-48" height="h-6" className="bg-white/20" />
            <Skeleton width="w-32" height="h-4" className="bg-white/20" />
          </div>
          <Skeleton variant="circular" width="w-16" height="h-16" className="bg-white/20" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton width="w-16" height="h-4" />
                <Skeleton width="w-20" height="h-8" />
              </div>
              <Skeleton variant="circular" width="w-12" height="h-12" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Trips */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton width="w-32" height="h-6" />
              <Skeleton variant="circular" width="w-6" height="h-6" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <TripCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton width="w-32" height="h-6" />
              <Skeleton variant="circular" width="w-6" height="h-6" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <PaymentCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Route Card Skeleton
export const RouteCardSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Skeleton variant="circular" width="w-12" height="h-12" />
          <div className="space-y-2">
            <Skeleton width="w-24" height="h-5" />
            <Skeleton width="w-32" height="h-4" />
          </div>
        </div>
        <Skeleton variant="rounded" width="w-16" height="h-6" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width="w-4" height="h-4" />
          <Skeleton width="w-40" height="h-4" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" width="w-4" height="h-4" />
          <Skeleton width="w-32" height="h-4" />
        </div>
      </div>
    </div>
  );
};

// Schedule List Skeleton
export const ScheduleListSkeleton: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton variant="circular" width="w-12" height="h-12" />
              <div className="space-y-2">
                <Skeleton width="w-32" height="h-5" />
                <Skeleton width="w-24" height="h-4" />
              </div>
            </div>
            <div className="text-right space-y-2">
              <Skeleton width="w-16" height="h-4" />
              <Skeleton width="w-20" height="h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading Overlay
interface LoadingOverlayProps {
  message?: string;
  transparent?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading...',
  transparent = false,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${transparent ? 'bg-black/20' : 'bg-white/90'}
        backdrop-blur-sm ${className}
      `}
    >
      <div className="text-center">
        <LoadingSpinner size="lg" variant="dual-ring" />
        <p className="mt-4 text-gray-600 font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

// Progressive Loading
interface ProgressiveLoadingProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  steps,
  currentStep,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <LoadingSpinner size="lg" variant="ring" />
        <p className="mt-4 text-xl font-semibold text-gray-900">
          {steps[currentStep] || 'Loading...'}
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
              ${index < currentStep 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }
            `}>
              {index < currentStep ? (
                <CheckCircle className="w-4 h-4" />
              ) : index === currentStep ? (
                <LoadingSpinner size="sm" color="text-white" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-sm ${index <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Empty State
interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Calendar,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </div>
  );
};

// Pulse Loading
export const PulseLoading: React.FC<{ className?: string }> = ({ 
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-blue-600 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Button Loading State
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

export const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  loading,
  children,
  className = ''
}) => {
  return (
    <button
      disabled={loading}
      className={`
        relative inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium
        transition-all duration-200 ${className}
        ${loading ? 'opacity-75 cursor-not-allowed' : ''}
      `}
    >
      {loading && (
        <LoadingSpinner size="sm" className="mr-2" />
      )}
      {children}
    </button>
  );
}; 
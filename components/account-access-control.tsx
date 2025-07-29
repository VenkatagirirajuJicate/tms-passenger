'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  CreditCard, 
  AlertTriangle, 
  ArrowRight,
  ShieldAlert,
  Calendar,
  Bus,
  MessageSquare,
  Route
} from 'lucide-react';
import { Button } from '@/components/modern-ui-components';
import Link from 'next/link';

interface AccountAccessControlProps {
  isActive: boolean;
  children: React.ReactNode;
  featureName: string;
  redirectTo?: string;
  nextDueAmount?: number;
  className?: string;
}

const AccountAccessControl: React.FC<AccountAccessControlProps> = ({
  isActive,
  children,
  featureName,
  redirectTo = '/dashboard/payments',
  nextDueAmount,
  className = ''
}) => {
  // If account is active, render children normally
  if (isActive) {
    return <>{children}</>;
  }

  // If account is inactive, show restriction overlay
  return (
    <div className={`relative ${className}`}>
      {/* Blurred/Disabled Content */}
      <div 
        className="relative pointer-events-none select-none"
        style={{ filter: 'blur(2px) grayscale(80%)' }}
      >
        <div className="opacity-30">
          {children}
        </div>
      </div>

      {/* Restriction Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-lg border-2 border-red-200"
      >
        <div className="text-center p-6 max-w-md">
          {/* Lock Icon */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {featureName} Restricted
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4">
            Your account payment has expired. Please pay your term fee to reactivate this feature.
          </p>

          {/* Amount Due */}
          {nextDueAmount && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Amount Due: ₹{nextDueAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}

          {/* Pay Now Button */}
          <Link href={redirectTo}>
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              icon={CreditCard}
            >
              Pay Now to Unlock
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

// Feature-specific access control components
export const ScheduleAccessControl: React.FC<{
  isActive: boolean;
  children: React.ReactNode;
  nextDueAmount?: number;
}> = ({ isActive, children, nextDueAmount }) => (
  <AccountAccessControl
    isActive={isActive}
    featureName="Schedule Booking"
    redirectTo="/dashboard/payments"
    nextDueAmount={nextDueAmount}
  >
    {children}
  </AccountAccessControl>
);

export const RouteAccessControl: React.FC<{
  isActive: boolean;
  children: React.ReactNode;
  nextDueAmount?: number;
}> = ({ isActive, children, nextDueAmount }) => (
  <AccountAccessControl
    isActive={isActive}
    featureName="Route Information"
    redirectTo="/dashboard/payments"
    nextDueAmount={nextDueAmount}
  >
    {children}
  </AccountAccessControl>
);

export const GrievanceAccessControl: React.FC<{
  isActive: boolean;
  children: React.ReactNode;
  nextDueAmount?: number;
}> = ({ isActive, children, nextDueAmount }) => (
  <AccountAccessControl
    isActive={isActive}
    featureName="Grievance System"
    redirectTo="/dashboard/payments"
    nextDueAmount={nextDueAmount}
  >
    {children}
  </AccountAccessControl>
);

// Service Status Banner for inactive accounts
export const ServiceStatusBanner: React.FC<{
  isActive: boolean;
  nextDueAmount?: number;
}> = ({ isActive, nextDueAmount }) => {
  if (isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg shadow-lg mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-6 h-6" />
          <div>
            <h4 className="font-semibold">Services Suspended</h4>
            <p className="text-sm text-red-100">
              Most features are restricted due to pending payment
            </p>
          </div>
        </div>
        <div className="text-right">
          {nextDueAmount && (
            <div className="text-lg font-bold">₹{nextDueAmount.toLocaleString('en-IN')}</div>
          )}
          <Link href="/dashboard/payments">
            <Button 
              size="sm" 
              variant="secondary" 
              className="bg-white text-red-600 hover:bg-red-50"
            >
              Pay Now
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

// Available services display for inactive accounts
export const AvailableServicesInfo: React.FC<{
  isActive: boolean;
}> = ({ isActive }) => {
  if (isActive) return null;

  const availableServices = [
    { icon: CreditCard, name: 'Payment Processing', description: 'Pay your term fees' },
    { icon: Calendar, name: 'Payment History', description: 'View past transactions' },
  ];

  const restrictedServices = [
    { icon: Bus, name: 'Schedule Booking', description: 'Book transport schedules' },
    { icon: Route, name: 'Route Tracking', description: 'Live route information' },
    { icon: MessageSquare, name: 'Grievances', description: 'Submit complaints' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6 mb-6">
      {/* Available Services */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-3 flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Available Services
        </h4>
        <div className="space-y-2">
          {availableServices.map((service, index) => (
            <div key={index} className="flex items-center space-x-3">
              <service.icon className="w-4 h-4 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-800">{service.name}</div>
                <div className="text-xs text-green-600">{service.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Restricted Services */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-3 flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          Restricted Services
        </h4>
        <div className="space-y-2">
          {restrictedServices.map((service, index) => (
            <div key={index} className="flex items-center space-x-3">
              <service.icon className="w-4 h-4 text-red-600" />
              <div>
                <div className="text-sm font-medium text-red-800">{service.name}</div>
                <div className="text-xs text-red-600">{service.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountAccessControl; 
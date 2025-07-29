'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  CreditCard,
  Calendar,
  Shield,
  ShieldAlert
} from 'lucide-react';

interface PaymentStatusBadgeProps {
  isActive: boolean;
  lastPaidTerm?: {
    termName: string;
    academicYear: string;
    semester: string;
    paidDate: string;
    validUntil: string;
    amount: number;
  };
  nextDueAmount?: number;
  nextDueDate?: string;
  className?: string;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  isActive,
  lastPaidTerm,
  nextDueAmount,
  nextDueDate,
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDaysRemaining = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const badgeVariants = {
    active: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    inactive: {
      scale: 0.98,
      rotate: 0,
      transition: { duration: 0.3 }
    }
  };

  if (isActive) {
    // Handle case with payment history
    if (lastPaidTerm) {
      const daysUntilExpiry = getDaysRemaining(lastPaidTerm.validUntil);
      const isNearExpiry = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      
      return (
        <motion.div
          variants={badgeVariants}
          animate="active"
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 p-6 shadow-lg ${className}`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/20 rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-800">Account Active</h3>
                  <p className="text-sm text-green-600">Transport services enabled</p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Last Paid Term:</span>
                <span className="text-sm font-bold text-green-800">{lastPaidTerm.termName}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Academic Year:</span>
                <span className="text-sm font-bold text-green-800">{lastPaidTerm.academicYear}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Amount Paid:</span>
                <span className="text-sm font-bold text-green-800">{formatCurrency(lastPaidTerm.amount)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Valid Until:</span>
                <span className={`text-sm font-bold ${isNearExpiry ? 'text-orange-600' : 'text-green-800'}`}>
                  {formatDate(lastPaidTerm.validUntil)}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex items-center justify-center">
              <div className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium">
                ✓ All Services Available
              </div>
            </div>

            {/* Expiry Warning */}
            {isNearExpiry && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-orange-700">
                    Expires in {daysUntilExpiry} days
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    // Handle case with no payment history but account is active (current term period)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Determine current term and dates
    let currentTerm = '';
    let termPeriod = '';
    let termEndDate = '';
    
    if (currentMonth >= 6 && currentMonth <= 9) {
      currentTerm = 'Term 1';
      termPeriod = 'June - September';
      termEndDate = `September ${currentDate.getFullYear()}`;
    } else if (currentMonth >= 10 || currentMonth <= 1) {
      currentTerm = 'Term 2';
      termPeriod = 'October - January';
      const year = currentMonth >= 10 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
      termEndDate = `January ${year}`;
    } else {
      currentTerm = 'Term 3';
      termPeriod = 'February - May';
      termEndDate = `May ${currentDate.getFullYear()}`;
    }
    
    return (
      <motion.div
        variants={badgeVariants}
        animate="active"
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 p-6 shadow-lg ${className}`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/20 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-200/20 rounded-full translate-y-12 -translate-x-12"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header with Icon */}
                      <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-800">Active Term Period</h3>
                  <p className="text-sm text-green-600">Full access during {currentTerm}</p>
                </div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>

          {/* Status Information */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Current Term:</span>
              <span className="text-sm font-bold text-green-800">{currentTerm}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Term Period:</span>
              <span className="text-sm font-bold text-green-800">{termPeriod}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-700">Payment Status:</span>
              <span className="text-sm font-bold text-green-800">Not Required Yet</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4 flex items-center justify-center">
            <div className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium">
              ✓ All Services Available
            </div>
          </div>

          {/* Info Notice */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-green-700 font-medium mb-1">Access During Active Term</p>
              <p className="text-xs text-green-600">
                You have full access to all services during the current term period. Payment will be required after {termEndDate}.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Inactive Account Badge
  return (
    <motion.div
      variants={badgeVariants}
      animate="inactive"
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-400 p-6 shadow-lg ${className}`}
      style={{ filter: 'grayscale(100%)' }}
    >
      {/* Background Pattern - Muted */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-gray-600/10"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gray-300/20 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-400/20 rounded-full translate-y-12 -translate-x-12"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-500 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-700">Account Inactive</h3>
              <p className="text-sm text-gray-600">Payment required to reactivate</p>
            </div>
          </div>
          <XCircle className="w-8 h-8 text-gray-500" />
        </div>

        {/* Payment Required Details */}
        <div className="space-y-3">
          {lastPaidTerm && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Last Payment:</span>
                <span className="text-sm font-bold text-gray-700">
                  {lastPaidTerm.termName} - {lastPaidTerm.academicYear}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Expired On:</span>
                <span className="text-sm font-bold text-red-600">
                  {formatDate(lastPaidTerm.validUntil)}
                </span>
              </div>
            </>
          )}
          
          {nextDueAmount && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Amount Due:</span>
              <span className="text-sm font-bold text-red-600">{formatCurrency(nextDueAmount)}</span>
            </div>
          )}
        </div>

        {/* Status Badge - Inactive */}
        <div className="mt-4 flex items-center justify-center">
          <div className="px-4 py-2 bg-gray-500 text-white rounded-full text-sm font-medium">
            ⚠ Payment Required
          </div>
        </div>

        {/* Action Required */}
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-red-700 font-medium mb-2">Services Suspended</p>
            <p className="text-xs text-red-600">
              Please pay your term fee to reactivate booking and other services
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStatusBadge; 
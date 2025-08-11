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
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 p-4 sm:p-6 shadow-lg w-full ${className}`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10"></div>
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-green-200/20 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-emerald-200/20 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
          
          {/* Content */}
          <div className="relative z-10">
            {/* Header with Icon */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-green-800 truncate">Account Active</h3>
                  <p className="text-xs sm:text-sm text-green-600 truncate">Transport services enabled</p>
                </div>
              </div>
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
            </div>

            {/* Payment Details */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700">Last Paid Term:</span>
                <span className="text-xs sm:text-sm font-bold text-green-800 truncate">{lastPaidTerm.termName}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700">Academic Year:</span>
                <span className="text-xs sm:text-sm font-bold text-green-800 truncate">{lastPaidTerm.academicYear}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700">Amount Paid:</span>
                <span className="text-xs sm:text-sm font-bold text-green-800 truncate">{formatCurrency(lastPaidTerm.amount)}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <span className="text-xs sm:text-sm font-medium text-green-700">Valid Until:</span>
                <span className={`text-xs sm:text-sm font-bold ${isNearExpiry ? 'text-orange-600' : 'text-green-800'} truncate`}>
                  {formatDate(lastPaidTerm.validUntil)}
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex items-center justify-center">
              <div className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-full text-xs sm:text-sm font-medium text-center">
                ✓ All Services Available
              </div>
            </div>

            {/* Expiry Warning */}
            {isNearExpiry && (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-orange-700">
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
        className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 p-4 sm:p-6 shadow-lg w-full ${className}`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-600/10"></div>
        <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-green-200/20 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-emerald-200/20 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header with Icon */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg flex-shrink-0">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-green-800 truncate">Active Term Period</h3>
                <p className="text-xs sm:text-sm text-green-600 truncate">Current academic term</p>
              </div>
            </div>
            <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
          </div>

          {/* Term Details */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm font-medium text-green-700">Current Term:</span>
              <span className="text-xs sm:text-sm font-bold text-green-800 truncate">{currentTerm}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm font-medium text-green-700">Period:</span>
              <span className="text-xs sm:text-sm font-bold text-green-800 truncate">{termPeriod}</span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm font-medium text-green-700">End Date:</span>
              <span className="text-xs sm:text-sm font-bold text-green-800 truncate">{termEndDate}</span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4 flex items-center justify-center">
            <div className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-full text-xs sm:text-sm font-medium text-center">
              ✓ Term Active
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Inactive account
  return (
    <motion.div
      variants={badgeVariants}
      animate="inactive"
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-orange-100 border-2 border-red-200 p-4 sm:p-6 shadow-lg w-full ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-400/10 to-orange-600/10"></div>
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-red-200/20 rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-orange-200/20 rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header with Icon */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500 rounded-lg flex-shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-red-800 truncate">Account Inactive</h3>
              <p className="text-xs sm:text-sm text-red-600 truncate">Payment required for transport services</p>
            </div>
          </div>
          <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
        </div>

        {/* Payment Required Info */}
        <div className="space-y-2 sm:space-y-3">
          {nextDueAmount && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm font-medium text-red-700">Next Due Amount:</span>
              <span className="text-xs sm:text-sm font-bold text-red-800 truncate">{formatCurrency(nextDueAmount)}</span>
            </div>
          )}
          
          {nextDueDate && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs sm:text-sm font-medium text-red-700">Due Date:</span>
              <span className="text-xs sm:text-sm font-bold text-red-800 truncate">{formatDate(nextDueDate)}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-center">
          <div className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-full text-xs sm:text-sm font-medium text-center">
            ⚠ Payment Required
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PaymentStatusBadge; 
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bus, 
  CreditCard, 
  Calendar, 
  AlertCircle, 
  RefreshCw,
  CheckCircle,
  PlusCircle
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import EnrollmentDashboard from '@/components/enrollment-dashboard';
import EnhancedPassengerDashboard from '@/components/enhanced-passenger-dashboard';
import PaymentStatusBadge from '@/components/payment-status-badge';
import { ServiceStatusBanner, AvailableServicesInfo } from '@/components/account-access-control';
import { StudentDashboardData } from '@/types';
import { Button, Card, Alert, Spinner } from '@/components/modern-ui-components';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [availableFees, setAvailableFees] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const currentStudent = sessionManager.getCurrentStudent();
      
      if (!currentStudent?.student_id) {
        throw new Error('No student session found');
      }

      // Fetch dashboard data and payment status in parallel
      const [data, paymentStatusData] = await Promise.all([
        studentHelpers.getDashboardData(currentStudent.student_id),
        studentHelpers.getPaymentStatus(currentStudent.student_id)
      ]);

      setDashboardData(data);
      setPaymentStatus(paymentStatusData);

      // Check if student has route allocation before fetching available fees
      const hasRouteFromData = data.transportStatus?.hasActiveRoute || 
                              (data.profile as any)?.allocated_route_id ||
                              (data.profile as any)?.transportProfile?.transportStatus === 'active';

      // Only fetch available fees for students with route allocation AND inactive payment
      if (hasRouteFromData && !paymentStatusData.isActive) {
        try {
          const feesData = await studentHelpers.getAvailableFees(currentStudent.student_id);
          setAvailableFees(feesData);
        } catch (error) {
          console.error('🔍 Available fees not configured for this route/boarding point:', error);
          // Don't show error to user - fee structure may not be set up yet
          // This is normal for newly enrolled students
          setAvailableFees(null);
        }
      }

    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success('Dashboard refreshed successfully');
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Loading state with modern design
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-modern py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <Spinner size="lg" color="green" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
              <p className="text-gray-600">Please wait while we fetch your transport data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with modern design
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-modern py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
                <p className="text-gray-600 mb-6">
                  {error || 'Something went wrong. Please try refreshing the page.'}
                </p>
              </div>
              <div className="flex space-x-4 justify-center">
                <Button
                  onClick={handleRefresh}
                  loading={refreshing}
                  icon={RefreshCw}
                >
                  Try Again
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { profile, transportStatus } = dashboardData;

  // Check if student has route allocation
  const hasRouteAllocation = transportStatus.hasActiveRoute || 
                           (profile as any)?.allocated_route_id ||
                           (profile as any)?.transportProfile?.transportStatus === 'active';

  // Get next due amount for inactive accounts
  const nextDueAmount = availableFees?.available_options?.find((option: any) => 
    option.is_available && option.is_recommended
  )?.amount;

  // Show enrollment dashboard if no route allocation
  if (!hasRouteAllocation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-modern py-8 space-y-8">
          {/* Payment Status Components REMOVED for first-time login users */}
          {/* Students without route allocation don't need to see payment restrictions */}

          {/* Modern Welcome Header for Transport Enrollment */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200" padding="lg">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="p-4 bg-green-600 rounded-2xl">
                  <Bus className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-heading-1 text-green-900">Welcome, {profile?.studentName}!</h1>
                  <p className="text-green-700 text-lg">Let's get you enrolled in transport services</p>
                </div>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleRefresh}
                  loading={refreshing}
                  icon={RefreshCw}
                  variant="secondary"
                >
                  Refresh Status
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Modern Transport Enrollment Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card padding="lg">
              <div className="text-center mb-8">
                <div className="p-6 bg-gradient-to-r from-green-500 to-green-600 rounded-3xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Bus className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-heading-2 mb-3">Transport Enrollment</h2>
                <p className="text-body text-lg">Get started with your transport services</p>
              </div>
              
              <EnrollmentDashboard 
                student={{
                  id: profile?.id || '',
                  student_name: profile?.studentName || '',
                  email: profile?.email || '',
                  transport_enrolled: profile?.transportProfile?.transportStatus === 'active',
                  enrollment_status: profile?.transportProfile?.enrollmentStatus || 'pending'
                }}
              />
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Log the route allocation status for debugging
  console.log('🔍 Dashboard Payment Logic:');
  console.log('  - hasRouteAllocation:', hasRouteAllocation);
  console.log('  - paymentStatus?.isActive:', paymentStatus?.isActive);
  console.log('  - Should show payment restrictions:', hasRouteAllocation);

  // Show enhanced main transport dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-modern py-8 space-y-8">
        {/* Payment Status Components - ONLY for students with route allocation */}
        {hasRouteAllocation && paymentStatus && (
          <>
            {/* Payment Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PaymentStatusBadge
                isActive={paymentStatus.isActive}
                lastPaidTerm={paymentStatus.lastPaidTerm}
                nextDueAmount={nextDueAmount}
              />
            </motion.div>

            {/* Service Status Banner for Inactive Accounts */}
            <ServiceStatusBanner 
              isActive={paymentStatus.isActive}
              nextDueAmount={nextDueAmount}
            />

            {/* Available Services Info for Inactive Accounts */}
            <AvailableServicesInfo isActive={paymentStatus.isActive} />
          </>
        )}

        {/* Enhanced Passenger Dashboard */}
        <EnhancedPassengerDashboard 
          data={dashboardData}
          loading={isLoading}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
} 
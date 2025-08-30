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
import { useAuth } from '@/lib/auth/auth-context';
import StudentRouteGuard from '@/components/student-route-guard';
import EnrollmentDashboard from '@/components/enrollment-dashboard';
import EnhancedPassengerDashboard from '@/components/enhanced-passenger-dashboard';
import PaymentStatusBadge from '@/components/payment-status-badge';
import { ServiceStatusBanner, AvailableServicesInfo } from '@/components/account-access-control';
import EnrollmentStatusBanner from '@/components/enrollment-status-banner';
import { useEnrollmentStatus } from '@/lib/enrollment/enrollment-context';
import { StudentDashboardData } from '@/types';
import { 
  Button, 
  Card, 
  Alert, 
  Spinner, 
  ErrorState, 
  LoadingOverlay,
  SwipeHandler 
} from '@/components/modern-ui-components';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  return (
    <StudentRouteGuard>
      <DashboardContent />
    </StudentRouteGuard>
  );
}

function DashboardContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const enrollmentStatus = useEnrollmentStatus();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [availableFees, setAvailableFees] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      if (!user || !isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // Create a mock student object from the authenticated user
      // Use enhanced user information from auth context (includes database integration)
      const currentStudent = {
        student_id: (user as any).studentId || user.id, // Use studentId if available from database integration
        email: user.email,
        full_name: user.full_name
      };

      console.log('📊 Dashboard received user object:', {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        studentId: (user as any).studentId,
        rollNumber: (user as any).rollNumber,
        isNewStudent: (user as any).isNewStudent,
        profileCompletionPercentage: (user as any).profileCompletionPercentage
      });
      
      console.log('📊 Dashboard fetching data for student:', {
        studentId: currentStudent.student_id,
        email: currentStudent.email,
        isNewStudent: (user as any).isNewStudent,
        rollNumber: (user as any).rollNumber
      });

      try {
        // If we have a studentId from database integration, use it directly
        if ((user as any).studentId) {
          console.log('✅ Using database student ID for data fetching:', (user as any).studentId);
          
          // Try to fetch dashboard data and payment status in parallel
          const [data, paymentStatusData] = await Promise.all([
            studentHelpers.getDashboardData((user as any).studentId),
            studentHelpers.getPaymentStatus((user as any).studentId)
          ]);

          setDashboardData(data);
          setPaymentStatus(paymentStatusData);
        } else {
          console.log('⚠️ No database student ID available, falling back to mock data');
          throw new Error('No database student ID available');
        }
      } catch (dbError) {
        console.log('Database fetch failed, creating mock data for new user:', dbError);
        
        // Create mock dashboard data for new users
        const mockDashboardData = {
          profile: {
            id: user.id,
            studentName: user.full_name,
            email: user.email,
            rollNumber: (user as any).rollNumber || `MOCK${user.id.substring(0, 8).toUpperCase()}`,
            mobile: '9876543210',
            department: { id: 'cs001', departmentName: 'Computer Science' },
            program: { id: 'btech001', programName: 'B.Tech', degreeName: 'Bachelor of Technology' },
            allocated_route_id: null,
            boarding_point: null,
            boarding_stop: null,
            transport_status: 'not_enrolled',
            transport_enrolled: false,
            transportProfile: undefined,
            firstLoginCompleted: true,
            profileCompletionPercentage: 80,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          transportStatus: {
            hasActiveRoute: false,
            routeInfo: undefined,
            pendingPayments: 0,
            totalFines: 0,
            lastTripDate: undefined
          },
          recentBookings: [],
          upcomingBookings: [],
          recentPayments: [],
          quickStats: {
            totalTrips: 0,
            totalSpent: 0,
            upcomingTrips: 0,
            activeGrievances: 0
          },
          notifications: [],
          grievances: []
        };

        const mockPaymentStatus = {
          status: 'active',
          hasOutstanding: false,
          outstandingAmount: 0,
          nextDueDate: null,
          recentPayments: []
        };

        setDashboardData(mockDashboardData);
        setPaymentStatus(mockPaymentStatus);
      }

      // Check if student has route allocation before fetching available fees
      const hasRouteFromData = dashboardData?.transportStatus?.hasActiveRoute || 
                              (dashboardData?.profile as any)?.allocated_route_id ||
                              (dashboardData?.profile as any)?.transportProfile?.transportStatus === 'active';

      // Only fetch available fees for students with route allocation AND inactive payment
      if (hasRouteFromData && paymentStatus && !paymentStatus.isActive) {
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
    if (!authLoading && isAuthenticated && user) {
      fetchDashboardData();
    } else if (!authLoading && !isAuthenticated) {
      setError('Please log in to access the dashboard');
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, user]);

  // Enhanced Loading state with overlay
  if (authLoading || isLoading) {
    return (
      <>
        <LoadingOverlay 
          isVisible={true} 
          message="Loading your transport dashboard..."
        />
        <div className="min-h-screen bg-gray-50">
          <div className="container-modern py-8">
            <div className="space-y-6">
              {/* Skeleton loading for dashboard cards */}
              {[...Array(3)].map((_, index) => (
                <Card key={index} className="modern-card" padding="lg">
                  <div className="skeleton h-6 w-32 mb-4" />
                  <div className="skeleton h-4 w-full mb-2" />
                  <div className="skeleton h-4 w-3/4" />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // Enhanced Error state with recovery actions
  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-modern py-8">
          <ErrorState
            title="Failed to Load Dashboard"
            message={error || 'Something went wrong. Please try refreshing the page.'}
            action={{
              label: refreshing ? 'Retrying...' : 'Try Again',
              onClick: handleRefresh
            }}
          />
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

  console.log('🔍 Dashboard Route Allocation Check:', {
    hasRouteAllocation,
    hasActiveRoute: transportStatus.hasActiveRoute,
    allocatedRouteId: (profile as any)?.allocated_route_id,
    transportStatus: (profile as any)?.transportProfile?.transportStatus,
    profileTransportEnrolled: profile?.transport_enrolled,
    profileTransportStatus: (profile as any)?.transport_status
  });

  // Use enrollment status from context to determine dashboard type
  // Show enrollment dashboard only if student is not enrolled (from enrollment context)
  // This ensures we show the main dashboard once enrollment verification is successful
  const isEnrolledFromContext = enrollmentStatus?.isEnrolled || false;
  const shouldShowEnrollmentDashboard = !hasRouteAllocation && !isEnrolledFromContext && !profile?.transport_enrolled;
  
  console.log('🔍 Dashboard Display Logic:', {
    shouldShowEnrollmentDashboard,
    hasRouteAllocation,
    isEnrolledFromContext,
    profileTransportEnrolled: profile?.transport_enrolled,
    enrollmentStatusFromContext: enrollmentStatus?.enrollmentStatus
  });
  
  if (shouldShowEnrollmentDashboard) {
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

          {/* Enrollment Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <EnrollmentStatusBanner />
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

  // Show enhanced main transport dashboard with swipe support
  return (
    <SwipeHandler
      onSwipeDown={handleRefresh}
      className="min-h-screen bg-gray-50"
    >
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
    </SwipeHandler>
  );
} 
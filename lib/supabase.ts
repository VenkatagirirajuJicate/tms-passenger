import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { Student, StudentDashboardData, Booking, Payment, Grievance, Route, Schedule, Notification, RouteStop, SpendingAnalyticsData, TripAnalyticsData, PaymentHistoryEntry, ChartDataPoint } from '@/types';
import { sessionManager } from './session';

// Note: Type definitions would be generated from your Supabase schema
type Database = Record<string, unknown>;

// Lazy client creation to avoid environment variable loading issues
let _supabase: ReturnType<typeof createSupabaseClient<Database>> | null = null;

function getSupabaseClient() {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      // During build time or when env vars are missing, provide a more helpful error
      const missingVars = [];
      if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      
      throw new Error(`Missing Supabase environment variables: ${missingVars.join(', ')}. Please add them to your .env.local file.`);
    }

    _supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  
  return _supabase;
}

// Export the lazy client
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient<Database>>, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof ReturnType<typeof createSupabaseClient<Database>>];
  }
});

// Also export a createClient function for compatibility with API routes
export function createClient() {
  return getSupabaseClient();
}

// Data transformation helpers
const transformStudent = (dbStudent: Record<string, unknown>): Student => ({
  id: dbStudent.id as string,
  studentName: dbStudent.student_name as string,
  rollNumber: dbStudent.roll_number as string,
  email: dbStudent.email as string,
  mobile: dbStudent.mobile as string,
  passwordHash: dbStudent.password_hash as string,
  dateOfBirth: dbStudent.date_of_birth as string,
  gender: dbStudent.gender as string,
  fatherName: dbStudent.father_name as string,
  motherName: dbStudent.mother_name as string,
  address: dbStudent.address as string,
  addressStreet: dbStudent.address_street as string,
  addressDistrict: dbStudent.address_district as string,
  addressState: dbStudent.address_state as string,
  addressPinCode: dbStudent.address_pin_code as string,
  emergencyContactName: dbStudent.emergency_contact_name as string,
  emergencyContactPhone: dbStudent.emergency_contact_phone as string,
  academicYear: dbStudent.academic_year as string,
  semester: dbStudent.semester as string,
  firstLoginCompleted: dbStudent.first_login_completed as boolean,
  profileCompletionPercentage: dbStudent.profile_completion_percentage as number,
  lastLogin: dbStudent.last_login as string,
  department: dbStudent.department as Record<string, unknown>,
  program: dbStudent.program as Record<string, unknown>,
  institution: dbStudent.institution as Record<string, unknown>,
  transportProfile: dbStudent.transport_profile as Record<string, unknown>,
  createdAt: new Date(dbStudent.created_at as string),
  updatedAt: new Date(dbStudent.updated_at as string)
});

const transformRoute = (dbRoute: Record<string, unknown>): Route => ({
  id: dbRoute.id as string,
  routeNumber: dbRoute.route_number as string,
  routeName: dbRoute.route_name as string,
  startLocation: dbRoute.start_location as string,
  endLocation: dbRoute.end_location as string,
  startLatitude: dbRoute.start_latitude as number,
  startLongitude: dbRoute.start_longitude as number,
  endLatitude: dbRoute.end_latitude as number,
  endLongitude: dbRoute.end_longitude as number,
  departureTime: dbRoute.departure_time as string,
  arrivalTime: dbRoute.arrival_time as string,
  distance: dbRoute.distance as number,
  duration: dbRoute.duration as string,
  totalCapacity: dbRoute.total_capacity as number,
  currentPassengers: dbRoute.current_passengers as number,
  status: dbRoute.status as string,
  driverId: dbRoute.driver_id as string,
  vehicleId: dbRoute.vehicle_id as string,
  stops: ((dbRoute.stops as Record<string, unknown>[]) || []).map((stop: Record<string, unknown>) => ({
    id: stop.id as string,
    routeId: stop.route_id as string,
    stopName: stop.stop_name as string,
    stopTime: stop.stop_time as string,
    sequenceOrder: stop.sequence_order as number,
    latitude: stop.latitude as number,
    longitude: stop.longitude as number,
    isMajorStop: stop.is_major_stop as boolean,
    createdAt: new Date(stop.created_at as string)
  })),
  fare: dbRoute.fare as number,
  createdAt: new Date(dbRoute.created_at as string),
  updatedAt: new Date(dbRoute.updated_at as string)
});

const transformBooking = (dbBooking: Record<string, unknown>): Booking => ({
  id: dbBooking.id as string,
  studentId: dbBooking.student_id as string,
  routeId: dbBooking.route_id as string,
  scheduleId: dbBooking.schedule_id as string,
  bookingDate: dbBooking.booking_date as string,
  tripDate: dbBooking.trip_date as string,
  boardingStop: dbBooking.boarding_stop as string,
  seatNumber: dbBooking.seat_number as string,
      status: dbBooking.status as string,
    paymentStatus: dbBooking.payment_status as string,
    amount: dbBooking.amount as number,
    qrCode: dbBooking.qr_code as string,
  specialRequirements: dbBooking.special_requirements as string,
  route: dbBooking.route ? transformRoute(dbBooking.route as Record<string, unknown>) : undefined,
  schedule: dbBooking.schedule ? {
    id: dbBooking.schedule.id as string,
    routeId: dbBooking.schedule.route_id as string,
    scheduleDate: dbBooking.schedule.schedule_date as string,
    departureTime: dbBooking.schedule.departure_time as string,
    arrivalTime: dbBooking.schedule.arrival_time as string,
    availableSeats: dbBooking.schedule.available_seats as number,
    bookedSeats: dbBooking.schedule.booked_seats as number,
    status: dbBooking.schedule.status as string,
    driverId: dbBooking.schedule.driver_id as string,
    vehicleId: dbBooking.schedule.vehicle_id as string,
    createdAt: new Date(dbBooking.schedule.created_at as string)
  } : undefined,
  createdAt: new Date(dbBooking.created_at as string),
  updatedAt: new Date(dbBooking.updated_at as string)
});

const transformPayment = (dbPayment: Record<string, unknown>): Payment => ({
  id: dbPayment.id as string,
  studentId: dbPayment.student_id as string,
  bookingId: dbPayment.booking_id as string,
  amount: dbPayment.amount as number,
  paymentType: dbPayment.payment_type as string,
  paymentMethod: dbPayment.payment_method as string,
  status: dbPayment.status as string,
  transactionId: dbPayment.transaction_id as string,
  description: dbPayment.description as string,
  receiptNumber: dbPayment.receipt_number as string,
  createdAt: new Date(dbPayment.created_at as string),
  updatedAt: new Date(dbPayment.updated_at as string)
});

const transformGrievance = (dbGrievance: Record<string, unknown>): Grievance => ({
  id: dbGrievance.id as string,
  studentId: dbGrievance.student_id as string,
  routeId: dbGrievance.route_id as string,
  driverName: dbGrievance.driver_name as string,
  category: dbGrievance.category as string,
  priority: dbGrievance.priority as string,
  subject: dbGrievance.subject as string,
  description: dbGrievance.description as string,
  status: dbGrievance.status as string,
  assignedTo: dbGrievance.assigned_to as string,
  resolution: dbGrievance.resolution as string,
  attachments: dbGrievance.attachments as string[],
  createdAt: new Date(dbGrievance.created_at as string),
  updatedAt: new Date(dbGrievance.updated_at as string),
  resolvedAt: dbGrievance.resolved_at as string
});

// Mock payment history generator
function generateMockPaymentHistory(): PaymentHistoryEntry[] {
  const mockPayments: PaymentHistoryEntry[] = [];
  const paymentTypes = ['Transport Fee', 'Trip Fare', 'Semester Fee', 'Registration Fee'];
  const methods = ['UPI', 'Card', 'Net Banking', 'Cash'];
  const statuses: ('success' | 'pending' | 'failed')[] = ['success', 'success', 'success', 'pending'];
  
  for (let i = 0; i < 8; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (i * 7)); // Weekly payments
    
    mockPayments.push({
      id: `mock-${i}`,
      date: date.toISOString(),
      amount: Math.floor(Math.random() * 3000) + 500,
      description: paymentTypes[Math.floor(Math.random() * paymentTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      method: methods[Math.floor(Math.random() * methods.length)]
    });
  }
  
  return mockPayments;
}

// Analytics data generation function
async function generateAnalyticsData(
  studentId: string, 
  recentPayments: any[], 
  upcomingBookings: any[]
): Promise<{
  spendingAnalytics: SpendingAnalyticsData;
  tripAnalytics: TripAnalyticsData;
  paymentHistory: PaymentHistoryEntry[];
}> {
  try {
    // Generate spending analytics
    const currentDate = new Date();
    const monthlySpending: { [key: string]: number } = {};
    const categorySpending: { [key: string]: number } = {};
    
    // Process payments for analytics
    let totalSpent = 0;
    const paymentHistory: PaymentHistoryEntry[] = [];
    
    recentPayments.forEach((payment: any) => {
      if (payment.status === 'completed') {
        totalSpent += payment.amount || 0;
        
        // Monthly spending
        const paymentDate = new Date(payment.created_at);
        const monthKey = paymentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + payment.amount;
        
        // Category spending
        const category = payment.payment_type || 'Other';
        categorySpending[category] = (categorySpending[category] || 0) + payment.amount;
        
        // Payment history
        paymentHistory.push({
          id: payment.id,
          date: payment.created_at,
          amount: payment.amount,
          description: payment.description || `${payment.payment_type} Payment`,
          status: payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'pending' : 'failed',
          method: payment.payment_method || 'Unknown'
        });
      }
    });
    
    // Generate last 6 months of data
    const monthlyData: ChartDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const realValue = monthlySpending[monthKey] || 0;
      // Add some mock data if no real payments exist for better demo
      const mockValue = realValue === 0 ? Math.floor(Math.random() * 3000) + 1000 : 0;
      monthlyData.push({
        label: monthKey,
        value: realValue + mockValue,
        color: '#16a34a'
      });
    }
    
    // Category data
    let categoryData: ChartDataPoint[] = Object.entries(categorySpending).map(([category, amount], index) => ({
      label: category.replace('_', ' ').toUpperCase(),
      value: amount,
      color: `hsl(${index * 137.508}deg, 70%, 50%)`
    }));
    
    // Add mock category data if no real categories exist
    if (categoryData.length === 0) {
      const mockCategories = [
        { label: 'TRANSPORT FEES', value: Math.floor(Math.random() * 5000) + 2000 },
        { label: 'TRIP FARE', value: Math.floor(Math.random() * 2000) + 500 },
        { label: 'SEMESTER FEE', value: Math.floor(Math.random() * 3000) + 1500 }
      ];
      categoryData = mockCategories.map((cat, index) => ({
        ...cat,
        color: `hsl(${index * 137.508}deg, 70%, 50%)`
      }));
    }
    
    // Trend data (simplified)
    const trendData: ChartDataPoint[] = monthlyData.slice(-3).map((item, index) => ({
      label: `Week ${index + 1}`,
      value: item.value / 4, // Approximate weekly spending
      color: '#16a34a'
    }));
    
    const averageMonthly = monthlyData.reduce((sum, item) => sum + item.value, 0) / monthlyData.length;
    
    // Generate trip analytics
    const routeUsage: { [key: string]: number } = {};
    let totalTrips = 0;
    
    // Process bookings for trip analytics
    upcomingBookings.forEach((booking: any) => {
      if (booking.status === 'confirmed' || booking.status === 'completed') {
        totalTrips++;
        const routeName = booking.route?.route_name || 'Unknown Route';
        routeUsage[routeName] = (routeUsage[routeName] || 0) + 1;
      }
    });
    
    // Try to get historical bookings for better analytics
    try {
      const { data: historicalBookings } = await supabase
        .from('bookings')
        .select(`
          *,
          route:routes(route_name)
        `)
        .eq('student_id', studentId)
        .gte('created_at', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 6 months
        .order('created_at', { ascending: false });
      
      if (historicalBookings) {
        historicalBookings.forEach((booking: any) => {
          if (booking.status === 'confirmed' || booking.status === 'completed') {
            totalTrips++;
            const routeName = booking.route?.route_name || 'Unknown Route';
            routeUsage[routeName] = (routeUsage[routeName] || 0) + 1;
          }
        });
      }
    } catch (error) {
      console.warn('Could not fetch historical bookings for analytics:', error);
    }
    
    // Monthly trips data - generate realistic mock data if no real data available
    const monthlyTrips: ChartDataPoint[] = monthlyData.map((item, index) => {
      // If we have real trip data, use it; otherwise generate mock data
      const baseTrips = totalTrips > 0 ? Math.floor(totalTrips / 6) : 0;
      const mockTrips = Math.floor(Math.random() * 8) + 2; // 2-10 trips per month
      return {
        label: item.label,
        value: baseTrips > 0 ? baseTrips + Math.floor(Math.random() * 3) : mockTrips,
        color: '#3b82f6'
      };
    });
    
    // Route usage data
    let routeUsageData: ChartDataPoint[] = Object.entries(routeUsage).map(([route, count], index) => ({
      label: route,
      value: count,
      color: `hsl(${index * 137.508}deg, 70%, 50%)`
    }));
    
    // Add mock route data if no real routes exist
    if (routeUsageData.length === 0) {
      const mockRoutes = [
        { label: 'Route A1', value: Math.floor(Math.random() * 15) + 5 },
        { label: 'Route B2', value: Math.floor(Math.random() * 10) + 3 },
        { label: 'Route C3', value: Math.floor(Math.random() * 8) + 2 }
      ];
      routeUsageData = mockRoutes.map((route, index) => ({
        ...route,
        color: `hsl(${index * 137.508}deg, 70%, 50%)`
      }));
      totalTrips = routeUsageData.reduce((sum, route) => sum + route.value, 0);
    }
    
    const mostUsedRoute = routeUsageData.length > 0 
      ? routeUsageData.reduce((max, current) => current.value > max.value ? current : max).label
      : 'None';
    
    const averageTripsPerMonth = totalTrips / 6; // Last 6 months
    
    // Trip trend data
    const tripTrendData: ChartDataPoint[] = monthlyTrips.slice(-3).map((item, index) => ({
      label: `Week ${index + 1}`,
      value: Math.floor(item.value / 4),
      color: '#3b82f6'
    }));
    
    return {
      spendingAnalytics: {
        monthlyData,
        categoryData,
        totalSpent,
        averageMonthly,
        trendData
      },
      tripAnalytics: {
        monthlyTrips,
        routeUsage: routeUsageData,
        totalTrips,
        averageTripsPerMonth,
        mostUsedRoute,
        trendData: tripTrendData
      },
      paymentHistory: paymentHistory.length > 0 ? paymentHistory.slice(0, 10) : generateMockPaymentHistory() // Last 10 payments
    };
  } catch (error) {
    console.error('Error generating analytics data:', error);
    
    // Return empty analytics data on error
    return {
      spendingAnalytics: {
        monthlyData: [],
        categoryData: [],
        totalSpent: 0,
        averageMonthly: 0,
        trendData: []
      },
      tripAnalytics: {
        monthlyTrips: [],
        routeUsage: [],
        totalTrips: 0,
        averageTripsPerMonth: 0,
        mostUsedRoute: 'None',
        trendData: []
      },
      paymentHistory: []
    };
  }
}

// Helper functions for student operations
export const studentHelpers = {
  // First time login with DOB (using API route)
  async firstTimeLogin(email: string, dateOfBirth: string, newPassword: string) {
    try {
      // Call API route for first-time login
      const response = await fetch('/api/auth/first-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          dateOfBirth,
          newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'First time login failed');
      }

      return { student: data.student };
    } catch (error: any) {
      throw new Error(error.message || 'First time login failed');
    }
  },

  // Regular login using API route
  async signIn(email: string, password: string) {
    try {
      // Call API route for login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return { user: data.user, session: data.session, student: data.student };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Get student dashboard data
  async getDashboardData(studentId: string): Promise<StudentDashboardData> {
    console.log('🔥🔥🔥 UPDATED getDashboardData FUNCTION CALLED for studentId:', studentId);
    try {
      // Get basic student profile with transport profile
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select(`
          *,
          transportProfile:student_transport_profiles(*),
          department:departments(*),
          program:programs(*)
        `)
        .eq('id', studentId)
        .single();

      // Debug: Log basic profile info
      console.log('🚨🚨🚨 NEW LOGIC RUNNING - Checking enrollment for student:', profile?.student_name);
      console.log('🚨🚨🚨 NEW LOGIC - allocated_route_id from profile:', profile?.allocated_route_id);
      console.log('🔍 Profile data:', {
        allocated_route_id: profile?.allocated_route_id,
        transport_status: profile?.transport_status,
        transport_enrolled: profile?.transport_enrolled,
        transportProfile: profile?.transportProfile ? {
          allocated_route_id: profile.transportProfile.allocated_route_id,
          transport_status: profile.transportProfile.transport_status
        } : null
      });

      if (profileError || !profile) {
        throw new Error('Student profile not found');
      }

      // Try to get additional data, but don't fail if tables don't exist
      let upcomingBookings: any[] = [];
      let recentPayments: any[] = [];
      let notifications: any[] = [];
      let activeGrievances = 0;

      // Try to get bookings
      try {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select(`
            *,
            route:routes(*)
          `)
          .eq('student_id', studentId)
          .gte('trip_date', new Date().toISOString().split('T')[0])
          .order('trip_date', { ascending: true })
          .limit(5);
        upcomingBookings = bookingsData || [];
      } catch (error) {
        console.warn('Bookings table not accessible:', error);
      }

      // Try to get payments
      try {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
          .limit(10);
        recentPayments = paymentsData || [];
      } catch (error) {
        console.warn('Payments table not accessible:', error);
      }

      // Try to get notifications
      try {
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select('*')
          .or(`target_audience.eq.all,target_audience.eq.students`)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5);
        notifications = notificationsData || [];
      } catch (error) {
        console.warn('Notifications table not accessible:', error);
      }

      // Try to get grievances count
      try {
        const { count } = await supabase
          .from('grievances')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .in('status', ['open', 'in_progress']);
        activeGrievances = count || 0;
      } catch (error) {
        console.warn('Grievances table not accessible:', error);
      }

      // Calculate quick stats
      const totalTrips = 0; // Will be calculated when attendance data is available
      const totalSpent = recentPayments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);
      const upcomingTrips = upcomingBookings.filter(b => b.status === 'confirmed').length;

      // Check transport status properly
      const transportStatus = {
        hasActiveRoute: false,
        routeInfo: null,
        pendingPayments: 0,
        totalFines: 0,
        lastTripDate: undefined
      };

      // SIMPLIFIED LOGIC: Only show enrollment if student has NO route allocated
      // Check all possible sources for route allocation
      const transportProfile = profile.transportProfile || profile.transport_profile;
      
      // Check for route allocation in any of the sources
      const routeFromProfile = profile.allocated_route_id;
      const routeFromTransportProfile = transportProfile?.allocated_route_id;
      
      // Check for active route allocation using API endpoint to bypass RLS issues
      let routeFromAllocations = null;
      try {
        const response = await fetch(`/api/student/route-allocation?studentId=${profile.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.routeAllocation) {
            routeFromAllocations = result.data.routeAllocation.route_id;
            console.log('✅ Found route from allocations API:', routeFromAllocations);
          }
        } else {
          console.warn('Route allocation API returned error:', response.status);
        }
      } catch (error) {
        console.warn('Error calling route allocation API:', error);
        // Fallback: try direct query (will likely fail due to RLS but worth trying)
        try {
          const { data: activeAllocation, error: allocationError } = await supabase
            .from('student_route_allocations')
            .select('route_id, routes(*)')
            .eq('student_id', profile.id)
            .eq('is_active', true)
            .single();
            
          if (!allocationError && activeAllocation) {
            routeFromAllocations = activeAllocation.route_id;
            console.log('✅ Found route from direct query fallback:', routeFromAllocations);
          }
        } catch (fallbackError) {
          console.warn('Direct query fallback also failed:', fallbackError);
        }
      }
      
      // Determine the route ID to use
      const allocatedRouteId = routeFromProfile || routeFromTransportProfile || routeFromAllocations;
      
      console.log('🔍 Route allocation check:');
      console.log('   - routeFromProfile:', routeFromProfile);
      console.log('   - routeFromTransportProfile:', routeFromTransportProfile);
      console.log('   - routeFromAllocations:', routeFromAllocations);
      console.log('   - allocatedRouteId:', allocatedRouteId);
      
      // If student has any route allocation, show route info instead of enrollment
      if (allocatedRouteId) {
        console.log('✅ Student has route allocation - HIDING ENROLLMENT');
        
        // IMPORTANT: Set hasActiveRoute to true immediately when route allocation is found
        transportStatus.hasActiveRoute = true;
        
        try {
          const { data: routeData, error: routeError } = await supabase
            .from('routes')
            .select('*')
            .eq('id', allocatedRouteId)
            .single();

          if (!routeError && routeData) {
            transportStatus.routeInfo = {
              id: routeData.id as string,
              route_number: routeData.route_number as string,
              route_name: routeData.route_name as string,
              start_location: routeData.start_location as string,
              end_location: routeData.end_location as string,
              departure_time: routeData.departure_time as string,
              arrival_time: routeData.arrival_time as string,
              fare: routeData.fare as number,
              status: routeData.status as string,
              boarding_point: profile.boarding_point as string
            };
            
            console.log('✅ Route details loaded:', routeData.route_number, '-', routeData.route_name);
          } else {
            console.warn('❌ Route not found, but will still hide enrollment since allocation exists');
            // Still keep hasActiveRoute = true to hide enrollment
            transportStatus.routeInfo = {
              id: allocatedRouteId,
              route_number: 'Unknown Route',
              route_name: 'Route details unavailable',
              start_location: 'Unknown',
              end_location: 'Unknown', 
              departure_time: 'Unknown',
              arrival_time: 'Unknown',
              fare: 0,
              status: 'unknown',
              boarding_point: profile.boarding_point as string
            };
          }
        } catch (error) {
          console.warn('❌ Error fetching route details, but will still hide enrollment:', error);
          // Still keep hasActiveRoute = true to hide enrollment
        }
      } else {
        console.log('📋 No route allocation found - SHOWING ENROLLMENT');
        transportStatus.hasActiveRoute = false;
      }
      
      // Debug: Log final transport status
      console.log('🔍 Final transportStatus.hasActiveRoute:', transportStatus.hasActiveRoute);
      console.log('🔍 Final transportStatus.routeInfo:', transportStatus.routeInfo);

      // Transform profile to match expected interface
      // @ts-ignore - Temporary bypass for type issues
      const transformedProfile = {
        id: profile.id as string,
        studentName: profile.student_name as string,
        rollNumber: profile.roll_number as string,
        email: profile.email as string,
        mobile: profile.mobile as string,
        // @ts-ignore
        academicYear: profile.academic_year ? parseInt(profile.academic_year as string) : undefined,
        // @ts-ignore
        semester: profile.semester ? parseInt(profile.semester as string) : undefined,
        firstLoginCompleted: profile.first_login_completed as boolean || false,
        profileCompletionPercentage: profile.profile_completion_percentage as number || 0,
        // @ts-ignore
        lastLogin: profile.last_login ? new Date(profile.last_login as string) : undefined,
        // @ts-ignore
        department: profile.department ? {
          id: profile.department.id as string,
          departmentName: profile.department.department_name as string
        } : undefined,
        // @ts-ignore
        program: profile.program ? {
          id: profile.program.id as string,
          programName: profile.program.program_name as string,
          degreeName: profile.program.degree_name as string
        } : undefined,
        // @ts-ignore
        institution: profile.institution ? {
          id: profile.institution.id as string,
          name: profile.institution.name as string
        } : undefined,
        // @ts-ignore
        transportProfile: profile.transportProfile ? {
          id: profile.transportProfile.id as string,
          studentId: profile.transportProfile.student_id as string,
          allocatedRouteId: profile.transportProfile.allocated_route_id as string,
          boardingPoint: profile.transportProfile.boarding_point as string,
          transportStatus: profile.transportProfile.transport_status as 'active' | 'inactive' | 'suspended',
          paymentStatus: profile.transportProfile.payment_status as 'current' | 'overdue' | 'suspended',
          totalFines: profile.transportProfile.total_fines as number || 0,
          outstandingAmount: profile.transportProfile.outstanding_amount as number || 0,
          semesterFeePaid: profile.transportProfile.semester_fee_paid as boolean || false,
          registrationFeePaid: profile.transportProfile.registration_fee_paid as boolean || false,
          createdAt: new Date(profile.transportProfile.created_at as string),
          updatedAt: new Date(profile.transportProfile.updated_at as string)
        } : undefined,
        // @ts-ignore
        createdAt: new Date(profile.created_at as string),
        // @ts-ignore
        updatedAt: new Date(profile.updated_at as string)
      };

      // Generate analytics data
      const analytics = await generateAnalyticsData(studentId, recentPayments, upcomingBookings);

      return {
        profile: transformedProfile as any,
        upcomingBookings: upcomingBookings as any,
        recentPayments: recentPayments as any,
        notifications: notifications as any,
        transportStatus,
        quickStats: {
          totalTrips,
          totalSpent,
          upcomingTrips,
          activeGrievances
        },
        analytics
      };
    } catch (error: any) {
      console.error('Dashboard data error:', error);
      throw new Error('Failed to fetch dashboard data: ' + error.message);
    }
  },

  // Get available routes for booking
  async getAvailableRoutes(): Promise<Route[]> {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        stops:route_stops(*)
      `)
      .eq('status', 'active')
      .order('route_number');

    if (error) throw error;
    return (data || []).map(transformRoute) || [];
  },

  // Get student's allocated route with boarding stop
  async getStudentAllocatedRoute(studentId: string): Promise<{
    route: Route | null;
    boardingStop: RouteStop | null;
    allocation: any;
  }> {
    try {
      
      // Try to get student route allocation using API endpoint to bypass RLS issues
      let allocation = null;
      let allocationError = null;
      
      try {
        const response = await fetch(`/api/student/route-allocation?studentId=${studentId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.routeAllocation) {
            allocation = result.data.routeAllocation;
            console.log('✅ Found allocation from API:', allocation);
          }
        } else {
          console.warn('Route allocation API returned error:', response.status);
        }
      } catch (error) {
        console.warn('Error calling route allocation API:', error);
        allocationError = error;
      }
      
      // Fallback: try direct query if API failed
      if (!allocation) {
        const { data: directAllocation, error: directError } = await supabase
          .from('student_route_allocations')
          .select(`
            *,
            route:routes(*),
            boarding_stop:route_stops(*)
          `)
          .eq('student_id', studentId)
          .eq('is_active', true)
          .single();

        if (directError && directError.code !== 'PGRST116') {
          console.error('Error fetching student allocation:', directError);
          
          // Fall back to old method if new table doesn't exist
          return this.getStudentAllocatedRouteLegacy(studentId);
        } else if (!directError && directAllocation) {
          allocation = directAllocation;
        }
      }

      if (!allocation) {
        return {
          route: null,
          boardingStop: null,
          allocation: {
            id: null,
            allocatedAt: null,
            isActive: false
          }
        };
      }

      // Get route stops for the allocated route
      const { data: routeStops, error: stopsError } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', allocation.route_id)
        .order('sequence_order');

      if (stopsError) {
        console.error('Error fetching route stops:', stopsError);
      }

      // Transform route data to match our interface with proper field mapping
      const transformedRoute: Route = {
        id: allocation.route.id as string,
        routeNumber: allocation.route.route_number as string,
        routeName: allocation.route.route_name as string,
        startLocation: allocation.route.start_location as string,
        endLocation: allocation.route.end_location as string,
        startLatitude: allocation.route.start_latitude as number,
        startLongitude: allocation.route.start_longitude as number,
        endLatitude: allocation.route.end_latitude as number,
        endLongitude: allocation.route.end_longitude as number,
        distance: allocation.route.distance as number,
        duration: allocation.route.duration as string,
        departureTime: allocation.route.departure_time as string,
        arrivalTime: allocation.route.arrival_time as string,
        fare: allocation.route.fare as number,
        totalCapacity: allocation.route.total_capacity as number,
        currentPassengers: allocation.route.current_passengers as number || 0,
        status: allocation.route.status as string,
        driverId: allocation.route.driver_id as string,
        vehicleId: allocation.route.vehicle_id as string,
        createdAt: new Date(allocation.route.created_at as string),
        updatedAt: new Date(allocation.route.updated_at as string),
        stops: routeStops?.map(stop => ({
          id: stop.id as string,
          routeId: stop.route_id as string,
          stopName: stop.stop_name as string,
          stopTime: stop.stop_time as string,
          sequenceOrder: stop.sequence_order as number || 0,
          latitude: stop.latitude as number,
          longitude: stop.longitude as number,
          isMajorStop: stop.is_major_stop as boolean || false,
          createdAt: new Date(stop.created_at as string)
        })) || []
      };

      // Find the boarding stop
      let boardingStop: RouteStop | null = null;
      if (allocation.boarding_stop_id && routeStops) {
        const foundStop = routeStops.find(stop => stop.id === allocation.boarding_stop_id);
        if (foundStop) {
          boardingStop = {
            id: foundStop.id as string,
            routeId: foundStop.route_id as string,
            stopName: foundStop.stop_name as string,
            stopTime: foundStop.stop_time as string,
            sequenceOrder: foundStop.sequence_order as number || 0,
            latitude: foundStop.latitude as number,
            longitude: foundStop.longitude as number,
            isMajorStop: foundStop.is_major_stop as boolean || false,
            createdAt: new Date(foundStop.created_at as string)
          };
        }
      }

      return {
        route: transformedRoute,
        boardingStop,
        allocation: {
          id: allocation.id as string,
          allocatedAt: new Date(allocation.allocated_at as string),
          isActive: allocation.is_active as boolean
        }
      };

    } catch (error: any) {
      console.error('Error in getStudentAllocatedRoute:', error);
      throw new Error('Failed to fetch student route allocation: ' + error.message);
    }
  },

  // Legacy method for backward compatibility
  async getStudentAllocatedRouteLegacy(studentId: string): Promise<{
    route: Route | null;
    boardingStop: RouteStop | null;
    allocation: any;
  }> {
    try {
      // Get student data with transport profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          transport_profile:student_transport_profiles(*)
        `)
        .eq('id', studentId)
        .single();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        return {
          route: null,
          boardingStop: null,
          allocation: null
        };
      }

      if (!student || !student.transport_profile) {
        return {
          route: null,
          boardingStop: null,
          allocation: {
            id: null,
            allocatedAt: null,
            isActive: false
          }
        };
      }

      // For legacy support, check if student has boarding point
      if (!student.transport_profile.boarding_point) {
        return {
          route: null,
          boardingStop: null,
          allocation: {
            id: null,
            allocatedAt: null,
            isActive: false
          }
        };
      }

      // Try to find a route that serves this boarding point
      const { data: routeStops, error: stopsError } = await supabase
        .from('route_stops')
        .select(`
          *,
          route:routes(*)
        `)
        .eq('stop_name', student.transport_profile.boarding_point)
        .limit(1);

      if (stopsError || !routeStops || routeStops.length === 0) {
        console.error('Error fetching route stops or no stops found:', stopsError);
        return {
          route: null,
          boardingStop: null,
          allocation: {
            id: null,
            allocatedAt: null,
            isActive: false
          }
        };
      }

      const routeStop = routeStops[0];
      
      // Get all stops for this route
      const { data: allRouteStops, error: allStopsError } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', routeStop.route_id)
        .order('sequence_order');

      if (allStopsError) {
        console.error('Error fetching all route stops:', allStopsError);
      }

      // Transform route data with proper field mapping
      const transformedRoute: Route = {
        id: routeStop.route.id as string,
        routeNumber: routeStop.route.route_number as string,
        routeName: routeStop.route.route_name as string,
        startLocation: routeStop.route.start_location as string,
        endLocation: routeStop.route.end_location as string,
        distance: routeStop.route.distance as number,
        duration: routeStop.route.duration as string,
        departureTime: routeStop.route.departure_time as string,
        arrivalTime: routeStop.route.arrival_time as string,
        fare: routeStop.route.fare as number,
        totalCapacity: routeStop.route.total_capacity as number,
        currentPassengers: routeStop.route.current_passengers as number || 0,
        status: routeStop.route.status as string,
        createdAt: new Date(routeStop.route.created_at as string),
        updatedAt: new Date(routeStop.route.updated_at as string),
        stops: allRouteStops?.map(stop => ({
          id: stop.id as string,
          routeId: stop.route_id as string,
          stopName: stop.stop_name as string,
          stopTime: stop.stop_time as string,
          sequenceOrder: stop.sequence_order as number || 0,
          latitude: stop.latitude as number,
          longitude: stop.longitude as number,
          isMajorStop: stop.is_major_stop as boolean || false,
          createdAt: new Date(stop.created_at as string)
        })) || []
      };

      // Transform boarding stop
      const boardingStop: RouteStop = {
        id: routeStop.id as string,
        routeId: routeStop.route_id as string,
        stopName: routeStop.stop_name as string,
        stopTime: routeStop.stop_time as string,
        sequenceOrder: routeStop.sequence_order as number || 0,
        latitude: routeStop.latitude as number,
        longitude: routeStop.longitude as number,
        isMajorStop: routeStop.is_major_stop as boolean || false,
        createdAt: new Date(routeStop.created_at as string)
      };

      return {
        route: transformedRoute,
        boardingStop,
        allocation: {
          id: student.transport_profile.id as string,
          allocatedAt: new Date(student.transport_profile.created_at as string),
          isActive: student.transport_profile.transport_status === 'active'
        }
      };

    } catch (error: any) {
      console.error('Error in getStudentAllocatedRouteLegacy:', error);
      throw new Error('Failed to fetch student route allocation: ' + error.message);
    }
  },

  // Updated method that tries both new and legacy approach
  async getStudentRouteAllocation(studentId: string): Promise<{
    route: Route | null;
    boardingStop: RouteStop | null;
    allocation: any;
  }> {
    try {
      // First try the new method
      const result = await this.getStudentAllocatedRoute(studentId);
      
      // If we get a result, return it
      if (result.route) {
        return result;
      }
      
      // Otherwise try the legacy method
      return await this.getStudentAllocatedRouteLegacy(studentId);
      
    } catch (error: any) {
      console.error('Error in getStudentRouteAllocation:', error);
      
      // Try legacy method as fallback
      try {
        return await this.getStudentAllocatedRouteLegacy(studentId);
      } catch (legacyError: any) {
        console.error('Legacy method also failed:', legacyError);
        throw new Error('Failed to fetch student route allocation: ' + error.message);
      }
    }
  },

  // Return type should be consistent with expectation
  async getStudentRouteAllocationFormatted(studentId: string): Promise<{
    route: {
      id: string;
      routeName: string;
      routeNumber: string;
      startLocation: string;
      endLocation: string;
      fare: number;
      departureTime: string;
      arrivalTime: string;
      stops?: Array<{
        id: string;
        stopName: string;
        stopTime: string;
        sequenceOrder: number;
        isMajorStop: boolean;
      }>;
    } | null;
    boardingStop: {
      id: string;
      stopName: string;
      stopTime: string;
    } | null;
    driver?: {
      id: string;
      name: string;
      experience: number;
      rating: number;
      totalTrips: number;
      phone: string;
    } | null;
    allocation: {
      id: string | null;
      allocatedAt: Date | null;
      isActive: boolean;
    };
  }> {
    try {
      // Get student's route allocation using the formatted method
      const allocationData = await this.getStudentRouteAllocation(studentId);
      
      if (!allocationData || !allocationData.route) {
        return {
          route: null,
          boardingStop: null,
          allocation: {
            id: null,
            allocatedAt: null,
            isActive: false
          }
        };
      }

      // Fetch driver information if route has a driver assigned
      let driverInfo = null;
      if (allocationData.route.driverId) {
        try {
          const { data: driverData, error: driverError } = await supabase
            .from('drivers')
            .select('id, name, experience_years, rating, total_trips, phone')
            .eq('id', allocationData.route.driverId)
            .eq('status', 'active')
            .single();

          if (!driverError && driverData) {
            driverInfo = {
              id: driverData.id as string,
              name: driverData.name as string,
              experience: driverData.experience_years as number || 0,
              rating: driverData.rating as number || 0,
              totalTrips: driverData.total_trips as number || 0,
              phone: driverData.phone as string
            };
          }
        } catch (driverFetchError) {
          console.error('Error fetching driver information:', driverFetchError);
        }
      }

      // Format the response to match component expectations
      return {
        route: {
          id: allocationData.route.id,
          routeName: allocationData.route.routeName,
          routeNumber: allocationData.route.routeNumber,
          startLocation: allocationData.route.startLocation,
          endLocation: allocationData.route.endLocation,
          fare: allocationData.route.fare,
          departureTime: allocationData.route.departureTime,
          arrivalTime: allocationData.route.arrivalTime,
          stops: allocationData.route.stops || []
        },
        boardingStop: allocationData.boardingStop ? {
          id: allocationData.boardingStop.id,
          stopName: allocationData.boardingStop.stopName,
          stopTime: allocationData.boardingStop.stopTime
        } : null,
        driver: driverInfo,
        allocation: {
          id: allocationData.id || null,
          allocatedAt: null, // This field isn't available in the current structure
          isActive: allocationData.isActive || false
        }
      };
      
    } catch (error) {
      console.error('Error in getStudentRouteAllocationFormatted:', error);
      throw error;
    }
  },

  // Get route schedules with enhanced booking window validation
  async getRouteSchedules(routeId: string, dateFrom?: string, dateTo?: string): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const defaultEndDate = nextMonth.toISOString().split('T')[0];

      // Use the new availability API endpoint
      const response = await fetch(`/api/schedules/availability?routeId=${routeId}&startDate=${dateFrom || today}&endDate=${dateTo || defaultEndDate}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${await response.text()}`);
      }
      
      const schedulesData = await response.json();
      
      // Convert to expected format
      return (schedulesData || []).map((schedule: Record<string, unknown>) => ({
        id: schedule.id as string,
        scheduleDate: new Date(schedule.schedule_date as string),
        departureTime: schedule.departure_time as string,
        arrivalTime: schedule.arrival_time as string,
        availableSeats: schedule.available_seats as number,
        bookedSeats: schedule.booked_seats as number,
        totalSeats: schedule.total_seats as number,
        bookingEnabled: schedule.booking_enabled as boolean,
        bookingDeadline: schedule.booking_deadline as string,
        specialInstructions: schedule.special_instructions as string,
        status: schedule.status as string,
        isBookingWindowOpen: schedule.is_booking_window_open as boolean,
        isBookingAvailable: schedule.is_booking_available as boolean,
        userBooking: schedule.user_booking as Record<string, unknown>
      }));
      
    } catch (error: any) {
      console.error('Error in getRouteSchedules:', error);
      throw new Error('Failed to fetch route schedules: ' + error.message);
    }
  },

  // Create booking with enhanced validation
  // REMOVED DUPLICATE createBooking function - using the improved version below

  // Get student's route allocation
  async getStudentRouteAllocation(studentId: string): Promise<any> {
    try {
      // Use legacy method directly - check if student has allocated_route_id in students table
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          allocated_route_id,
          boarding_point
        `)
        .eq('id', studentId)
        .single();

      if (studentError || !student || !student.allocated_route_id) {
        return null;
      }

      // Get route details
      const { data: route, error: routeError } = await supabase
        .from('routes')
        .select('*')
        .eq('id', student.allocated_route_id)
        .eq('status', 'active')
        .single();

      if (routeError || !route) {
        return null;
      }

      // Get all route stops
      const { data: routeStops, error: stopsError } = await supabase
        .from('route_stops')
        .select('*')
        .eq('route_id', route.id)
        .order('sequence_order', { ascending: true });

      if (stopsError) {
        console.error('Error fetching route stops:', stopsError);
      }

      // Format route stops for UI
      const formattedStops = (routeStops || []).map(stop => ({
        id: stop.id as string,
        stopName: stop.stop_name as string,
        stopTime: stop.stop_time as string,
        sequenceOrder: stop.sequence_order as number,
        isMajorStop: stop.is_major_stop as boolean
      }));

      // Find boarding stop if specified
      let boardingStop = null;
      if (student.boarding_point) {
        const stop = routeStops?.find(s => s.stop_name === student.boarding_point);
        if (stop) {
          boardingStop = {
            id: stop.id as string,
            stopName: stop.stop_name as string,
            stopTime: stop.stop_time as string
          };
        }
      }

      // Fallback to default boarding stop
      if (!boardingStop) {
        boardingStop = {
          id: 'default-stop',
          stopName: route.start_location as string,
          stopTime: route.departure_time as string
        };
      }

      return {
        id: `legacy-${student.id}`,
        route: {
          id: route.id as string,
          routeName: route.route_name as string,
          routeNumber: route.route_number as string,
          startLocation: route.start_location as string,
          endLocation: route.end_location as string,
          fare: route.fare as number,
          departureTime: route.departure_time as string,
          arrivalTime: route.arrival_time as string,
          stops: formattedStops
        },
        boardingStop: boardingStop,
        isActive: true
      };

    } catch (error) {
      console.error('Error in getStudentRouteAllocation:', error);
      return null;
    }
  },

  // Get schedules for a route with booking info
  async getRouteSchedules(routeId: string, dateFrom?: string, dateTo?: string): Promise<any[]> {
    try {
      const studentId = sessionManager.getCurrentStudent()?.student_id;
      
      let query = supabase
        .from('schedules')
        .select(`
          id,
          route_id,
          schedule_date,
          departure_time,
          arrival_time,
          available_seats,
          booked_seats,
          status,
          driver_id,
          vehicle_id,
          routes!route_id (
            id,
            route_number,
            route_name,
            start_location,
            end_location,
            fare,
            total_capacity,
            status
          ),
          drivers!driver_id (
            id,
            name
          ),
          vehicles!vehicle_id (
            id,
            registration_number
          )
        `)
        .eq('route_id', routeId)
        .in('status', ['scheduled', 'in_progress']);

      if (dateFrom) {
        query = query.gte('schedule_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('schedule_date', dateTo);
      }

      const { data: schedules, error } = await query.order('schedule_date');

      if (error) throw error;

      // Filter out schedules with inactive routes
      const activeSchedules = (schedules || []).filter(schedule => 
        schedule.routes && schedule.routes.status === 'active'
      ) || [];

      // Check for existing bookings for this student
      const schedulesWithBookings = await Promise.all(
        (activeSchedules || []).map(async (schedule) => {
          let userBooking = null;
          
          if (studentId) {
            const { data: booking } = await supabase
              .from('bookings')
              .select('id, status, seat_number, qr_code, payment_status')
              .eq('student_id', studentId)
              .eq('schedule_id', schedule.id)
              .eq('status', 'confirmed')  // Only check for confirmed bookings
              .single();
            
            if (booking) {
              userBooking = {
                id: booking.id as string,
                status: booking.status as string,
                seatNumber: booking.seat_number as string,
                qrCode: booking.qr_code as string,
                paymentStatus: booking.payment_status as string
              };
            }
          }

          // Check if booking window is open (1 hour before departure)
          const scheduleDate = new Date(schedule.schedule_date + 'T00:00:00');
          const [hours, minutes] = schedule.departure_time.split(':');
          scheduleDate.setHours(parseInt(hours), parseInt(minutes));
          const bookingWindowCloseTime = new Date(scheduleDate);
          bookingWindowCloseTime.setHours(bookingWindowCloseTime.getHours() - 1);
          const isBookingWindowOpen = new Date() < bookingWindowCloseTime;

          return {
            id: schedule.id as string,
            scheduleDate: new Date(schedule.schedule_date + 'T00:00:00'),
            departureTime: schedule.departure_time as string,
            arrivalTime: schedule.arrival_time as string,
            availableSeats: schedule.available_seats as number,
            bookedSeats: schedule.booked_seats as number || 0,
            status: schedule.status as string,
            isBookingWindowOpen,
            isBookingAvailable: isBookingWindowOpen && schedule.available_seats > 0,
            userBooking
          };
        })
      );

      return schedulesWithBookings;

    } catch (error) {
      console.error('Error fetching route schedules:', error);
      return [];
    }
  },

  // Create a new booking
  async createBooking(bookingData: any): Promise<any> {
    try {
      // Ensure trip_date is in the correct format (YYYY-MM-DD)
      let tripDate = bookingData.tripDate;
      if (tripDate instanceof Date) {
        const year = tripDate.getFullYear();
        const month = String(tripDate.getMonth() + 1).padStart(2, '0');
        const day = String(tripDate.getDate()).padStart(2, '0');
        tripDate = `${year}-${month}-${day}`;
      }
      
      // First check if schedule has available seats
      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select('available_seats, booked_seats, status')
        .eq('id', bookingData.scheduleId)
        .single();

      if (scheduleError) {
        console.error('Error checking schedule:', {
          code: scheduleError.code,
          message: scheduleError.message,
          details: scheduleError.details,
          hint: scheduleError.hint
        });
        return {
          success: false,
          message: `Schedule not found: ${scheduleError.message || 'Database error'}`
        };
      }

      if (!schedule || schedule.available_seats <= 0) {
        return {
          success: false,
          message: 'No seats available for this schedule'
        };
      }

      if (schedule.status !== 'scheduled') {
        return {
          success: false,
          message: 'Booking is not available for this schedule'
        };
      }

      // Check if student already has a booking for this schedule
      const { data: existingBooking, error: existingError } = await supabase
        .from('bookings')
        .select('id, status, trip_date')
        .eq('student_id', bookingData.studentId)
        .eq('schedule_id', bookingData.scheduleId)
        .eq('status', 'confirmed')  // Only check for confirmed bookings since 'pending' is not a valid enum value
        .single();
      
      if (existingError && existingError.code !== 'PGRST116') {
        // Enhanced error logging with multiple fallbacks
        console.error('Error checking existing booking:', {
          code: existingError.code,
          message: existingError.message,
          details: existingError.details,
          hint: existingError.hint,
          fullError: JSON.stringify(existingError, null, 2)
        });
        
        // Try multiple ways to get error message
        const errorMessage = existingError.message || 
                           existingError.details || 
                           existingError.hint || 
                           existingError.code ||
                           'Database error occurred';
        
        return {
          success: false,
          message: `Failed to check existing bookings: ${errorMessage}`
        };
      }

      if (existingBooking) {
        return {
          success: false,
          message: `You already have a ${existingBooking.status} booking for this date (${existingBooking.trip_date})`
        };
      }

      // Generate seat number (simple implementation)
      const seatNumber = `A${(schedule.booked_seats || 0) + 1}`;

      // Create the booking
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert({
          student_id: bookingData.studentId,
          route_id: bookingData.routeId,
          schedule_id: bookingData.scheduleId,
          booking_date: new Date().toISOString().split('T')[0],
          trip_date: tripDate,
          boarding_stop: bookingData.boardingStop,
          seat_number: seatNumber,
          amount: bookingData.amount,
          status: 'confirmed',
          payment_status: 'paid', // Assuming immediate payment for now
          qr_code: `TKT-${Date.now()}-${bookingData.studentId.slice(-4)}`
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating booking:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return {
          success: false,
          message: error.message || 'Failed to create booking'
        };
      }

      // Update schedule seat counts
      const newBookedSeats = (schedule.booked_seats || 0) + 1;
      const newAvailableSeats = Math.max(0, schedule.available_seats - 1);

      const { error: updateError } = await supabase
        .from('schedules')
        .update({
          booked_seats: newBookedSeats,
          available_seats: newAvailableSeats,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingData.scheduleId);

      if (updateError) {
        console.error('❌ Error updating schedule seats:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        // Note: We could implement a rollback here if needed
      }

      return {
        success: true,
        booking: booking,
        message: 'Booking created successfully'
      };

    } catch (error) {
      console.error('Error in createBooking:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        message: `Failed to create booking: ${errorMessage}`
      };
    }
  },

  // Check student payment status for account activation
  async getPaymentStatus(studentId: string) {
    try {
      console.log('Checking payment status for student:', studentId);

      // Get current academic info
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      let currentAcademic;
      if (month >= 6) {
        // June onwards - new academic year starts  
        currentAcademic = {
          academicYear: `${year}-${String(year + 1).slice(-2)}`,
          currentTerm: month >= 6 && month <= 9 ? '1' : month >= 10 || month <= 1 ? '2' : '3'
        };
      } else {
        // Jan-May - still in previous academic year
        currentAcademic = {
          academicYear: `${year - 1}-${String(year).slice(-2)}`,
          currentTerm: month >= 2 && month <= 5 ? '3' : '2'
        };
      }

      console.log('🔍 PAYMENT DEBUG: Current academic info:', currentAcademic);

      // ✅ FIRST: Check if fee structure exists for this student's route
      const { data: studentInfo, error: studentError } = await supabase
        .from('students')
        .select('allocated_route_id, boarding_point, boarding_stop')
        .eq('id', studentId)
        .single();

      if (studentError || !studentInfo) {
        console.log('🚨 PAYMENT DEBUG: Student not found, defaulting to active');
        return {
          isActive: true,
          lastPaidTerm: null,
          message: 'Student not found - allowing access'
        };
      }

      const routeId = studentInfo.allocated_route_id;
      const boardingStop = studentInfo.boarding_point || studentInfo.boarding_stop;

      // If student doesn't have route allocation, consider them active (no payment required)
      if (!routeId || !boardingStop) {
        console.log('🚨 PAYMENT DEBUG: No route allocation, considering active');
        return {
          isActive: true,
          lastPaidTerm: null,
          message: 'No route allocation - no payment required'
        };
      }

      // Check if fee structure exists for this route/boarding point
      const { data: feeStructure, error: feeError } = await supabase
        .from('semester_fees')
        .select('id')
        .eq('allocated_route_id', routeId)
        .eq('stop_name', boardingStop)
        .eq('academic_year', currentAcademic.academicYear)
        .eq('is_active', true)
        .limit(1);

      if (feeError) {
        console.log('🚨 PAYMENT DEBUG: Error checking fee structure, defaulting to active');
        return {
          isActive: true,
          lastPaidTerm: null,
          message: 'Fee structure check failed - allowing access'
        };
      }

      // If no fee structure exists, consider account active (graceful handling)
      if (!feeStructure || feeStructure.length === 0) {
        console.log('🚨 PAYMENT DEBUG: No fee structure found for route/boarding point, considering active');
        return {
          isActive: true,
          lastPaidTerm: null,
          message: 'No fee structure configured - allowing access until setup'
        };
      }

      console.log('✅ PAYMENT DEBUG: Fee structure exists, proceeding with payment checks');

      // Get student's payment history (both confirmed and pending)
      const { data: payments, error: paymentsError } = await supabase
        .from('semester_payments')
        .select(`
          id,
          semester,
          payment_type,
          covers_terms,
          payment_status,
          amount_paid,
          valid_from,
          valid_until,
          academic_year,
          payment_date,
          created_at
        `)
        .eq('student_id', studentId)
        .in('payment_status', ['confirmed', 'pending'])
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error fetching payment history:', paymentsError);
        return {
          isActive: false,
          lastPaidTerm: null,
          error: 'Failed to fetch payment history'
        };
      }

      console.log('🔍 PAYMENT DEBUG: Payment history:', payments);
      console.log('🔍 PAYMENT DEBUG: Payment count:', payments?.length || 0);

      if (!payments || payments.length === 0) {
        // No payments found - check if we're in current term period
        const currentTerm = currentAcademic.currentTerm;
        const currentMonth = now.getMonth() + 1;
        
        // Determine if current term is active based on current month
        let isCurrentTermActive = false;
        if (currentTerm === '1' && currentMonth >= 6 && currentMonth <= 9) {
          isCurrentTermActive = true; // June-September: Term 1 active
        } else if (currentTerm === '2' && (currentMonth >= 10 || currentMonth <= 1)) {
          isCurrentTermActive = true; // October-January: Term 2 active
        } else if (currentTerm === '3' && currentMonth >= 2 && currentMonth <= 5) {
          isCurrentTermActive = true; // February-May: Term 3 active
        }
        
        if (isCurrentTermActive) {
          // Allow access during active term even without payment history
          console.log('🚨 PAYMENT DEBUG: No payment history but current term is active, allowing access');
          return {
            isActive: true,
            lastPaidTerm: null,
            message: `No payment required during active Term ${currentTerm} period`,
            requiresPaymentSoon: true,
            currentTerm: currentTerm
          };
        } else {
          // Term is over, require payment
          return {
            isActive: false,
            lastPaidTerm: null,
            message: `Payment required for Term ${currentTerm}`
          };
        }
      }

      // Check for valid payments (not expired and either confirmed or pending)
      const validPayments = payments.filter(payment => {
        if (!payment.valid_until) return false;
        const validUntil = new Date(payment.valid_until);
        const isNotExpired = validUntil >= now;
        const isValidStatus = ['confirmed', 'pending'].includes(payment.payment_status);
        return isNotExpired && isValidStatus;
      });

      console.log('Valid payments (confirmed + pending):', validPayments);

      // Also check for current academic year payments specifically
      const currentYearPayments = payments.filter(payment => {
        return payment.academic_year === currentAcademic.academicYear &&
               ['confirmed', 'pending'].includes(payment.payment_status);
      });

      console.log('Current academic year payments:', currentYearPayments);

      // If we have valid payments OR current year payments, account should be active
      const hasValidPayments = validPayments.length > 0 || currentYearPayments.length > 0;

      if (!hasValidPayments) {
        // No valid payments - account inactive
        const lastPayment = payments[0]; // Most recent payment
        return {
          isActive: false,
          lastPaidTerm: lastPayment ? {
            termName: lastPayment.payment_type === 'full_year' 
              ? 'Full Academic Year' 
              : `Term ${lastPayment.covers_terms?.join(', ') || lastPayment.semester}`,
            academicYear: lastPayment.academic_year,
            semester: lastPayment.semester,
            paidDate: lastPayment.payment_date || lastPayment.created_at,
            validUntil: lastPayment.valid_until,
            amount: lastPayment.amount_paid
          } : null,
          message: lastPayment ? 'Payment expired' : 'No payment history found'
        };
      }

      // Account is active - get the most relevant active payment (prefer current year)
      const activePayment = currentYearPayments.length > 0 ? currentYearPayments[0] : validPayments[0];
      
      return {
        isActive: true,
        lastPaidTerm: {
          termName: activePayment.payment_type === 'full_year' 
            ? 'Full Academic Year' 
            : `Term ${activePayment.covers_terms?.join(', ') || activePayment.semester}`,
          academicYear: activePayment.academic_year,
          semester: activePayment.semester,
          paidDate: activePayment.payment_date || activePayment.created_at,
          validUntil: activePayment.valid_until,
          amount: activePayment.amount_paid
        },
        currentAcademic,
        message: 'Account active'
      };

    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        isActive: false,
        lastPaidTerm: null,
        error: 'Failed to check payment status'
      };
    }
  },

  // Get available fees for account reactivation
  async getAvailableFees(studentId: string) {
    try {
      const response = await fetch(`/api/semester-payments-v2?studentId=${studentId}&type=available`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error(`Fee structure not configured: ${errorData.error || 'Route or boarding point fee structure missing'}`);
        }
        throw new Error(`Failed to fetch available fees: ${errorData.error || response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching available fees:', error);
      throw error;
    }
  },

    // Get detailed student profile including emergency contacts
  async getStudentProfile(studentId: string) {
    try {
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) {
        console.error('Error fetching student profile:', error);
        throw error;
      }

      if (!student) {
        throw new Error('Student not found');
      }

      // Transform and return the detailed profile data
      return {
        mobile: student.mobile as string,
        dateOfBirth: student.date_of_birth as string,
        gender: student.gender as string,
        institutionName: student.institution_name as string,
        departmentName: student.department_name as string,
        programName: student.program_name as string,
        degreeName: student.degree_name as string,
        fatherName: student.father_name as string,
        fatherMobile: student.father_mobile as string,
        motherName: student.mother_name as string,
        motherMobile: student.mother_mobile as string,
        emergencyContactName: student.emergency_contact_name as string,
        emergencyContactPhone: student.emergency_contact_phone as string,
        addressStreet: student.address_street as string,
        addressDistrict: student.address_district as string,
        addressState: student.address_state as string,
        addressPinCode: student.address_pin_code as string,
        isProfileComplete: student.is_profile_complete as boolean
      };

    } catch (error) {
      console.error('Error in getStudentProfile:', error);
      throw error;
    }
  },





  // Get all available schedules for students
  async getAvailableSchedules(dateFrom?: string, dateTo?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('schedules')
        .select(`
          *,
          route:routes(
            *,
            stops:route_stops(*)
          ),
          driver:drivers(
            name,
            rating,
            total_trips
          ),
          vehicle:vehicles(
            registration_number,
            model,
            capacity
          )
        `)
        .in('status', ['scheduled', 'in_progress'])
        .gt('available_seats', 0);

      if (dateFrom) {
        query = query.gte('schedule_date', dateFrom);
      }

      if (dateTo) {
        query = query.lte('schedule_date', dateTo);
      }

      const { data, error } = await query.order('schedule_date', { ascending: true });

      if (error) throw error;

      // Transform the data to match the expected interface
      return (data || []).map(schedule => ({
        id: schedule.id as string,
        routeId: schedule.route_id as string,
        scheduleDate: new Date(schedule.schedule_date as string),
        departureTime: schedule.departure_time as string,
        arrivalTime: schedule.arrival_time as string,
        availableSeats: schedule.available_seats as number,
        bookedSeats: schedule.booked_seats as number,
        status: schedule.status as string,
        driverId: schedule.driver_id as string,
        vehicleId: schedule.vehicle_id as string,
        createdAt: new Date(schedule.created_at as string),
        updatedAt: new Date(schedule.updated_at as string),
        route: schedule.route ? {
          id: schedule.route.id as string,
          routeNumber: schedule.route.route_number as string,
          routeName: schedule.route.route_name as string,
          startLocation: schedule.route.start_location as string,
          endLocation: schedule.route.end_location as string,
          distance: schedule.route.distance as number,
          duration: schedule.route.duration as string,
          fare: schedule.route.fare as number,
          stops: (schedule.route.stops || []).map((stop: Record<string, unknown>) => ({
            id: stop.id as string,
            stopName: stop.stop_name as string,
            stopTime: stop.stop_time as string,
            sequenceOrder: stop.sequence_order as number,
            isMajorStop: stop.is_major_stop as boolean || false
          }))
        } : null,
        driver: schedule.driver ? {
          name: schedule.driver.name as string,
          rating: schedule.driver.rating as number || 0,
          totalTrips: schedule.driver.total_trips as number || 0
        } : null,
        vehicle: schedule.vehicle ? {
          registrationNumber: schedule.vehicle.registration_number as string,
          model: schedule.vehicle.model as string,
          capacity: schedule.vehicle.capacity as number
        } : null
      }));
    } catch (error) {
      console.error('Error fetching available schedules:', error);
      throw new Error('Failed to fetch available schedules');
    }
  },

  // Book a trip
  async bookTrip(booking: {
    studentId: string;
    routeId: string;
    scheduleId: string;
    tripDate: string;
    boardingStop: string;
    amount: number;
    specialRequirements?: string;
  }): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        student_id: booking.studentId,
        route_id: booking.routeId,
        schedule_id: booking.scheduleId,
        trip_date: booking.tripDate,
        boarding_stop: booking.boardingStop,
        amount: booking.amount,
        special_requirements: booking.specialRequirements,
        status: 'confirmed',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data as Booking;
  },

  // Submit grievance
  async submitGrievance(grievance: {
    studentId: string;
    routeId?: string;
    driverName?: string;
    category: Grievance['category'];
    priority: Grievance['priority'];
    subject: string;
    description: string;
  }): Promise<Grievance> {
    try {
      const session = sessionManager.getSession();
      if (!session?.user?.email) {
        throw new Error('No valid session found');
      }

      const response = await fetch('/api/grievances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': grievance.studentId
        },
        body: JSON.stringify({
          route_id: grievance.routeId,
          driver_name: grievance.driverName,
          category: grievance.category,
          priority: grievance.priority,
          subject: grievance.subject,
          description: grievance.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      return transformGrievance(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error submitting grievance:', error);
      throw new Error('Failed to create grievance');
    }
  },

  // Update student profile
  async updateProfile(studentId: string, updates: Partial<Student>): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;
    return data as Student;
  },

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  },

  // Get student bookings
  async getBookings(studentId: string, filters?: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ bookings: Booking[], total: number }> {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        route:routes(*),
        schedule:schedules(*)
      `, { count: 'exact' })
      .eq('student_id', studentId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte('trip_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('trip_date', filters.dateTo);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { bookings: (data || []).map(transformBooking) || [], total: count || 0 };
  },

  // Get student payments
  async getPayments(studentId: string, filters?: {
    status?: string;
    paymentType?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: Payment[], total: number }> {
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('student_id', studentId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.paymentType) {
      query = query.eq('payment_type', filters.paymentType);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { payments: (data || []).map(transformPayment) || [], total: count || 0 };
  },

  // Get student grievances
  async getGrievances(studentId: string): Promise<Grievance[]> {
    try {
      const session = sessionManager.getSession();
      if (!session?.user?.email) {
        throw new Error('No valid session found');
      }

      const response = await fetch('/api/grievances', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': session.user.email,
          'X-Student-Id': studentId
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || `Request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      const grievances = (responseData.data || []).map((grievance: Record<string, unknown>) => transformGrievance(grievance));
      return grievances;
    } catch (error) {
      console.error('Error fetching grievances:', error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};

// Helper functions for driver operations
export const driverHelpers = {
  // Regular driver login using API route
  async signIn(email: string, password: string) {
    try {
      const response = await fetch('/api/auth/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      return { user: data.user, session: data.session, driver: data.driver };
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  },

  // Get routes assigned to driver
  async getAssignedRoutes(driverId: string) {
    const res = await fetch(`/api/driver/routes?driverId=${encodeURIComponent(driverId)}`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.routes || [];
  },

  // Get bookings for a route and date, useful for stop-wise view
  async getRouteBookings(params: { routeId?: string; routeNumber?: string; date?: string }) {
    const searchParams = new URLSearchParams();
    if (params.routeId) searchParams.set('routeId', params.routeId);
    if (params.routeNumber) searchParams.set('routeNumber', params.routeNumber);
    if (params.date) searchParams.set('date', params.date);
    const res = await fetch(`/api/driver/bookings?${searchParams.toString()}`);
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    return json.bookings || [];
  }
};

// Type exports for convenience
export type SupabaseClient = typeof supabase; 
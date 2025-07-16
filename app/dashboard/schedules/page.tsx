'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Bus, 
  MapPin, 
  Clock, 
  CheckCircle,
  AlertCircle,
  X,
  Users,
  CreditCard,
  Star,
  Ticket
} from 'lucide-react';
import { studentHelpers } from '@/lib/supabase';
import { sessionManager } from '@/lib/session';
import { 
  formatDateForDatabase, 
  compareDateWithScheduleDate, 
  getCurrentDateString,
  formatDateForDisplay,
  createLocalDate,
  canBookTrip,
  getBookingWindowInfo
} from '@/lib/date-utils';
import toast from 'react-hot-toast';

interface StudentAllocation {
  id: string;
  route: {
    id: string;
    routeName: string;
    routeNumber: string;
    startLocation: string;
    endLocation: string;
    fare: number;
    departureTime: string;
    arrivalTime: string;
  };
  boardingStop: {
    id: string;
    stopName: string;
    stopTime: string;
  };
  isActive: boolean;
}

interface ScheduleData {
  id: string;
  scheduleDate: Date;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  bookedSeats: number;
  totalSeats?: number;
  bookingEnabled?: boolean;
  admin_scheduling_enabled?: boolean;
  bookingDeadline?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isDisabled?: boolean;
  isBookingWindowOpen: boolean;
  isBookingAvailable?: boolean;
  bookingDisabledReason?: string | null;
  maxBookingsPerDay?: number | null;
  specialInstructions?: string | null;
  userBooking?: {
    id: string;
    status: 'confirmed' | 'cancelled';
    seatNumber?: string;
    qrCode?: string;
    paymentStatus: 'paid' | 'pending';
  };
}

interface BoardingPassProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    seatNumber: string;
    qrCode: string;
    studentName: string;
    rollNumber: string;
    routeName: string;
    routeNumber: string;
    departureTime: string;
    boardingStop: string;
    scheduleDate: string;
  };
}

const BoardingPass: React.FC<BoardingPassProps> = ({ isOpen, onClose, booking }) => {
  const generateBarcodeLines = () => {
    const lines: React.JSX.Element[] = [];
    const totalLines = 40;
    const minLineWidth = 2;
    const maxLineWidth = 8;

    for (let i = 0; i < totalLines; i++) {
      const lineWidth = Math.random() * (maxLineWidth - minLineWidth) + minLineWidth;
      lines.push(
        <div
          key={i}
          className="bg-black"
          style={{ 
            width: `${lineWidth}px`, 
            height: '100%',
            marginRight: i < totalLines - 1 ? '2px' : '0'
          }}
        />
      );
    }
    return lines;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence key="boarding-pass">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1E1E1E] rounded-2xl overflow-hidden shadow-xl max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#2C2C2C]">
            <h2 className="text-xl font-bold text-white">Your E-Ticket</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Ticket Container */}
          <div className="bg-[#2C2C2C]">
            {/* Ticket Header */}
            <div className="bg-[#00A3FF] p-4 text-center">
              <span className="text-white text-4xl font-bold">{booking.seatNumber}</span>
            </div>

            {/* Ticket Content */}
            <div className="p-5">
              <h3 className="text-white text-2xl font-bold mb-1">{booking.studentName}</h3>
              <p className="text-[#888] text-base mb-5">{booking.rollNumber}</p>
              
              <div className="mb-5">
                <p className="text-white text-base mb-1">
                  From: {booking.boardingStop}
                </p>
                <p className="text-white text-base">
                  To: {booking.routeName.split(' - ')[1] || 'JKKN College'}
                </p>
              </div>
              
              <p className="text-[#00A3FF] text-lg font-bold mb-2">
                {booking.scheduleDate} - {booking.departureTime}
              </p>
              <p className="text-[#888] text-sm">Route: {booking.routeNumber}</p>
              <p className="text-[#888] text-sm">Ticket ID: {booking.id.slice(-8).toUpperCase()}</p>
            </div>

            {/* Barcode Container */}
            <div className="bg-white p-4 text-center">
              <div className="flex justify-center items-end h-20 w-full">
                {generateBarcodeLines()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-[#2C2C2C] border-t border-gray-600">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle size={16} />
              <span className="text-sm">Ticket Confirmed</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const BookingConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  schedule: ScheduleData | null;
  student: any;
  allocation: StudentAllocation | null;
}> = ({ isOpen, onClose, onConfirm, schedule, student, allocation }) => {
  if (!isOpen || !schedule) {
    console.log('🔍 MODAL DEBUG: Modal not showing - isOpen:', isOpen, 'schedule:', !!schedule);
    return null;
  }

  console.log('🔍 MODAL DEBUG: Rendering confirmation modal for schedule:', schedule.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-4">⚠️ Confirm Your Booking</h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{formatDate(schedule.scheduleDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Route:</span>
            <span className="font-medium">{allocation?.route.routeNumber} - {allocation?.route.routeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Departure:</span>
            <span className="font-medium">{formatTime(schedule.departureTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Boarding Stop:</span>
            <span className="font-medium">{allocation?.boardingStop.stopName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fare:</span>
            <span className="font-medium">{formatCurrency(allocation?.route.fare || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Available Seats:</span>
            <span className="font-medium">{schedule.availableSeats}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Student:</strong> {student?.student_name} ({student?.roll_number})
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const formatTime = (time: string) => {
  return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export default function SchedulesPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [studentAllocation, setStudentAllocation] = useState<StudentAllocation | null>(null);
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBoardingPass, setShowBoardingPass] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [showBookingConfirmation, setShowBookingConfirmation] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<ScheduleData | null>(null);

  // Calendar state - always start with current month
  const [calendarDate, setCalendarDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1); // First day of current month
  });

  // Track booking status separately for immediate updates
  const [bookingStatus, setBookingStatus] = useState<Map<string, boolean>>(new Map());
  // Force calendar re-render when booking status changes
  const [calendarKey, setCalendarKey] = useState(0);
  // Add verification state for comprehensive checks
  const [lastVerificationTime, setLastVerificationTime] = useState<Date | null>(null);
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  // Comprehensive booking verification function
  const verifyBookingStatus = async () => {
    if (!studentAllocation?.route.id || !student?.student_id) {
      console.log('🔍 BOOKING DEBUG: Missing route or student data', {
        hasRoute: !!studentAllocation?.route.id,
        hasStudent: !!student?.student_id
      });
      return;
    }

    if (verificationInProgress) return;
    setVerificationInProgress(true);
    console.log('🔍 BOOKING DEBUG: Starting booking verification for student:', student.student_id);

    try {
      // Fetch fresh schedule data with booking information
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      const todayStr = formatDateForDatabase(today);
      const nextMonthStr = formatDateForDatabase(nextMonth);

      console.log('🔍 BOOKING DEBUG: Fetching schedules with date range:', { todayStr, nextMonthStr });

      const apiUrl = `/api/schedules/availability?routeId=${studentAllocation.route.id}&startDate=${todayStr}&endDate=${nextMonthStr}&studentId=${student.student_id}`;
      console.log('🔍 BOOKING DEBUG: API URL:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error('🔍 BOOKING DEBUG: API response error:', response.status);
        return;
      }

      const freshSchedules = await response.json();
      console.log('🔍 BOOKING DEBUG: Raw API response:', {
        scheduleCount: freshSchedules.length,
        schedules: freshSchedules
      });

      // Check for schedules with booking data
      const schedulesWithBookings = freshSchedules.filter((s: any) => s.user_booking);
      console.log('🔍 BOOKING DEBUG: Schedules with bookings:', {
        count: schedulesWithBookings.length,
        schedulesWithBookings: schedulesWithBookings.map((s: any) => ({
          id: s.id,
          date: s.schedule_date,
          booking: s.user_booking
        }))
      });

      // Extract server booking status
      const serverBookingStatus = new Map<string, boolean>();
      freshSchedules.forEach((schedule: any) => {
        const dateString = schedule.schedule_date; // Already in YYYY-MM-DD format
        const hasBooking = !!schedule.user_booking;
        serverBookingStatus.set(dateString, hasBooking);
        
        if (hasBooking) {
          console.log('🔍 BOOKING DEBUG: Found server booking for date:', dateString, schedule.user_booking);
        }
      });

      console.log('🔍 BOOKING DEBUG: Server booking status map:', Object.fromEntries(serverBookingStatus));

      // Compare with local booking status
      const localBookingStatus = Object.fromEntries(bookingStatus);
      console.log('🔍 BOOKING DEBUG: Local booking status map:', localBookingStatus);

      // Update local state with server data
      let hasChanges = false;
      let discrepanciesFound = 0;
      const newMap = new Map(bookingStatus);

      // Check for server bookings not in local state
      serverBookingStatus.forEach((isBooked, dateString) => {
        if (!bookingStatus.has(dateString) || !bookingStatus.get(dateString)) {
          console.log(`🔍 BOOKING DEBUG: Found server booking not in local state: ${dateString}`);
          newMap.set(dateString, true);
          hasChanges = true;
          discrepanciesFound++;
        }
      });

      // Check for local bookings not on server (cancelled bookings)
      bookingStatus.forEach((isBooked, dateString) => {
        if (isBooked && !serverBookingStatus.has(dateString)) {
          console.log(`🔍 BOOKING DEBUG: Found local booking not on server: ${dateString}`);
          newMap.set(dateString, false);
          hasChanges = true;
          discrepanciesFound++;
        }
      });

      if (hasChanges) {
        console.log(`🔍 BOOKING DEBUG: Updating booking status - found ${discrepanciesFound} discrepancies`);
        console.log('🔍 BOOKING DEBUG: New booking status:', Object.fromEntries(newMap));
        setBookingStatus(newMap);
        setCalendarKey(prev => prev + 1);
      } else {
        console.log('🔍 BOOKING DEBUG: No booking status changes needed');
      }

      // Update schedules if there are changes
      if (JSON.stringify(freshSchedules) !== JSON.stringify(schedules)) {
        console.log('🔍 BOOKING DEBUG: Updating schedules with fresh data');
        const processedSchedules = freshSchedules.map((schedule: any) => ({
          id: schedule.id,
          scheduleDate: createLocalDate(schedule.schedule_date),
          departureTime: schedule.departure_time,
          arrivalTime: schedule.arrival_time,
          availableSeats: schedule.available_seats,
          bookedSeats: schedule.booked_seats,
          totalSeats: schedule.total_seats,
          bookingEnabled: schedule.booking_enabled,
          admin_scheduling_enabled: schedule.admin_scheduling_enabled,
          bookingDeadline: schedule.booking_deadline,
          status: schedule.status,
          isDisabled: schedule.is_disabled, // Maps from API field is_disabled
          isBookingWindowOpen: schedule.is_booking_window_open ?? true,
          isBookingAvailable: schedule.is_booking_available ?? true,
          bookingDisabledReason: schedule.booking_disabled_reason, // Maps from API field booking_disabled_reason
          maxBookingsPerDay: schedule.max_bookings_per_day,
          specialInstructions: schedule.special_instructions,
          userBooking: schedule.user_booking
        }));
        setSchedules(processedSchedules);
      }
      
      setLastVerificationTime(new Date());
      console.log(`🔍 BOOKING DEBUG: Verification complete. Found ${discrepanciesFound} discrepancies.`);
      
    } catch (error) {
      console.error('🔍 BOOKING DEBUG: Error during verification:', error);
    } finally {
      setVerificationInProgress(false);
    }
  };

  // DISABLED: Automatic verification that was causing auto-booking
  // useEffect(() => {
  //   if (!studentAllocation?.route.id || !student?.student_id) return;

  //   // Initial verification after component mount
  //   const initialVerification = setTimeout(() => {
  //     verifyBookingStatus();
  //   }, 2000);

  //   // Periodic verification every 5 minutes
  //   const verificationInterval = setInterval(() => {
  //     verifyBookingStatus();
  //   }, 5 * 60 * 1000);

  //   return () => {
  //     clearTimeout(initialVerification);
  //     clearInterval(verificationInterval);
  //   };
  // }, [studentAllocation?.route.id, student?.student_id]);

  const getDateStatus = (date: Date) => {
    // Convert date to YYYY-MM-DD format for comparison
    const dateString = formatDateForDatabase(date);
    
    // Find the matching schedule first
    const schedule = schedules.find(s => {
      const scheduleDateString = formatDateForDatabase(s.scheduleDate);
      return scheduleDateString === dateString;
    });

    // Return unavailable if no schedule exists
    if (!schedule) {
      console.log(`🔍 DATE STATUS DEBUG: No schedule found for ${dateString} - returning 'unavailable'`);
      return 'unavailable';
    }

    // DEBUG: Log schedule details for specific dates
    if (dateString === '2025-07-07' || dateString === '2025-07-08' || dateString === '2025-07-10' || dateString === '2025-07-15' || dateString === '2025-07-17') {
      console.log(`🔍 DATE STATUS DEBUG: PRIORITY CHECK for ${dateString}:`, {
        isDisabled: schedule.isDisabled,
        bookingEnabled: schedule.bookingEnabled,
        status: schedule.status,
        hasUserBooking: !!(schedule.userBooking && schedule.userBooking.id),
        bookingDisabledReason: schedule.bookingDisabledReason,
        isBookingAvailable: schedule.isBookingAvailable,
        availableSeats: schedule.availableSeats,
        admin_scheduling_enabled: schedule.admin_scheduling_enabled
      });
    }

    // PRIORITY 1: Check if schedule is disabled/cancelled FIRST (HIGHEST PRIORITY)
    // Disabled schedules should show as "disabled" even if there are existing bookings
    if (schedule.isDisabled === true || schedule.status === 'cancelled' || schedule.bookingEnabled === false) {
      console.log(`🔍 DATE STATUS DEBUG: Schedule disabled for ${dateString}: ${schedule.bookingDisabledReason || 'Schedule disabled'}`);
      return 'disabled';
    }

    // PRIORITY 2: Check if schedule is completed
    if (schedule.status === 'completed') {
      console.log(`🔍 DATE STATUS DEBUG: Schedule completed for ${dateString}`);
      return 'completed';
    }

    // PRIORITY 3: Check if user has an existing booking
    if (schedule.userBooking && typeof schedule.userBooking === 'object' && schedule.userBooking.id) {
      console.log(`🔍 DATE STATUS DEBUG: Valid booking found for ${dateString}:`, schedule.userBooking);
      return 'booked';
    } else if (schedule.userBooking) {
      console.log(`🔍 DATE STATUS DEBUG: Invalid booking object detected for ${dateString}, treating as available:`, schedule.userBooking);
      // Don't treat invalid booking objects as actual bookings
    }

    // PRIORITY 4: Check local booking status (for immediate updates after booking)
    if (bookingStatus.has(dateString) && bookingStatus.get(dateString)) {
      console.log(`🔍 DATE STATUS DEBUG: Local booking found for ${dateString} - returning 'booked'`);
      return 'booked';
    }

    // PRIORITY 5: Use the comprehensive API booking availability check
    if (schedule.isBookingAvailable === false) {
      const reason = schedule.bookingDisabledReason || 'Not available';
      console.log(`🔍 DATE STATUS DEBUG: Booking not available for ${dateString}: ${reason}`);
      return 'closed';
    }

    // PRIORITY 6: Check if booking window is open
    if (schedule.isBookingWindowOpen === false) {
      return 'closed';
    }

    // PRIORITY 7: Check if seats are available
    if (schedule.availableSeats <= 0) {
      return 'full';
    }

    // PRIORITY 8: Check schedule status for basic availability
    if (schedule.status !== 'scheduled' && schedule.status !== 'in_progress') {
      return 'unavailable';
    }

    // All checks passed - date is available for booking
    console.log(`🔍 DATE STATUS DEBUG: Schedule ${dateString} is available for booking`);
    return 'available';
  };

  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isPast = date < today;
      
      days.push({
        date,
        isCurrentMonth,
        isToday,
        isPast,
        status: getDateStatus(date)
      });
    }
    
    return days;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Regenerate calendar days when booking status changes - moved here to follow Rules of Hooks
  const calendarDays = useMemo(() => generateCalendarDays(), [calendarDate, schedules, bookingStatus, calendarKey]);

  const fetchInitialData = async () => {
    try {
      console.log('🔍 INIT DEBUG: Starting fetchInitialData...');
      
      // Check authentication
      if (!sessionManager.isAuthenticated()) {
        console.error('🔍 INIT DEBUG: Not authenticated');
        toast.error('Please login to continue');
        window.location.href = '/login';
        return;
      }

      const currentStudent = sessionManager.getCurrentStudent();
      if (!currentStudent) {
        console.error('🔍 INIT DEBUG: No student data in session');
        toast.error('Invalid session data');
        window.location.href = '/login';
        return;
      }

      console.log('🔍 INIT DEBUG: Student session data:', {
        student_id: currentStudent.student_id,
        student_name: currentStudent.student_name,
        roll_number: currentStudent.roll_number
      });

      setStudent(currentStudent);
      
      // Fetch student's route allocation
      console.log('🔍 INIT DEBUG: Fetching student allocation...');
      await fetchStudentAllocation(currentStudent.student_id);
      
      // Load existing bookings ONCE after initial setup (increased timeout for proper loading)
      setTimeout(() => {
        loadExistingBookings(currentStudent.student_id);
      }, 2000);
      
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentAllocation = async (studentId: string) => {
    try {
      console.log('🔍 ALLOCATION DEBUG: Fetching allocation for student:', studentId);
      
      // Get student's route allocation using the formatted method
      const allocation = await studentHelpers.getStudentRouteAllocationFormatted(studentId);
      
      console.log('🔍 ALLOCATION DEBUG: Raw allocation response:', allocation);
      
      if (!allocation || !allocation.route) {
        console.error('🔍 ALLOCATION DEBUG: No route allocation found for student');
        toast.error('No route allocation found. Please contact administration.');
        return;
      }

      // Check if allocation object and its properties exist
      if (!allocation.allocation) {
        console.error('🔍 ALLOCATION DEBUG: Invalid allocation structure');
        toast.error('Invalid route allocation data. Please contact administration.');
        return;
      }

      // Transform to match component interface
      const transformedAllocation = {
        id: allocation.allocation.id || null,
        route: allocation.route,
        boardingStop: allocation.boardingStop,
        isActive: allocation.allocation.isActive || false
      };

      console.log('🔍 ALLOCATION DEBUG: Transformed allocation:', transformedAllocation);

      setStudentAllocation(transformedAllocation);
      
      // Fetch schedules for this route - pass studentId directly to avoid race condition
      if (allocation.route?.id) {
        console.log('🔍 ALLOCATION DEBUG: Route found, fetching schedules for route:', allocation.route.id, 'with studentId:', studentId);
        await fetchRouteSchedules(allocation.route.id, studentId);
      } else {
        console.error('🔍 ALLOCATION DEBUG: No route ID found in allocation');
        toast.error('Invalid route allocation. Please contact administration.');
      }
      
    } catch (error) {
      console.error('🔍 ALLOCATION DEBUG: Error fetching student allocation:', error);
      toast.error('Failed to load route allocation: ' + (error as Error).message);
    }
  };

  const fetchRouteSchedules = async (routeId: string, studentId?: string) => {
    try {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);

      // Use utility functions for consistent date formatting
      const todayStr = formatDateForDatabase(today);
      const nextMonthStr = formatDateForDatabase(nextMonth);

      // Use provided studentId or fall back to state
      const currentStudentId = studentId || student?.student_id;

      // Try the new availability API endpoint first
      try {
        const apiUrl = `/api/schedules/availability?routeId=${routeId}&startDate=${todayStr}&endDate=${nextMonthStr}&studentId=${currentStudentId}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API response error:', response.status, errorText);
          throw new Error(`API returned ${response.status}: ${errorText}`);
        }
        
        const schedulesData = await response.json();
        
        console.log('🔍 SCHEDULE DEBUG: Processing schedules, checking for auto-booking issues');
        
        // Convert date strings back to Date objects and map the data
        const processedSchedules = schedulesData.map((schedule: any) => {
          // CRITICAL: Only include userBooking if it has a valid ID
          const validUserBooking = (schedule.user_booking && schedule.user_booking.id) ? schedule.user_booking : null;
          
          if (schedule.user_booking && !schedule.user_booking.id) {
            console.log('🔍 SCHEDULE DEBUG: Filtering out invalid booking object for schedule:', schedule.id, schedule.user_booking);
          }
          
          if (validUserBooking) {
            console.log('🔍 SCHEDULE DEBUG: Valid booking found for schedule:', schedule.id, 'on date:', schedule.schedule_date);
          }
          
          return {
            id: schedule.id,
            scheduleDate: createLocalDate(schedule.schedule_date),
            departureTime: schedule.departure_time,
            arrivalTime: schedule.arrival_time,
            availableSeats: schedule.available_seats,
            bookedSeats: schedule.booked_seats,
            totalSeats: schedule.total_seats,
            bookingEnabled: schedule.booking_enabled,
            admin_scheduling_enabled: schedule.admin_scheduling_enabled,
            bookingDeadline: schedule.booking_deadline,
            status: schedule.status,
            isDisabled: schedule.is_disabled, // Maps from API field is_disabled
            isBookingWindowOpen: schedule.is_booking_window_open ?? true,
            isBookingAvailable: schedule.is_booking_available ?? true,
            bookingDisabledReason: schedule.booking_disabled_reason, // Maps from API field booking_disabled_reason
            maxBookingsPerDay: schedule.max_bookings_per_day,
            specialInstructions: schedule.special_instructions,
            userBooking: validUserBooking // Only valid bookings with IDs
          };
        });

        console.log('🔍 SCHEDULE DEBUG: Processed', processedSchedules.length, 'schedules');
        console.log('🔍 SCHEDULE DEBUG: Schedules with valid bookings:', processedSchedules.filter(s => s.userBooking).length);
        
        // Also update booking status based on schedule data
        const schedulesWithBookings = processedSchedules.filter(s => s.userBooking);
        if (schedulesWithBookings.length > 0) {
          const bookingStatusMap = new Map<string, boolean>();
          schedulesWithBookings.forEach(schedule => {
            const dateString = formatDateForDatabase(schedule.scheduleDate);
            bookingStatusMap.set(dateString, true);
          });
          setBookingStatus(bookingStatusMap);
          console.log('🔍 SCHEDULE DEBUG: Updated booking status from schedule data');
        }
        
        // Debug log the processed schedules
        console.log('🔍 SCHEDULE DEBUG: Sample processed schedule:', processedSchedules[0]);
        console.log('🔍 SCHEDULE DEBUG: Available schedules:', processedSchedules.filter(s => s.isBookingAvailable).length);
        console.log('🔍 SCHEDULE DEBUG: Disabled schedules:', processedSchedules.filter(s => s.isDisabled).length);
        
        setSchedules(processedSchedules || []);
        
      } catch (apiError) {
        console.error('❌ New API failed, falling back to studentHelpers:', apiError);
        
        // Fallback to the original method if the new API fails
        const schedulesData = await studentHelpers.getRouteSchedules(
          routeId,
          todayStr,
          nextMonthStr
        );

        setSchedules(schedulesData || []);
      }
      
    } catch (error) {
      console.error('❌ Error fetching schedules:', error);
      toast.error('Failed to load schedules: ' + (error as Error).message);
      setSchedules([]); // Set empty array to prevent infinite loading
    }
  };

  const handleDateClick = async (date: Date) => {
    try {
      // Convert date to YYYY-MM-DD format for SQL query
      const dateString = formatDateForDatabase(date);
      
      // Check local booking status first
      if (bookingStatus.has(dateString) && bookingStatus.get(dateString)) {
        toast.success('You already have a booking for this date');
        // Show simplified boarding pass for local bookings
        setSelectedBooking({
          id: `local-${dateString}`,
          seatNumber: 'TBD',
          qrCode: '',
          studentName: student.student_name,
          rollNumber: student.roll_number,
          routeName: studentAllocation?.route.routeName || '',
          routeNumber: studentAllocation?.route.routeNumber || '',
          departureTime: formatTime(studentAllocation?.route.departureTime || ''),
          boardingStop: studentAllocation?.boardingStop.stopName || '',
          scheduleDate: formatDate(date)
        });
        setShowBoardingPass(true);
        return;
      }
      
      // Check if date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        toast.error('Cannot book for past dates');
        return;
      }
      
      // Check if student has route allocation
      if (!studentAllocation || !studentAllocation.route) {
        toast.error('No route allocation found. Please contact administration.');
        return;
      }
      
      // Query database directly for this specific date with comprehensive checks
      const response = await fetch(`/api/schedules/specific-date?routeId=${studentAllocation.route.id}&scheduleDate=${dateString}&studentId=${student.student_id}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      const { schedule } = await response.json();
      
      if (!schedule) {
        toast.error('No schedule available for this date');
        return;
      }
      
      // Check if user already has a booking for this schedule
      if (schedule.user_booking && schedule.user_booking.id) {
        console.log('🔍 BOOKING DEBUG: User has existing booking, showing boarding pass');
        
        // Update local state immediately
        setBookingStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(dateString, true);
          return newMap;
        });
        setCalendarKey(prev => prev + 1);
        
        // Show boarding pass for existing booking
        setSelectedBooking({
          id: schedule.user_booking.id,
          seatNumber: schedule.user_booking.seatNumber || 'TBD',
          qrCode: schedule.user_booking.qrCode || '',
          studentName: student.student_name,
          rollNumber: student.roll_number,
          routeName: studentAllocation?.route.routeName || '',
          routeNumber: studentAllocation?.route.routeNumber || '',
          departureTime: formatTime(schedule.departure_time),
          boardingStop: studentAllocation?.boardingStop.stopName || '',
          scheduleDate: formatDate(date)
        });
        setShowBoardingPass(true);
        toast.success('You already have a booking for this date');
        return;
      } else if (schedule.user_booking) {
        console.log('🔍 BOOKING DEBUG: Invalid booking object detected, treating as available:', schedule.user_booking);
        // Don't treat invalid booking objects as actual bookings, continue to show confirmation
      }
      
      // Comprehensive availability checks
      const validationErrors = [];
      
      // PRIORITY CHECK: Admin approval required
      if (!schedule.admin_scheduling_enabled) {
        validationErrors.push('This trip has not been approved by administration for student booking');
      }
      
      // Check schedule status
      if (schedule.status !== 'scheduled' && schedule.status !== 'in_progress') {
        validationErrors.push(`Schedule status is ${schedule.status}`);
      }
      
      // Check if schedule is disabled/cancelled (new API field)
      if (schedule.is_disabled || schedule.status === 'cancelled') {
        const message = schedule.booking_disabled_reason || 'Schedule has been cancelled or disabled';
        validationErrors.push(message);
      }

      // Check if booking is explicitly disabled
      if (schedule.booking_enabled === false) {
        const message = schedule.special_instructions || schedule.booking_disabled_reason
          ? `Booking disabled: ${schedule.special_instructions || schedule.booking_disabled_reason}`
          : 'Booking has been disabled for this schedule by administration';
        validationErrors.push(message);
      }

      // Check booking availability (uses new comprehensive API logic)
      if (schedule.is_booking_available === false) {
        const message = schedule.booking_disabled_reason || schedule.special_instructions
          ? `Booking unavailable: ${schedule.booking_disabled_reason || schedule.special_instructions}`
          : 'Booking is currently unavailable for this schedule';
        validationErrors.push(message);
      }
      
      // Check booking window
      if (schedule.is_booking_window_open === false) {
        const deadlineMsg = schedule.booking_deadline 
          ? `Booking window closed at ${new Date(schedule.booking_deadline).toLocaleString()}`
          : 'Booking window is closed for this schedule';
        validationErrors.push(deadlineMsg);
      }
      
      // Check seat availability
      if (schedule.available_seats <= 0) {
        validationErrors.push(`No seats available (${schedule.available_seats} remaining)`);
      }
      
      // If there are validation errors, show the first one
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }
      
      // All checks passed - show confirmation dialog (NO AUTO-BOOKING)
      console.log('🔍 BOOKING DEBUG: All validation checks passed, showing confirmation dialog');
      setSelectedDate(date);
      
      // Convert API response to match expected format
      const scheduleData = {
        id: schedule.id,
        scheduleDate: date,
        departureTime: schedule.departure_time,
        arrivalTime: schedule.arrival_time,
        availableSeats: schedule.available_seats,
        bookedSeats: schedule.booked_seats,
        totalSeats: schedule.total_seats,
        bookingEnabled: schedule.booking_enabled,
        admin_scheduling_enabled: schedule.admin_scheduling_enabled, // Fix: Add missing field
        bookingDeadline: schedule.booking_deadline,
        status: schedule.status,
        isBookingWindowOpen: schedule.is_booking_window_open,
        isBookingAvailable: schedule.is_booking_available,
        specialInstructions: schedule.special_instructions,
        userBooking: schedule.user_booking
      };
      
      // IMPORTANT: Show confirmation dialog - NO automatic booking!
      console.log('🔍 BOOKING DEBUG: Setting up confirmation dialog for date:', formatDate(date));
      setPendingBooking(scheduleData);
      setShowBookingConfirmation(true);
      console.log('🔍 BOOKING DEBUG: Confirmation dialog should now be visible');
      
    } catch (error) {
      console.error('Error in handleDateClick:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to check schedule: ${errorMessage}`);
    }
  };

  const handleConfirmBooking = async () => {
    if (!pendingBooking) return;
    
    console.log('🔍 BOOKING DEBUG: User confirmed booking, proceeding with:', pendingBooking);
    
    // Close confirmation dialog
    setShowBookingConfirmation(false);
    setPendingBooking(null);
    
    // Proceed with the actual booking
    await handleBookTrip(pendingBooking);
  };

  const handleCancelBooking = () => {
    console.log('🔍 BOOKING DEBUG: User cancelled booking');
    setShowBookingConfirmation(false);
    setPendingBooking(null);
    setSelectedDate(null);
  };

  const handleBookTrip = async (schedule: ScheduleData) => {
    console.log('🔍 BOOKING DEBUG: Starting handleBookTrip with schedule:', {
      id: schedule.id,
      scheduleDate: schedule.scheduleDate,
      admin_scheduling_enabled: schedule.admin_scheduling_enabled,
      bookingEnabled: schedule.bookingEnabled,
      isBookingAvailable: schedule.isBookingAvailable,
      isBookingWindowOpen: schedule.isBookingWindowOpen,
      availableSeats: schedule.availableSeats
    });
    
    // Comprehensive pre-booking validation
    const validationErrors = [];
    
    // PRIORITY CHECK: Admin approval required
    if (!schedule.admin_scheduling_enabled) {
      console.log('🔍 BOOKING DEBUG: ❌ Admin scheduling not enabled');
      validationErrors.push('This trip has not been approved by administration for student booking');
    } else {
      console.log('🔍 BOOKING DEBUG: ✅ Admin scheduling enabled');
    }
    
    // Check if booking is explicitly disabled
    if (schedule.bookingEnabled === false) {
      console.log('🔍 BOOKING DEBUG: ❌ Booking explicitly disabled');
      const message = schedule.specialInstructions 
        ? `Booking disabled: ${schedule.specialInstructions}`
        : 'Booking has been disabled for this schedule by administration';
      validationErrors.push(message);
    } else {
      console.log('🔍 BOOKING DEBUG: ✅ Booking enabled');
    }

    // Check booking availability
    if (schedule.isBookingAvailable === false) {
      console.log('🔍 BOOKING DEBUG: ❌ Booking not available');
      const message = schedule.specialInstructions 
        ? `Booking unavailable: ${schedule.specialInstructions}`
        : 'Booking is currently unavailable for this schedule';
      validationErrors.push(message);
    } else {
      console.log('🔍 BOOKING DEBUG: ✅ Booking available');
    }

    // Check booking window
    if (schedule.isBookingWindowOpen === false) {
      console.log('🔍 BOOKING DEBUG: ❌ Booking window closed');
      const deadlineMsg = schedule.bookingDeadline 
        ? `Booking closed at ${new Date(schedule.bookingDeadline).toLocaleString()}`
        : 'Booking window is closed for this schedule';
      validationErrors.push(deadlineMsg);
    } else {
      console.log('🔍 BOOKING DEBUG: ✅ Booking window open');
    }

    // Check seat availability
    if (schedule.availableSeats <= 0) {
      console.log('🔍 BOOKING DEBUG: ❌ No seats available:', schedule.availableSeats);
      validationErrors.push(`No seats available (${schedule.availableSeats} remaining)`);
    } else {
      console.log('🔍 BOOKING DEBUG: ✅ Seats available:', schedule.availableSeats);
    }
    
    // Check if student has route allocation
    if (!studentAllocation || !studentAllocation.route) {
      console.log('🔍 BOOKING DEBUG: ❌ No route allocation');
      validationErrors.push('No route allocation found. Please contact administration.');
    } else {
      console.log('🔍 BOOKING DEBUG: ✅ Route allocation found');
    }
    
    // Check if schedule date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (schedule.scheduleDate < today) {
      console.log('🔍 BOOKING DEBUG: ❌ Schedule date is in the past');
      validationErrors.push('Cannot book for past dates');
    } else {
      console.log('🔍 BOOKING DEBUG: ✅ Schedule date is in the future');
    }

    console.log('🔍 BOOKING DEBUG: Validation summary:', {
      totalErrors: validationErrors.length,
      errors: validationErrors
    });

    // If there are validation errors, show the first one and return
    if (validationErrors.length > 0) {
      console.log('🔍 BOOKING DEBUG: ❌ Validation failed, showing error:', validationErrors[0]);
      toast.error(validationErrors[0]);
      return;
    }
    
    console.log('🔍 BOOKING DEBUG: ✅ All validations passed, proceeding with booking');

    try {
      // Format the date consistently to avoid timezone issues
      const tripDate = formatDateForDatabase(schedule.scheduleDate);
      
      const bookingData = {
        studentId: student.student_id,
        routeId: studentAllocation?.route.id,
        scheduleId: schedule.id,
        tripDate: tripDate,
        boardingStop: studentAllocation?.boardingStop.stopName,
        amount: studentAllocation?.route.fare
      };

      // Show loading state
      const loadingToast = toast.loading('Creating your booking...');

      const result = await studentHelpers.createBooking(bookingData);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (result.success) {
        toast.success('Trip booked successfully!');
        
        // Immediately update local booking status for UI feedback
        const tripDateString = formatDateForDatabase(schedule.scheduleDate);
        
        setBookingStatus(prev => {
          const newMap = new Map(prev);
          newMap.set(tripDateString, true);
          return newMap;
        });
        
        // Force calendar re-render to update colors
        setCalendarKey(prev => prev + 1);
        
        // Show the boarding pass immediately
        if (result.booking) {
          setSelectedBooking({
            id: result.booking.id,
            seatNumber: result.booking.seat_number || 'TBD',
            qrCode: result.booking.qr_code || '',
            studentName: student.student_name,
            rollNumber: student.roll_number,
            routeName: studentAllocation?.route.routeName || '',
            routeNumber: studentAllocation?.route.routeNumber || '',
            departureTime: formatTime(schedule.departureTime),
            boardingStop: studentAllocation?.boardingStop.stopName || '',
            scheduleDate: formatDate(schedule.scheduleDate)
          });
          setShowBoardingPass(true);
        }
        
        // Refresh schedules in the background to sync with server
        setTimeout(async () => {
          try {
            await fetchRouteSchedules(studentAllocation?.route.id || '', student.student_id);
            // Force another calendar update after fetching new data
            setCalendarKey(prev => prev + 1);
          } catch (refreshError) {
            console.error('Error refreshing schedules:', refreshError);
            // Don't show error to user as the booking was successful
          }
        }, 1500);
        
      } else {
        console.error('❌ Booking failed:', result.message);
        toast.error(result.message || 'Failed to book trip');
      }
      
    } catch (error) {
      console.error('❌ Error in booking process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to book trip: ${errorMessage}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-green-500 text-white';
      case 'available': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'disabled': return 'bg-orange-500 text-white';
      case 'completed': return 'bg-gray-500 text-white';
      case 'closed': return 'bg-gray-400 text-white';
      case 'full': return 'bg-red-500 text-white';
      default: return 'bg-gray-200 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'booked': return 'Booked';
      case 'available': return 'Available';
      case 'disabled': return 'Disabled';
      case 'completed': return 'Completed';
      case 'closed': return 'Closed';
      case 'full': return 'Full';
      default: return 'N/A';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(calendarDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCalendarDate(newDate);
  };

  const clearClientCache = () => {
    console.log('🧹 Clearing client-side cache...');
    
    // Clear localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('booking') || 
        key.includes('schedule') || 
        key.includes('passenger') ||
        key.includes('student') ||
        key.includes('transport')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('booking') || 
        key.includes('schedule') || 
        key.includes('passenger') ||
        key.includes('student') ||
        key.includes('transport')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    // Clear local state
    setBookingStatus(new Map());
    setSchedules([]);
    
    toast.success(`Cleared cache: ${keysToRemove.length + sessionKeysToRemove.length} items removed`);
    
    // Refresh data
    setTimeout(() => {
      if (student?.student_id) {
        fetchInitialData();
      }
    }, 500);
  };

  const loadExistingBookings = async (studentId: string) => {
    if (!studentAllocation?.route.id) {
      console.log('🔍 BOOKING LOAD: No route allocation, skipping booking load');
      return;
    }

    try {
      console.log('🔍 BOOKING LOAD: Loading existing bookings for student:', studentId);
      console.log('🔍 BOOKING LOAD: Route ID:', studentAllocation.route.id);
      
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      const todayStr = formatDateForDatabase(today);
      const nextMonthStr = formatDateForDatabase(nextMonth);

      const apiUrl = `/api/schedules/availability?routeId=${studentAllocation.route.id}&startDate=${todayStr}&endDate=${nextMonthStr}&studentId=${studentId}`;
      console.log('🔍 BOOKING LOAD: API URL:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('🔍 BOOKING LOAD: API error:', response.status);
        const errorText = await response.text();
        console.error('🔍 BOOKING LOAD: Error details:', errorText);
        return;
      }

      const schedulesData = await response.json();
      console.log('🔍 BOOKING LOAD: Received schedules:', schedulesData.length);
      console.log('🔍 BOOKING LOAD: First schedule sample:', schedulesData[0]);

      // Extract only the dates that have valid bookings
      const existingBookings = new Map<string, boolean>();
      let bookingsFound = 0;

      schedulesData.forEach((schedule: any, index: number) => {
        console.log(`🔍 BOOKING LOAD: Schedule ${index + 1}/${schedulesData.length} - Date: ${schedule.schedule_date}, HasBooking: ${!!schedule.user_booking}, BookingData:`, schedule.user_booking);
        
        if (schedule.user_booking && schedule.user_booking.id) {
          const dateString = schedule.schedule_date;
          existingBookings.set(dateString, true);
          bookingsFound++;
          console.log('🔍 BOOKING LOAD: ✅ Found existing booking for date:', dateString, schedule.user_booking);
        } else if (schedule.user_booking) {
          console.log('🔍 BOOKING LOAD: ❌ Invalid booking object (no ID):', schedule.user_booking);
        }
      });

      console.log('🔍 BOOKING LOAD: Total existing bookings found:', bookingsFound);
      console.log('🔍 BOOKING LOAD: Booking dates:', Array.from(existingBookings.keys()));

      // Update local booking status with existing bookings
      if (bookingsFound > 0) {
        setBookingStatus(existingBookings);
        
        // Also update schedules with fresh data to ensure consistency
        const processedSchedules = schedulesData.map((schedule: any) => {
          // Only include userBooking if it has a valid ID
          const validUserBooking = (schedule.user_booking && schedule.user_booking.id) ? schedule.user_booking : null;
          
          return {
            id: schedule.id,
            scheduleDate: createLocalDate(schedule.schedule_date),
            departureTime: schedule.departure_time,
            arrivalTime: schedule.arrival_time,
            availableSeats: schedule.available_seats,
            bookedSeats: schedule.booked_seats,
            totalSeats: schedule.total_seats,
            bookingEnabled: schedule.booking_enabled,
            bookingDeadline: schedule.booking_deadline,
            status: schedule.status,
            isDisabled: schedule.is_disabled, // Maps from API field is_disabled
            isBookingWindowOpen: schedule.is_booking_window_open ?? true,
            isBookingAvailable: schedule.is_booking_available ?? true,
            bookingDisabledReason: schedule.booking_disabled_reason, // Maps from API field booking_disabled_reason
            maxBookingsPerDay: schedule.max_bookings_per_day,
            specialInstructions: schedule.special_instructions,
            userBooking: validUserBooking
          };
        });

        setSchedules(processedSchedules);
        setCalendarKey(prev => prev + 1);
        console.log('🔍 BOOKING LOAD: Updated calendar and schedules with existing bookings');
      } else {
        console.log('🔍 BOOKING LOAD: No existing bookings found - this may be the issue!');
      }

    } catch (error) {
      console.error('🔍 BOOKING LOAD: Error loading existing bookings:', error);
    }
  };

  const testBookingAPI = async () => {
    if (!studentAllocation?.route.id || !student?.student_id) {
      toast.error('Missing route or student data');
      return;
    }

    try {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      const todayStr = formatDateForDatabase(today);
      const nextMonthStr = formatDateForDatabase(nextMonth);

      const apiUrl = `/api/schedules/availability?routeId=${studentAllocation.route.id}&startDate=${todayStr}&endDate=${nextMonthStr}&studentId=${student.student_id}`;
      
      console.log('🔍 API TEST: Testing API URL:', apiUrl);
      console.log('🔍 API TEST: Student ID:', student.student_id);
      console.log('🔍 API TEST: Route ID:', studentAllocation.route.id);
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      
      console.log('🔍 API TEST: Response status:', response.status);
      console.log('🔍 API TEST: Response data:', data);
      
      if (Array.isArray(data)) {
        console.log('🔍 API TEST: Schedule count:', data.length);
        
        // Check each schedule for booking data
        data.forEach((schedule, index) => {
          console.log(`🔍 API TEST: Schedule ${index + 1}:`, {
            id: schedule.id,
            date: schedule.schedule_date,
            hasUserBooking: !!schedule.user_booking,
            userBooking: schedule.user_booking,
            availableSeats: schedule.available_seats,
            bookedSeats: schedule.booked_seats
          });
        });
        
        // Show schedules with bookings
        const schedulesWithBookings = data.filter(s => s.user_booking);
        console.log('🔍 API TEST: Schedules with bookings:', schedulesWithBookings.length);
        
        if (schedulesWithBookings.length > 0) {
          console.log('🔍 API TEST: Detailed booking data:', schedulesWithBookings.map(s => ({
            date: s.schedule_date,
            bookingId: s.user_booking?.id,
            bookingStatus: s.user_booking?.status,
            seatNumber: s.user_booking?.seatNumber
          })));
        }
        
        // Test the date status logic
        const testDate = new Date('2025-07-06'); // Known booked date
        const testDateStr = formatDateForDatabase(testDate);
        const testSchedule = data.find(s => s.schedule_date === testDateStr);
        
        if (testSchedule) {
          console.log('🔍 API TEST: Test date 2025-07-06:', {
            found: true,
            hasBooking: !!testSchedule.user_booking,
            bookingData: testSchedule.user_booking,
            wouldShowAsBooked: !!(testSchedule.user_booking && testSchedule.user_booking.id)
          });
        } else {
          console.log('🔍 API TEST: Test date 2025-07-06 not found in schedules');
        }
        
        toast.success(`API Test Complete - Found ${data.length} schedules, ${schedulesWithBookings.length} with bookings`);
      } else {
        console.error('🔍 API TEST: Invalid response format:', data);
        toast.error('Invalid API response format');
      }
      
    } catch (error) {
      console.error('🔍 API TEST: Error:', error);
      toast.error('API test failed: ' + (error as Error).message);
    }
  };

  const testDirectBookingQuery = async () => {
    if (!student?.student_id) {
      toast.error('Missing student ID');
      return;
    }

    try {
      console.log('🔍 DIRECT TEST: Testing direct booking query for student:', student.student_id);
      
      // Make a direct API call to check raw booking data
      const response = await fetch('/api/debug/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.student_id
        })
      });
      
      const data = await response.json();
      
      console.log('🔍 DIRECT TEST: Direct booking query response:', data);
      
      if (data.bookings) {
        console.log('🔍 DIRECT TEST: Found bookings:', data.bookings.length);
        data.bookings.forEach((booking: any, index: number) => {
          console.log(`🔍 DIRECT TEST: Booking ${index + 1}:`, {
            id: booking.id,
            schedule_id: booking.schedule_id,
            trip_date: booking.trip_date,
            status: booking.status,
            created_at: booking.created_at
          });
        });
      }
      
      toast.success(`Direct query complete - Found ${data.bookings?.length || 0} bookings`);
    } catch (error) {
      console.error('🔍 DIRECT TEST: Error:', error);
      toast.error('Direct query failed: ' + (error as Error).message);
    }
  };

  const testBookingDirectly = async () => {
    if (!student?.student_id) {
      toast.error('Missing student data');
      return;
    }

    try {
      console.log('🔍 DIRECT BOOKING TEST: Testing direct booking verification');
      
      const response = await fetch('/api/debug/booking-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.student_id
        })
      });
      
      const data = await response.json();
      
      console.log('🔍 DIRECT BOOKING TEST: Results:', data);
      
      if (data.success) {
        const { summary } = data;
        console.log('🔍 DIRECT BOOKING TEST: Summary:', summary);
        
        toast.success(`Direct test: ${summary.confirmedBookings} bookings, ${summary.totalSchedules} schedules, ${summary.matches} matches`);
        
        if (data.matchResults.length > 0) {
          console.log('🔍 DIRECT BOOKING TEST: ✅ MATCHES FOUND:', data.matchResults);
        } else {
          console.log('🔍 DIRECT BOOKING TEST: ❌ NO MATCHES - checking why...');
          console.log('🔍 DIRECT BOOKING TEST: Bookings:', data.confirmedBookings.map(b => ({ 
            id: b.id, 
            trip_date: b.trip_date, 
            route_id: b.route_id, 
            schedule_id: b.schedule_id 
          })));
          console.log('🔍 DIRECT BOOKING TEST: Schedules:', data.schedules.map(s => ({ 
            id: s.id, 
            schedule_date: s.schedule_date, 
            route_id: s.route_id 
          })));
        }
      } else {
        toast.error('Direct test failed: ' + data.error);
      }
      
    } catch (error) {
      console.error('🔍 DIRECT BOOKING TEST: Error:', error);
      toast.error('Direct test failed: ' + (error as Error).message);
    }
  };

  const testScheduleDebug = async () => {
    if (!studentAllocation?.route.id || !student?.student_id) {
      toast.error('Missing route or student data');
      return;
    }

    try {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      const todayStr = formatDateForDatabase(today);
      const nextMonthStr = formatDateForDatabase(nextMonth);

      console.log('🔍 SCHEDULE DEBUG: Testing comprehensive schedule debug');
      
      const response = await fetch('/api/debug/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.student_id,
          routeId: studentAllocation.route.id,
          startDate: todayStr,
          endDate: nextMonthStr
        })
      });
      
      const data = await response.json();
      
      console.log('🔍 SCHEDULE DEBUG: Comprehensive analysis:', data);
      
      if (data.success) {
        const { analysis, allSchedules, confirmedBookings, bookingSchedules } = data;
        
        console.log('🔍 SCHEDULE DEBUG: Summary:', {
          totalSchedules: analysis.totalSchedules,
          confirmedBookings: analysis.confirmedBookings,
          bookingSchedules: analysis.bookingSchedules,
          mismatches: analysis.mismatches.length
        });
        
        if (analysis.mismatches.length > 0) {
          console.log('🔍 SCHEDULE DEBUG: ❌ MISMATCHES FOUND:', analysis.mismatches);
          toast.error(`Found ${analysis.mismatches.length} data mismatches - check console`);
        } else {
          console.log('🔍 SCHEDULE DEBUG: ✅ No mismatches found');
        }
        
        // Check specific known booking dates
        const knownBookingDates = ['2025-07-06', '2025-07-08', '2025-07-10', '2025-07-15', '2025-07-16', '2025-07-17', '2025-07-18', '2025-07-23'];
        console.log('🔍 SCHEDULE DEBUG: Checking known booking dates:', knownBookingDates);
        
        knownBookingDates.forEach(date => {
          const hasSchedule = allSchedules.some((s: any) => s.schedule_date === date);
          const hasBooking = confirmedBookings.some((b: any) => b.trip_date === date);
          const hasBookingSchedule = bookingSchedules.some((s: any) => s.schedule_date === date);
          
          console.log(`🔍 SCHEDULE DEBUG: Date ${date}: Schedule=${hasSchedule}, Booking=${hasBooking}, BookingSchedule=${hasBookingSchedule}`);
        });
        
        toast.success(`Debug complete - ${analysis.totalSchedules} schedules, ${analysis.confirmedBookings} bookings, ${analysis.mismatches.length} mismatches`);
      } else {
        toast.error('Debug failed: ' + data.error);
      }
      
    } catch (error) {
      console.error('🔍 SCHEDULE DEBUG: Error:', error);
      toast.error('Debug failed: ' + (error as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg p-6">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!studentAllocation) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg border p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Route Allocation</h2>
          <p className="text-gray-600 mb-4">
            You don't have any route allocation yet. Please contact the administration to get assigned to a route.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Transport Schedule</h1>
          <p className="text-gray-600">Book your daily transport trips</p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Welcome, <span className="font-medium text-gray-900">{student?.student_name}</span>
          </div>
          {lastVerificationTime && (
            <div className="text-xs text-gray-400">
              Last refresh: {lastVerificationTime.toLocaleTimeString()}
            </div>
          )}
          <button
            onClick={async () => {
              // Show loading state
              const loadingToast = toast.loading('Refreshing schedules...');
              
              try {
                // Just refresh route schedules WITHOUT aggressive booking verification
                if (studentAllocation?.route.id && student?.student_id) {
                  await fetchRouteSchedules(studentAllocation.route.id, student.student_id);
                  
                  // Load existing bookings after refreshing schedules
                  setTimeout(() => {
                    loadExistingBookings(student.student_id);
                  }, 500);
                }
                
                // Update refresh time
                setLastVerificationTime(new Date());
                
                // Force calendar update
                setCalendarKey(prev => prev + 1);
                
                toast.dismiss(loadingToast);
                toast.success('Schedules refreshed successfully');
                
              } catch (error) {
                console.error('Manual refresh failed:', error);
                toast.dismiss(loadingToast);
                toast.error('Failed to refresh schedules');
              }
            }}
            disabled={verificationInProgress}
            className={`px-3 py-1 text-sm text-white rounded-lg transition-colors flex items-center space-x-1 ${
              verificationInProgress 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {verificationInProgress ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Refresh</span>
              </>
            ) : (
              <>
                <span>Refresh</span>
              </>
            )}
          </button>





        </div>
      </div>

      {/* Route Information */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Allocated Route</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Route</p>
              <p className="font-medium text-gray-900">{studentAllocation.route.routeNumber}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Boarding Stop</p>
              <p className="font-medium text-gray-900">{studentAllocation.boardingStop.stopName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Departure Time</p>
              <p className="font-medium text-gray-900">{formatTime(studentAllocation.boardingStop.stopTime)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Fare</p>
              <p className="font-medium text-gray-900">{formatCurrency(studentAllocation.route.fare)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="text-sm text-gray-600">
              Detected bookings: {Array.from(bookingStatus.values()).filter(Boolean).length} | 
              Schedules with bookings: {schedules.filter(s => s.userBooking).length}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
            <div key={`passenger-header-${day}-${dayIndex}`} className="p-3 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        <div key={calendarKey} className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, dayIndex) => {
            const dateStatus = day.isCurrentMonth && !day.isPast ? day.status : 'unavailable';
            const statusColor = day.isCurrentMonth && !day.isPast ? getStatusColor(day.status) : 'bg-gray-100 text-gray-400';
            const isDisabled = day.status === 'disabled';
            
            // Get the schedule for this date to determine the specific disable reason
            const dateString = formatDateForDatabase(day.date);
            const schedule = schedules.find(s => {
              const scheduleDateString = formatDateForDatabase(s.scheduleDate);
              return scheduleDateString === dateString;
            });
            
            // Determine the diagonal message based on the actual reason
            let diagonalMessage = 'CANCELLED';
            if (schedule && isDisabled) {
              if (schedule.status === 'cancelled') {
                diagonalMessage = 'CANCELLED';
              } else if (schedule.bookingEnabled === false) {
                diagonalMessage = 'DISABLED';
              } else if (schedule.bookingDisabledReason) {
                // Use first word of reason if it's short
                const reason = schedule.bookingDisabledReason.toUpperCase();
                if (reason.includes('DISABLED')) diagonalMessage = 'DISABLED';
                else if (reason.includes('CANCELLED')) diagonalMessage = 'CANCELLED';
                else if (reason.includes('ADMIN')) diagonalMessage = 'DISABLED';
                else diagonalMessage = 'NOT AVAILABLE';
              }
            }
            
            // Debug logging only for booked dates
            if (day.isCurrentMonth && !day.isPast && day.status === 'booked') {
              const debugDateString = formatDateForDatabase(day.date);
              console.log(`🔍 CALENDAR DEBUG: Booked date ${debugDateString}: status=${day.status}, color=${statusColor}`);
            }
            
            return (
              <button
                key={`passenger-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}-${dayIndex}-${calendarKey}`}
                onClick={() => day.isCurrentMonth && !day.isPast && !isDisabled && handleDateClick(day.date)}
                disabled={!day.isCurrentMonth || day.isPast || isDisabled}
                className={`
                  relative p-3 text-sm rounded-lg transition-all duration-200 min-h-[3rem] flex flex-col items-center justify-center overflow-hidden
                  ${statusColor}
                  ${day.isCurrentMonth && !day.isPast && !isDisabled ? 'cursor-pointer' : 'cursor-not-allowed'}
                  ${day.isToday ? 'ring-2 ring-blue-300' : ''}
                `}
              >
                {/* Diagonal overlay for disabled/cancelled trips */}
                {isDisabled && day.isCurrentMonth && !day.isPast && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Red diagonal lines */}
                    <div 
                      className="absolute w-full h-0.5 bg-red-600 transform rotate-45 opacity-80"
                      style={{ width: '120%' }}
                    ></div>
                    <div 
                      className="absolute w-full h-0.5 bg-red-600 transform -rotate-45 opacity-80"
                      style={{ width: '120%' }}
                    ></div>
                    {/* Diagonal message */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-700 bg-white bg-opacity-95 px-1 py-0.5 rounded transform -rotate-12 shadow-md border border-red-300">
                        {diagonalMessage}
                      </span>
                    </div>
                  </div>
                )}
                
                <span className="font-medium relative z-10">{day.date.getDate()}</span>
                {day.isCurrentMonth && !day.isPast && (
                  <span className="text-xs mt-1 relative z-10">{getStatusText(day.status)}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Calendar Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Booked</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-sm text-gray-600">Disabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-sm text-gray-600">Booking Closed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">Full</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Booking Process:</strong> Click on blue (available) dates to book your trip. 
              Green dates show your existing bookings - click to view your ticket.
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-800">
              <strong>Manual Refresh:</strong> Use the "Sync" button to refresh schedules. 
              No automatic booking - all bookings require your confirmation.
            </p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-700">
            <strong>Status Guide:</strong> 
            <span className="text-orange-600"> Disabled</span> - Administration restricted. 
            <span className="text-gray-600"> Closed</span> - Booking window expired. 
            <span className="text-red-600"> Full</span> - No seats available.
          </p>
          <p className="text-xs text-gray-700 mt-2">
            <strong>Visual Indicators:</strong>
            <span className="text-red-600"> Red diagonal lines with "CANCELLED" or "DISABLED"</span> - Trip unavailable due to admin action.
          </p>
          {lastVerificationTime && (
            <p className="text-xs text-blue-600 mt-1">
              Last refreshed: {lastVerificationTime.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Boarding Pass Modal */}
      <BoardingPass
        isOpen={showBoardingPass}
        onClose={() => setShowBoardingPass(false)}
        booking={selectedBooking}
      />

      {/* Booking Confirmation Modal */}
      <BookingConfirmationModal
        isOpen={showBookingConfirmation}
        onClose={handleCancelBooking}
        onConfirm={handleConfirmBooking}
        schedule={pendingBooking}
        student={student}
        allocation={studentAllocation}
      />
    </div>
  );
} 
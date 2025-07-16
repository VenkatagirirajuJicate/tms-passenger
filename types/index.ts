// Passenger Application Types

// User and Authentication Types
export interface Student {
  id: string;
  studentName: string;
  rollNumber: string;
  email: string;
  mobile: string;
  passwordHash?: string;
  dateOfBirth?: Date;
  gender?: string;
  fatherName?: string;
  motherName?: string;
  address?: string;
  addressStreet?: string;
  addressDistrict?: string;
  addressState?: string;
  addressPinCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  academicYear?: number;
  semester?: number;
  firstLoginCompleted: boolean;
  profileCompletionPercentage: number;
  lastLogin?: Date;
  department?: {
    id: string;
    departmentName: string;
  };
  program?: {
    id: string;
    programName: string;
    degreeName: string;
  };
  institution?: {
    id: string;
    name: string;
  };
  transportProfile?: StudentTransportProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentTransportProfile {
  id: string;
  studentId: string;
  allocatedRouteId?: string;
  boardingPoint?: string;
  transportStatus: 'active' | 'inactive' | 'suspended';
  paymentStatus: 'current' | 'overdue' | 'suspended';
  enrollmentStatus: 'pending' | 'approved' | 'rejected' | 'enrolled';
  totalFines: number;
  outstandingAmount: number;
  semesterFeePaid: boolean;
  registrationFeePaid: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Route Types
export interface Route {
  id: string;
  routeNumber: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  startLatitude?: number;
  startLongitude?: number;
  endLatitude?: number;
  endLongitude?: number;
  departureTime: string;
  arrivalTime: string;
  distance: number;
  duration: string;
  totalCapacity: number;
  currentPassengers: number;
  status: 'active' | 'inactive' | 'maintenance';
  driverId?: string;
  vehicleId?: string;
  stops: RouteStop[];
  fare: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteStop {
  id: string;
  routeId: string;
  stopName: string;
  stopTime: string;
  sequenceOrder: number;
  latitude?: number;
  longitude?: number;
  isMajorStop: boolean;
  createdAt: Date;
}

// Driver Types
export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  email?: string;
  experienceYears: number;
  rating: number;
  totalTrips: number;
  status: 'active' | 'inactive' | 'on_leave';
  createdAt: Date;
}

// Vehicle Types
export interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  capacity: number;
  fuelType: 'diesel' | 'petrol' | 'electric' | 'cng';
  status: 'active' | 'maintenance' | 'retired';
  createdAt: Date;
}

// Schedule Types
export interface Schedule {
  id: string;
  routeId: string;
  scheduleDate: Date;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  bookedSeats: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  driverId: string;
  vehicleId: string;
  route?: Route;
  driver?: Driver;
  vehicle?: Vehicle;
  createdAt: Date;
}

// Booking Types
export interface Booking {
  id: string;
  studentId: string;
  routeId: string;
  scheduleId: string;
  bookingDate: Date;
  tripDate: Date;
  boardingStop: string;
  seatNumber?: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  paymentStatus: 'paid' | 'pending' | 'refunded';
  amount: number;
  qrCode?: string;
  specialRequirements?: string;
  route?: Route;
  schedule?: Schedule;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Types
export interface Payment {
  id: string;
  studentId: string;
  bookingId?: string;
  amount: number;
  paymentType: 'trip_fare' | 'fine' | 'semester_fee' | 'registration';
  paymentMethod: 'cash' | 'upi' | 'card' | 'net_banking' | 'wallet';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  transactionId?: string;
  description: string;
  receiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  category: 'transport' | 'payment' | 'system' | 'emergency';
  targetAudience: 'all' | 'students' | 'drivers' | 'admins';
  specificUsers?: string[];
  isActive: boolean;
  scheduledAt?: Date;
  expiresAt?: Date;
  enablePushNotification: boolean;
  enableEmailNotification: boolean;
  enableSmsNotification: boolean;
  actionable: boolean;
  primaryAction?: any;
  secondaryAction?: any;
  readBy?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Grievance Types
export interface Grievance {
  id: string;
  studentId: string;
  routeId?: string;
  driverName?: string;
  category: 'complaint' | 'suggestion' | 'compliment' | 'technical_issue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  admin_users?: {
    id: string;
    name: string;
    role: string;
    email: string;
  };
  resolution?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Attendance Types
export interface Attendance {
  id: string;
  studentId: string;
  routeId: string;
  scheduleId: string;
  attendanceDate: Date;
  boardingTime?: Date;
  alightingTime?: Date;
  status: string;
  markedBy?: string;
  createdAt: Date;
}

// Dashboard Types
export interface StudentDashboardData {
  profile: Student;
  upcomingBookings: Booking[];
  recentPayments: Payment[];
  notifications: Notification[];
  transportStatus: {
    hasActiveRoute: boolean;
    routeInfo?: Route;
    pendingPayments: number;
    totalFines: number;
    lastTripDate?: Date;
  };
  quickStats: {
    totalTrips: number;
    totalSpent: number;
    upcomingTrips: number;
    activeGrievances: number;
  };
}

// Student Route Allocation Types
export interface StudentAllocation {
  route: Route | null;
  boardingStop: RouteStop | null;
  allocation: {
    id: string;
    allocatedAt: Date;
    isActive: boolean;
  } | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Form Types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface FirstLoginFormData {
  email: string;
  dateOfBirth: string;
  newPassword: string;
  confirmPassword: string;
}

export interface BookingFormData {
  routeId: string;
  scheduleId: string;
  tripDate: string;
  boardingStop: string;
  specialRequirements?: string;
}

export interface GrievanceFormData {
  routeId?: string;
  driverName?: string;
  category: Grievance['category'];
  priority: Grievance['priority'];
  subject: string;
  description: string;
}

export interface ProfileUpdateFormData {
  mobile?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  fatherName?: string;
  motherName?: string;
}

export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Filter Types
export interface BookingFilters {
  status?: Booking['status'];
  routeId?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentStatus?: Booking['paymentStatus'];
}

export interface PaymentFilters {
  status?: Payment['status'];
  paymentType?: Payment['paymentType'];
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
}

// Utility Types
export type AuthUser = {
  id: string;
  email: string;
  student: Student;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

// Navigation Types
export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current: boolean;
  badge?: number;
}

export interface TabItem {
  id: string;
  name: string;
  icon?: any;
  current: boolean;
} 
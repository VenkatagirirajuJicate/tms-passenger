import { type ClassValue, clsx } from "clsx";
import { format, isValid, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Date formatting utilities
export function formatDate(date: Date | string | null | undefined, formatStr = "MMM dd, yyyy"): string {
  if (!date) return "N/A";
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return "Invalid Date";
    return format(parsedDate, formatStr);
  } catch {
    return "Invalid Date";
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "N/A";
  
  try {
    // Assuming time is in HH:mm format
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return format(date, "h:mm a");
  } catch {
    return time;
  }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) return "Invalid Date";
    return format(parsedDate, "MMM dd, yyyy 'at' h:mm a");
  } catch {
    return "Invalid Date";
  }
}

// Currency formatting
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "₹0.00";
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

// String utilities
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

export function capitalizeFirst(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function capitalizeWords(text: string): string {
  if (!text) return "";
  return text.split(' ').map(word => capitalizeFirst(word)).join(' ');
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return isValid(date);
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Status badge utilities
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Booking statuses
    confirmed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-blue-100 text-blue-800",
    no_show: "bg-gray-100 text-gray-800",
    
    // Payment statuses
    paid: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-purple-100 text-purple-800",
    
    // Transport statuses
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    suspended: "bg-red-100 text-red-800",
    
    // Payment status
    current: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    
    // Grievance statuses
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    closed: "bg-gray-100 text-gray-800",
    
    // Priority levels
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  
  return statusColors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}

export function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    confirmed: "Confirmed",
    pending: "Pending",
    cancelled: "Cancelled",
    completed: "Completed",
    no_show: "No Show",
    paid: "Paid",
    failed: "Failed",
    refunded: "Refunded",
    active: "Active",
    inactive: "Inactive",
    suspended: "Suspended",
    current: "Current",
    overdue: "Overdue",
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
  };
  
  return statusTexts[status.toLowerCase()] || capitalizeFirst(status);
}

// Notification utilities
export function getNotificationIcon(type: string): string {
  const icons: Record<string, string> = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    transport: "🚌",
    payment: "💳",
    system: "⚙️",
    emergency: "🚨",
  };
  
  return icons[type.toLowerCase()] || "📢";
}

// URL utilities
export function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Local storage utilities
export function getFromStorage(key: string, defaultValue: unknown = null): unknown {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item);
  } catch {
    return defaultValue;
  }
}

export function setToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

// Error handling utilities
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  if (error && typeof error === 'object' && 'error_description' in error) {
    return (error as { error_description: string }).error_description;
  }
  if (error && typeof error === 'object' && 'details' in error) {
    return (error as { details: string }).details;
  }
  return 'An unexpected error occurred';
}

// File utilities
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Device detection
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

export function isTablet(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

export function isDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1024;
}

// Date utilities to handle timezone issues consistently
export class DateUtils {
  /**
   * Get local date string in YYYY-MM-DD format without timezone conversion
   */
  static toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse date string and return local date object
   */
  static fromLocalDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get today's date in local timezone as string
   */
  static getTodayString(): string {
    return this.toLocalDateString(new Date());
  }

  /**
   * Get tomorrow's date in local timezone as string
   */
  static getTomorrowString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.toLocalDateString(tomorrow);
  }

  /**
   * Add days to a date and return the new date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Check if two dates are the same day (ignoring time)
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return this.toLocalDateString(date1) === this.toLocalDateString(date2);
  }

  /**
   * Format date for display
   */
  static formatDisplayDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Format time for display
   */
  static formatDisplayTime(timeString: string): string {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Get the start of month date
   */
  static getStartOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get the end of month date
   */
  static getEndOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * Check if a date is in the past (compared to today)
   */
  static isPastDate(date: Date): boolean {
    const today = new Date();
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  /**
   * Check if a date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  /**
   * Check if a date is tomorrow
   */
  static isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.isSameDay(date, tomorrow);
  }
} 
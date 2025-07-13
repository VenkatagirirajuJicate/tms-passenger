// Date Utility Functions - Use these for consistent date handling

export function createLocalDate(dateString: string): Date {
  // Create a date object that represents the local date regardless of timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

export function formatDateForDatabase(date: Date): string {
  // Format date as YYYY-MM-DD for database storage
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(date: Date): string {
  // Format date for display in UI
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function isSameDate(date1: Date, date2: Date): boolean {
  // Compare two dates ignoring time
  return formatDateForDatabase(date1) === formatDateForDatabase(date2);
}

export function compareDateWithSchedule(calendarDate: Date, scheduleDate: string): boolean {
  // Compare calendar date with schedule date string from database
  return formatDateForDatabase(calendarDate) === scheduleDate;
}

export function compareDateWithScheduleDate(calendarDate: Date, scheduleDate: Date): boolean {
  // Compare calendar date with schedule date object (when schedule_date is converted to Date)
  return formatDateForDatabase(calendarDate) === formatDateForDatabase(scheduleDate);
}

export function getCurrentDateString(): string {
  // Get current date as YYYY-MM-DD string
  return formatDateForDatabase(new Date());
}

export function addDays(date: Date, days: number): Date {
  // Add days to a date
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  // Add months to a date
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Enhanced cutoff time functions for booking restrictions
export interface BookingCutoffSettings {
  enableBookingTimeWindow: boolean;
  bookingWindowEndHour: number;
  bookingWindowDaysBefore: number;
}

// Global settings cache
let cachedSettings: BookingCutoffSettings | null = null;
let settingsCache_timestamp: number = 0;
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute for faster updates

export async function fetchAdminSettings(): Promise<BookingCutoffSettings> {
  // Check if cached settings are still valid
  const now = Date.now();
  if (cachedSettings && (now - settingsCache_timestamp) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      const data = await response.json();
      cachedSettings = {
        enableBookingTimeWindow: data.settings.enableBookingTimeWindow,
        bookingWindowEndHour: data.settings.bookingWindowEndHour,
        bookingWindowDaysBefore: data.settings.bookingWindowDaysBefore
      };
      settingsCache_timestamp = now;
      return cachedSettings;
    } else {
      console.error('Failed to fetch admin settings, using defaults');
    }
  } catch (error) {
    console.error('Error fetching admin settings:', error);
  }

  // Fallback to default settings
  const defaultSettings = getDefaultCutoffSettings();
  cachedSettings = defaultSettings;
  settingsCache_timestamp = now;
  return defaultSettings;
}

export function getDefaultCutoffSettings(): BookingCutoffSettings {
  return {
    enableBookingTimeWindow: true,
    bookingWindowEndHour: 19,    // 7 PM cutoff
    bookingWindowDaysBefore: 1   // 1 day before trip
  };
}

export function clearSettingsCache() {
  cachedSettings = null;
  settingsCache_timestamp = 0;
}

export async function isWithinBookingCutoffTime(
  tripDate: Date, 
  currentTime: Date = new Date(),
  settings?: BookingCutoffSettings
): Promise<{ 
  allowed: boolean; 
  reason?: string;
  nextBookingWindow?: { date: string; endTime: string };
}> {
  // Use provided settings or fetch from admin
  const cutoffSettings = settings || await fetchAdminSettings();
  
  if (!cutoffSettings.enableBookingTimeWindow) {
    return { allowed: true };
  }

  // Calculate the booking cutoff (cutoff time on the day before the trip)
  const cutoffDate = new Date(tripDate);
  cutoffDate.setDate(tripDate.getDate() - cutoffSettings.bookingWindowDaysBefore);
  cutoffDate.setHours(cutoffSettings.bookingWindowEndHour, 0, 0, 0);
  
  // Check if current time is before the cutoff
  if (currentTime <= cutoffDate) {
    return { allowed: true };
  }

  // Booking deadline has passed
  const nextWindow = {
    date: formatDateForDisplay(cutoffDate),
    endTime: formatHour(cutoffSettings.bookingWindowEndHour)
  };
  
  const daysBefore = cutoffSettings.bookingWindowDaysBefore === 1 ? 'the day before' : `${cutoffSettings.bookingWindowDaysBefore} days before`;
  
  return {
    allowed: false,
    reason: `Booking deadline has passed. You could book this trip anytime until ${nextWindow.endTime} on ${nextWindow.date} (${daysBefore} the trip).`,
    nextBookingWindow: nextWindow
  };
}

export function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}

export async function getBookingWindowInfo(
  tripDate: Date,
  settings?: BookingCutoffSettings
): Promise<{
  cutoffDate: Date;
  cutoffDateStr: string;
  endTime: string;
  isPastBookingDeadline: boolean;
  canBookNow: boolean;
}> {
  // Use provided settings or fetch from admin
  const cutoffSettings = settings || await fetchAdminSettings();
  
  const cutoffDate = new Date(tripDate);
  cutoffDate.setDate(tripDate.getDate() - cutoffSettings.bookingWindowDaysBefore);
  cutoffDate.setHours(cutoffSettings.bookingWindowEndHour, 0, 0, 0);
  
  const now = new Date();
  const isPastBookingDeadline = now > cutoffDate;
  const canBookNow = !isPastBookingDeadline;
  
  return {
    cutoffDate,
    cutoffDateStr: formatDateForDisplay(cutoffDate),
    endTime: formatHour(cutoffSettings.bookingWindowEndHour),
    isPastBookingDeadline,
    canBookNow
  };
}

export async function canBookTrip(tripDate: Date, currentTime: Date = new Date()): Promise<{
  canBook: boolean;
  reason?: string;
  bookingWindow?: string;
}> {
  const bookingInfo = await getBookingWindowInfo(tripDate);
  console.log('Booking check at:', currentTime); // Log the current time for debugging
  
  if (bookingInfo.isPastBookingDeadline) {
    return {
      canBook: false,
      reason: `Booking deadline has passed. You could book this trip anytime until ${bookingInfo.endTime} on ${bookingInfo.cutoffDateStr}.`,
      bookingWindow: `Until ${bookingInfo.endTime} on ${bookingInfo.cutoffDateStr}`
    };
  }
  
  return { 
    canBook: true,
    bookingWindow: `Until ${bookingInfo.endTime} on ${bookingInfo.cutoffDateStr}`
  };
} 
import {
  cn,
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  truncateText,
  capitalizeFirst,
  capitalizeWords,
  isValidEmail,
  isValidPhone,
  isValidDate,
  validatePassword,
  getStatusColor,
  getStatusText,
  getNotificationIcon,
  buildQueryString,
  getFromStorage,
  setToStorage,
  removeFromStorage,
  getErrorMessage,
  formatFileSize,
  debounce,
  isMobile,
  isTablet,
  isDesktop,
  DateUtils,
} from '../../lib/utils';

// Mock localStorage for testing
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window for device detection tests
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
});

describe('General Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cn (className utility)', () => {
    test('combines class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', { bar: true })).toBe('foo bar');
      expect(cn('foo', { bar: false })).toBe('foo');
      expect(cn('foo', undefined, 'bar')).toBe('foo bar');
    });

    test('handles empty inputs', () => {
      expect(cn()).toBe('');
      expect(cn('')).toBe('');
      expect(cn(null, undefined)).toBe('');
    });
  });

  describe('Date Formatting', () => {
    test('formatDate formats dates correctly', () => {
      const date = new Date('2023-12-25T10:30:00');
      expect(formatDate(date)).toBe('Dec 25, 2023');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2023-12-25');
      expect(formatDate('2023-12-25T10:30:00')).toBe('Dec 25, 2023');
    });

    test('formatDate handles invalid inputs', () => {
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate(undefined)).toBe('N/A');
      expect(formatDate('invalid-date')).toBe('Invalid Date');
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });

    test('formatTime formats time correctly', () => {
      expect(formatTime('14:30')).toBe('2:30 PM');
      expect(formatTime('09:00')).toBe('9:00 AM');
      expect(formatTime('00:00')).toBe('12:00 AM');
    });

    test('formatTime handles invalid inputs', () => {
      expect(formatTime(null)).toBe('N/A');
      expect(formatTime(undefined)).toBe('N/A');
      expect(formatTime('invalid-time')).toBe('invalid-time');
    });

    test('formatDateTime formats date and time correctly', () => {
      const date = new Date('2023-12-25T14:30:00');
      expect(formatDateTime(date)).toBe('Dec 25, 2023 at 2:30 PM');
      expect(formatDateTime('2023-12-25T14:30:00')).toBe('Dec 25, 2023 at 2:30 PM');
    });

    test('formatDateTime handles invalid inputs', () => {
      expect(formatDateTime(null)).toBe('N/A');
      expect(formatDateTime(undefined)).toBe('N/A');
      expect(formatDateTime('invalid-date')).toBe('Invalid Date');
    });
  });

  describe('Currency Formatting', () => {
    test('formatCurrency formats amounts correctly', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(1000.5)).toBe('₹1,000.50');
      expect(formatCurrency(0)).toBe('₹0.00');
    });

    test('formatCurrency handles null/undefined', () => {
      expect(formatCurrency(null)).toBe('₹0.00');
      expect(formatCurrency(undefined)).toBe('₹0.00');
    });
  });

  describe('String Utilities', () => {
    test('truncateText truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
      expect(truncateText('Short text', 20)).toBe('Short text');
      expect(truncateText('', 20)).toBe('');
    });

    test('capitalizeFirst capitalizes first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('HELLO')).toBe('Hello');
      expect(capitalizeFirst('')).toBe('');
      expect(capitalizeFirst('h')).toBe('H');
    });

    test('capitalizeWords capitalizes each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
      expect(capitalizeWords('')).toBe('');
      expect(capitalizeWords('single')).toBe('Single');
    });
  });

  describe('Validation Utilities', () => {
    test('isValidEmail validates email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    test('isValidPhone validates Indian phone numbers', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('8123456789')).toBe(true);
      expect(isValidPhone('7 234 567 890')).toBe(true); // with spaces
      expect(isValidPhone('1234567890')).toBe(false); // doesn't start with 6-9
      expect(isValidPhone('98765432')).toBe(false); // too short
      expect(isValidPhone('98765432100')).toBe(false); // too long
      expect(isValidPhone('')).toBe(false);
    });

    test('isValidDate validates date strings', () => {
      expect(isValidDate('2023-12-25')).toBe(true);
      expect(isValidDate('2023-12-25T10:30:00')).toBe(true);
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('')).toBe(false);
    });

    test('validatePassword validates password strength', () => {
      const strong = validatePassword('MyPassword123!');
      expect(strong.isValid).toBe(true);
      expect(strong.errors).toEqual([]);

      const weak = validatePassword('weak');
      expect(weak.isValid).toBe(false);
      expect(weak.errors).toContain('Password must be at least 8 characters long');
      expect(weak.errors).toContain('Password must contain at least one uppercase letter');
      expect(weak.errors).toContain('Password must contain at least one number');
      expect(weak.errors).toContain('Password must contain at least one special character');

      const noSpecial = validatePassword('MyPassword123');
      expect(noSpecial.isValid).toBe(false);
      expect(noSpecial.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('Status Utilities', () => {
    test('getStatusColor returns correct classes', () => {
      expect(getStatusColor('confirmed')).toBe('bg-green-100 text-green-800');
      expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800');
      expect(getStatusColor('cancelled')).toBe('bg-red-100 text-red-800');
      expect(getStatusColor('unknown')).toBe('bg-gray-100 text-gray-800');
    });

    test('getStatusText returns correct text', () => {
      expect(getStatusText('confirmed')).toBe('Confirmed');
      expect(getStatusText('in_progress')).toBe('In Progress');
      expect(getStatusText('unknown')).toBe('Unknown');
      expect(getStatusText('PENDING')).toBe('Pending');
    });

    test('getNotificationIcon returns correct icons', () => {
      expect(getNotificationIcon('success')).toBe('✅');
      expect(getNotificationIcon('error')).toBe('❌');
      expect(getNotificationIcon('warning')).toBe('⚠️');
      expect(getNotificationIcon('unknown')).toBe('📢');
    });
  });

  describe('URL Utilities', () => {
    test('buildQueryString builds query strings correctly', () => {
      expect(buildQueryString({})).toBe('');
      expect(buildQueryString({ name: 'John', age: 30 })).toBe('?name=John&age=30');
      expect(buildQueryString({ name: 'John', age: null, active: true })).toBe('?name=John&active=true');
      expect(buildQueryString({ name: '', age: undefined })).toBe('');
    });
  });

  describe('Local Storage Utilities', () => {
    test('getFromStorage retrieves and parses data', () => {
      mockLocalStorage.getItem.mockReturnValue('{"name":"John","age":30}');
      expect(getFromStorage('user')).toEqual({ name: 'John', age: 30 });

      mockLocalStorage.getItem.mockReturnValue(null);
      expect(getFromStorage('user', 'default')).toBe('default');

      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      expect(getFromStorage('user', 'default')).toBe('default');
    });

    test('setToStorage stores data as JSON', () => {
      setToStorage('user', { name: 'John', age: 30 });
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', '{"name":"John","age":30}');
    });

    test('removeFromStorage removes data', () => {
      removeFromStorage('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });

    test('handles storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      setToStorage('user', { name: 'John' });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save to localStorage:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling Utilities', () => {
    test('getErrorMessage extracts error messages', () => {
      expect(getErrorMessage('Simple error')).toBe('Simple error');
      expect(getErrorMessage(new Error('Error object'))).toBe('Error object');
      expect(getErrorMessage({ message: 'Object with message' })).toBe('Object with message');
      expect(getErrorMessage({ error_description: 'Auth error' })).toBe('Auth error');
      expect(getErrorMessage({ details: 'Error details' })).toBe('Error details');
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
    });
  });

  describe('File Utilities', () => {
    test('formatFileSize formats file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('Debounce Utility', () => {
    test('debounce delays function execution', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      expect(mockFn).not.toHaveBeenCalled();

      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('arg3');
        done();
      }, 150);
    });
  });

  describe('Device Detection', () => {
    test('isMobile detects mobile devices', () => {
      window.innerWidth = 500;
      expect(isMobile()).toBe(true);
      
      window.innerWidth = 1000;
      expect(isMobile()).toBe(false);
    });

    test('isTablet detects tablet devices', () => {
      window.innerWidth = 800;
      expect(isTablet()).toBe(true);
      
      window.innerWidth = 500;
      expect(isTablet()).toBe(false);
      
      window.innerWidth = 1200;
      expect(isTablet()).toBe(false);
    });

    test('isDesktop detects desktop devices', () => {
      window.innerWidth = 1200;
      expect(isDesktop()).toBe(true);
      
      window.innerWidth = 800;
      expect(isDesktop()).toBe(false);
    });
  });

  describe('DateUtils Class', () => {
    test('toLocalDateString formats dates correctly', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      expect(DateUtils.toLocalDateString(date)).toBe('2023-12-25');
    });

    test('fromLocalDateString parses date strings correctly', () => {
      const date = DateUtils.fromLocalDateString('2023-12-25');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(11); // December is month 11
      expect(date.getDate()).toBe(25);
    });

    test('getTodayString returns today\'s date', () => {
      const today = new Date();
      const expectedString = DateUtils.toLocalDateString(today);
      expect(DateUtils.getTodayString()).toBe(expectedString);
    });

    test('getTomorrowString returns tomorrow\'s date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedString = DateUtils.toLocalDateString(tomorrow);
      expect(DateUtils.getTomorrowString()).toBe(expectedString);
    });

    test('addDays adds days correctly', () => {
      const date = new Date(2023, 11, 25);
      const newDate = DateUtils.addDays(date, 5);
      expect(newDate.getDate()).toBe(30);
      expect(newDate.getMonth()).toBe(11);
      expect(newDate.getFullYear()).toBe(2023);
    });

    test('isSameDay compares dates correctly', () => {
      const date1 = new Date(2023, 11, 25, 10, 30);
      const date2 = new Date(2023, 11, 25, 15, 45);
      const date3 = new Date(2023, 11, 26, 10, 30);
      
      expect(DateUtils.isSameDay(date1, date2)).toBe(true);
      expect(DateUtils.isSameDay(date1, date3)).toBe(false);
    });

    test('formatDisplayDate formats dates for display', () => {
      const date = new Date(2023, 11, 25);
      const formatted = DateUtils.formatDisplayDate(date);
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
    });

    test('formatDisplayTime formats time for display', () => {
      expect(DateUtils.formatDisplayTime('14:30')).toBe('02:30 PM');
      expect(DateUtils.formatDisplayTime('09:00')).toBe('09:00 AM');
    });

    test('getStartOfMonth returns first day of month', () => {
      const date = new Date(2023, 11, 25);
      const startOfMonth = DateUtils.getStartOfMonth(date);
      expect(startOfMonth.getDate()).toBe(1);
      expect(startOfMonth.getMonth()).toBe(11);
      expect(startOfMonth.getFullYear()).toBe(2023);
    });

    test('getEndOfMonth returns last day of month', () => {
      const date = new Date(2023, 11, 25);
      const endOfMonth = DateUtils.getEndOfMonth(date);
      expect(endOfMonth.getDate()).toBe(31);
      expect(endOfMonth.getMonth()).toBe(11);
      expect(endOfMonth.getFullYear()).toBe(2023);
    });

    test('isPastDate checks if date is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(DateUtils.isPastDate(yesterday)).toBe(true);
      expect(DateUtils.isPastDate(tomorrow)).toBe(false);
    });

    test('isToday checks if date is today', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(DateUtils.isToday(today)).toBe(true);
      expect(DateUtils.isToday(tomorrow)).toBe(false);
    });

    test('isTomorrow checks if date is tomorrow', () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(DateUtils.isTomorrow(today)).toBe(false);
      expect(DateUtils.isTomorrow(tomorrow)).toBe(true);
    });
  });
}); 
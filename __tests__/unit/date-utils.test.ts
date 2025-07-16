import {
  createLocalDate,
  formatDateForDatabase,
  formatDateForDisplay,
  isSameDate,
  compareDateWithSchedule,
  compareDateWithScheduleDate,
  getCurrentDateString,
  addDays,
} from '../../lib/date-utils';

describe('Date Utility Functions', () => {
  describe('createLocalDate', () => {
    test('creates date from date string correctly', () => {
      const date = createLocalDate('2023-12-25');
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(11); // December is month 11
      expect(date.getDate()).toBe(25);
    });

    test('handles different date formats', () => {
      const date1 = createLocalDate('2023-01-01');
      expect(date1.getFullYear()).toBe(2023);
      expect(date1.getMonth()).toBe(0); // January is month 0
      expect(date1.getDate()).toBe(1);

      const date2 = createLocalDate('2023-12-31');
      expect(date2.getFullYear()).toBe(2023);
      expect(date2.getMonth()).toBe(11); // December is month 11
      expect(date2.getDate()).toBe(31);
    });

    test('creates date without timezone conversion', () => {
      const date = createLocalDate('2023-06-15');
      // The date should be exactly June 15, 2023 in local timezone
      expect(date.getFullYear()).toBe(2023);
      expect(date.getMonth()).toBe(5); // June is month 5
      expect(date.getDate()).toBe(15);
    });
  });

  describe('formatDateForDatabase', () => {
    test('formats date for database storage', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      expect(formatDateForDatabase(date)).toBe('2023-12-25');
    });

    test('pads single digit months and days', () => {
      const date = new Date(2023, 0, 5); // January 5, 2023
      expect(formatDateForDatabase(date)).toBe('2023-01-05');
    });

    test('handles different dates correctly', () => {
      const date1 = new Date(2023, 5, 1); // June 1, 2023
      expect(formatDateForDatabase(date1)).toBe('2023-06-01');

      const date2 = new Date(2023, 11, 31); // December 31, 2023
      expect(formatDateForDatabase(date2)).toBe('2023-12-31');
    });

    test('formats leap year dates correctly', () => {
      const leapDate = new Date(2024, 1, 29); // February 29, 2024 (leap year)
      expect(formatDateForDatabase(leapDate)).toBe('2024-02-29');
    });
  });

  describe('formatDateForDisplay', () => {
    test('formats date for display', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      const formatted = formatDateForDisplay(date);
      expect(formatted).toContain('December');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
    });

    test('formats different months correctly', () => {
      const janDate = new Date(2023, 0, 1); // January 1, 2023
      const janFormatted = formatDateForDisplay(janDate);
      expect(janFormatted).toContain('January');

      const junDate = new Date(2023, 5, 15); // June 15, 2023
      const junFormatted = formatDateForDisplay(junDate);
      expect(junFormatted).toContain('June');
    });

    test('uses consistent formatting', () => {
      const date = new Date(2023, 0, 1); // January 1, 2023
      const formatted = formatDateForDisplay(date);
      // Should follow the format: "Month Day, Year"
      expect(formatted).toMatch(/^[A-Za-z]+ \d{1,2}, \d{4}$/);
    });
  });

  describe('isSameDate', () => {
    test('returns true for same dates', () => {
      const date1 = new Date(2023, 11, 25, 10, 30, 0); // December 25, 2023, 10:30 AM
      const date2 = new Date(2023, 11, 25, 15, 45, 0); // December 25, 2023, 3:45 PM
      expect(isSameDate(date1, date2)).toBe(true);
    });

    test('returns false for different dates', () => {
      const date1 = new Date(2023, 11, 25); // December 25, 2023
      const date2 = new Date(2023, 11, 26); // December 26, 2023
      expect(isSameDate(date1, date2)).toBe(false);
    });

    test('ignores time components', () => {
      const date1 = new Date(2023, 11, 25, 0, 0, 0); // December 25, 2023, midnight
      const date2 = new Date(2023, 11, 25, 23, 59, 59); // December 25, 2023, 11:59 PM
      expect(isSameDate(date1, date2)).toBe(true);
    });

    test('handles different months correctly', () => {
      const date1 = new Date(2023, 10, 30); // November 30, 2023
      const date2 = new Date(2023, 11, 1); // December 1, 2023
      expect(isSameDate(date1, date2)).toBe(false);
    });

    test('handles different years correctly', () => {
      const date1 = new Date(2023, 11, 31); // December 31, 2023
      const date2 = new Date(2024, 0, 1); // January 1, 2024
      expect(isSameDate(date1, date2)).toBe(false);
    });
  });

  describe('compareDateWithSchedule', () => {
    test('compares calendar date with schedule date string', () => {
      const calendarDate = new Date(2023, 11, 25); // December 25, 2023
      const scheduleDate = '2023-12-25';
      expect(compareDateWithSchedule(calendarDate, scheduleDate)).toBe(true);
    });

    test('returns false for different dates', () => {
      const calendarDate = new Date(2023, 11, 25); // December 25, 2023
      const scheduleDate = '2023-12-26';
      expect(compareDateWithSchedule(calendarDate, scheduleDate)).toBe(false);
    });

    test('handles month and year boundaries', () => {
      const calendarDate = new Date(2023, 11, 31); // December 31, 2023
      const scheduleDate1 = '2023-12-31';
      const scheduleDate2 = '2024-01-01';
      
      expect(compareDateWithSchedule(calendarDate, scheduleDate1)).toBe(true);
      expect(compareDateWithSchedule(calendarDate, scheduleDate2)).toBe(false);
    });

    test('ignores time components of calendar date', () => {
      const calendarDate = new Date(2023, 11, 25, 14, 30, 0); // December 25, 2023, 2:30 PM
      const scheduleDate = '2023-12-25';
      expect(compareDateWithSchedule(calendarDate, scheduleDate)).toBe(true);
    });
  });

  describe('compareDateWithScheduleDate', () => {
    test('compares two date objects', () => {
      const calendarDate = new Date(2023, 11, 25); // December 25, 2023
      const scheduleDate = new Date(2023, 11, 25); // December 25, 2023
      expect(compareDateWithScheduleDate(calendarDate, scheduleDate)).toBe(true);
    });

    test('returns false for different dates', () => {
      const calendarDate = new Date(2023, 11, 25); // December 25, 2023
      const scheduleDate = new Date(2023, 11, 26); // December 26, 2023
      expect(compareDateWithScheduleDate(calendarDate, scheduleDate)).toBe(false);
    });

    test('ignores time components of both dates', () => {
      const calendarDate = new Date(2023, 11, 25, 9, 0, 0); // December 25, 2023, 9:00 AM
      const scheduleDate = new Date(2023, 11, 25, 17, 30, 0); // December 25, 2023, 5:30 PM
      expect(compareDateWithScheduleDate(calendarDate, scheduleDate)).toBe(true);
    });

    test('handles timezone differences correctly', () => {
      // Both dates should be treated as local dates
      const calendarDate = new Date(2023, 11, 25, 0, 0, 0);
      const scheduleDate = new Date(2023, 11, 25, 23, 59, 59);
      expect(compareDateWithScheduleDate(calendarDate, scheduleDate)).toBe(true);
    });
  });

  describe('getCurrentDateString', () => {
    test('returns current date as string', () => {
      const result = getCurrentDateString();
      const today = new Date();
      const expected = formatDateForDatabase(today);
      expect(result).toBe(expected);
    });

    test('returns date in correct format', () => {
      const result = getCurrentDateString();
      // Should match YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('is consistent with formatDateForDatabase', () => {
      const result = getCurrentDateString();
      const today = new Date();
      const expected = formatDateForDatabase(today);
      expect(result).toBe(expected);
    });
  });

  describe('addDays', () => {
    test('adds positive days to date', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      const newDate = addDays(date, 5);
      expect(newDate.getDate()).toBe(30);
      expect(newDate.getMonth()).toBe(11);
      expect(newDate.getFullYear()).toBe(2023);
    });

    test('adds negative days to date', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      const newDate = addDays(date, -5);
      expect(newDate.getDate()).toBe(20);
      expect(newDate.getMonth()).toBe(11);
      expect(newDate.getFullYear()).toBe(2023);
    });

    test('handles month boundaries', () => {
      const date = new Date(2023, 11, 30); // December 30, 2023
      const newDate = addDays(date, 5);
      expect(newDate.getDate()).toBe(4);
      expect(newDate.getMonth()).toBe(0); // January
      expect(newDate.getFullYear()).toBe(2024);
    });

    test('handles year boundaries', () => {
      const date = new Date(2023, 11, 31); // December 31, 2023
      const newDate = addDays(date, 1);
      expect(newDate.getDate()).toBe(1);
      expect(newDate.getMonth()).toBe(0); // January
      expect(newDate.getFullYear()).toBe(2024);
    });

    test('handles leap year correctly', () => {
      const date = new Date(2024, 1, 28); // February 28, 2024 (leap year)
      const newDate = addDays(date, 1);
      expect(newDate.getDate()).toBe(29);
      expect(newDate.getMonth()).toBe(1); // February
      expect(newDate.getFullYear()).toBe(2024);
    });

    test('does not modify original date', () => {
      const originalDate = new Date(2023, 11, 25); // December 25, 2023
      const originalTime = originalDate.getTime();
      const newDate = addDays(originalDate, 5);
      
      // Original date should remain unchanged
      expect(originalDate.getTime()).toBe(originalTime);
      // New date should be different
      expect(newDate.getTime()).not.toBe(originalTime);
    });

    test('handles zero days', () => {
      const date = new Date(2023, 11, 25); // December 25, 2023
      const newDate = addDays(date, 0);
      expect(newDate.getDate()).toBe(25);
      expect(newDate.getMonth()).toBe(11);
      expect(newDate.getFullYear()).toBe(2023);
    });

    test('preserves time components', () => {
      const date = new Date(2023, 11, 25, 14, 30, 45); // December 25, 2023, 2:30:45 PM
      const newDate = addDays(date, 1);
      expect(newDate.getHours()).toBe(14);
      expect(newDate.getMinutes()).toBe(30);
      expect(newDate.getSeconds()).toBe(45);
    });
  });

  describe('Edge Cases and Integration', () => {
    test('handles February in leap year', () => {
      const leapDate = createLocalDate('2024-02-29'); // February 29, 2024
      expect(leapDate.getFullYear()).toBe(2024);
      expect(leapDate.getMonth()).toBe(1); // February
      expect(leapDate.getDate()).toBe(29);
      
      const formatted = formatDateForDatabase(leapDate);
      expect(formatted).toBe('2024-02-29');
    });

    test('handles February in non-leap year', () => {
      const date = createLocalDate('2023-02-28'); // February 28, 2023
      const nextDay = addDays(date, 1);
      expect(nextDay.getMonth()).toBe(2); // March
      expect(nextDay.getDate()).toBe(1);
    });

    test('consistency between create and format functions', () => {
      const dateString = '2023-12-25';
      const date = createLocalDate(dateString);
      const formatted = formatDateForDatabase(date);
      expect(formatted).toBe(dateString);
    });

    test('handles extreme dates', () => {
      const earlyDate = createLocalDate('1900-01-01');
      expect(earlyDate.getFullYear()).toBe(1900);
      
      const lateDate = createLocalDate('2099-12-31');
      expect(lateDate.getFullYear()).toBe(2099);
    });

    test('date comparison functions are consistent', () => {
      const date1 = new Date(2023, 11, 25);
      const date2 = new Date(2023, 11, 25);
      const dateString = '2023-12-25';
      
      expect(isSameDate(date1, date2)).toBe(true);
      expect(compareDateWithSchedule(date1, dateString)).toBe(true);
      expect(compareDateWithScheduleDate(date1, date2)).toBe(true);
    });
  });
}); 
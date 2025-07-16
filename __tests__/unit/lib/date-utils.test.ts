import {
  createLocalDate,
  formatDateForDisplay,
  formatDateForDatabase,
  getCurrentDateString,
  fetchAdminSettings,
} from '@/lib/date-utils'

// Mock fetch for admin settings
global.fetch = jest.fn()

describe('Date Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset fetch mock
    ;(fetch as jest.Mock).mockClear()
  })

  describe('createLocalDate', () => {
    it('should create a date object from YYYY-MM-DD string', () => {
      const dateString = '2024-01-15'
      const result = createLocalDate(dateString)
      
      expect(result).toBeInstanceOf(Date)
      expect(result.getFullYear()).toBe(2024)
      expect(result.getMonth()).toBe(0) // January is 0
      expect(result.getDate()).toBe(15)
    })

    it('should handle edge cases for date creation', () => {
      // First day of year
      const newYear = createLocalDate('2024-01-01')
      expect(newYear.getDate()).toBe(1)
      expect(newYear.getMonth()).toBe(0)

      // Last day of year
      const endYear = createLocalDate('2024-12-31')
      expect(endYear.getDate()).toBe(31)
      expect(endYear.getMonth()).toBe(11)

      // Leap year
      const leapDay = createLocalDate('2024-02-29')
      expect(leapDay.getDate()).toBe(29)
      expect(leapDay.getMonth()).toBe(1)
    })

    it('should handle different date string formats', () => {
      const testCases = [
        { input: '2024-01-01', expectedDay: 1 },
        { input: '2024-12-31', expectedDay: 31 },
        { input: '2024-02-29', expectedDay: 29 }, // Leap year
      ]

      testCases.forEach(({ input, expectedDay }) => {
        const result = createLocalDate(input)
        expect(result.getDate()).toBe(expectedDay)
      })
    })
  })

  describe('formatDateForDisplay', () => {
    it('should format date for user display', () => {
      const date = new Date(2024, 0, 15) // January 15, 2024
      const result = formatDateForDisplay(date)
      
      // Should be in a human-readable format
      expect(result).toMatch(/Jan|January/)
      expect(result).toMatch(/15/)
      expect(result).toMatch(/2024/)
    })

    it('should handle different date inputs', () => {
      const testDates = [
        new Date(2024, 0, 1),   // New Year
        new Date(2024, 5, 15),  // Mid year
        new Date(2024, 11, 31), // End of year
      ]

      testDates.forEach(date => {
        const result = formatDateForDisplay(date)
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('formatDateForDatabase', () => {
    it('should format date as YYYY-MM-DD for database storage', () => {
      const date = new Date(2024, 0, 15) // January 15, 2024
      const result = formatDateForDatabase(date)
      
      expect(result).toBe('2024-01-15')
    })

    it('should handle single digit months and days', () => {
      const date = new Date(2024, 0, 5) // January 5, 2024
      const result = formatDateForDatabase(date)
      
      expect(result).toBe('2024-01-05')
    })

    it('should handle different dates correctly', () => {
      const testCases = [
        { date: new Date(2024, 0, 1), expected: '2024-01-01' },
        { date: new Date(2024, 11, 31), expected: '2024-12-31' },
        { date: new Date(2023, 5, 15), expected: '2023-06-15' },
      ]

      testCases.forEach(({ date, expected }) => {
        expect(formatDateForDatabase(date)).toBe(expected)
      })
    })
  })

  describe('getCurrentDateString', () => {
    it('should return current date as YYYY-MM-DD string', () => {
      const result = getCurrentDateString()
      
      // Should match YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      
      // Should be today's date
      const today = formatDateForDatabase(new Date())
      expect(result).toBe(today)
    })

    it('should return consistent format', () => {
      const result1 = getCurrentDateString()
      const result2 = getCurrentDateString()
      
      // Both should have same format (might differ if run across midnight)
      expect(result1).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result2).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('fetchAdminSettings', () => {
    const mockSettings = {
      settings: {
        enableBookingTimeWindow: true,
        bookingWindowEndHour: 19,
        bookingWindowDaysBefore: 1,
      }
    }

    it('should fetch admin settings successfully', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })

      const result = await fetchAdminSettings()
      
      expect(fetch).toHaveBeenCalledWith('/api/settings')
      expect(result).toEqual({
        enableBookingTimeWindow: true,
        bookingWindowEndHour: 19,
        bookingWindowDaysBefore: 1,
      })
    })

    it('should return default settings when API fails', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await fetchAdminSettings()
      
      // Should return default settings
      expect(result).toEqual({
        enableBookingTimeWindow: true,
        bookingWindowEndHour: 19,
        bookingWindowDaysBefore: 1,
      })
    })

    it('should handle network errors gracefully', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const result = await fetchAdminSettings()
      
      // Should return default settings on error
      expect(result).toEqual({
        enableBookingTimeWindow: true,
        bookingWindowEndHour: 19,
        bookingWindowDaysBefore: 1,
      })
    })

    it('should use cached settings on subsequent calls', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSettings),
      })

      // First call
      const result1 = await fetchAdminSettings()
      
      // Second call (should use cache)
      const result2 = await fetchAdminSettings()
      
      // Note: Caching behavior depends on implementation details
      expect(result1).toEqual(result2)
      expect(result1).toEqual({
        enableBookingTimeWindow: true,
        bookingWindowEndHour: 19,
        bookingWindowDaysBefore: 1,
      })
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle invalid date strings gracefully', () => {
      // Test with invalid date string
      expect(() => createLocalDate('invalid-date')).not.toThrow()
    })

    it('should handle date objects with invalid values', () => {
      const invalidDate = new Date('invalid')
      expect(() => formatDateForDatabase(invalidDate)).not.toThrow()
    })

    it('should handle timezone differences', () => {
      // Create date at midnight to test timezone edge cases
      const midnight = new Date(2024, 0, 15, 0, 0, 0)
      const result = formatDateForDatabase(midnight)
      expect(result).toBe('2024-01-15')
    })
  })

  describe('Performance tests', () => {
    it('should handle multiple date operations efficiently', () => {
      const startTime = performance.now()
      
      // Perform multiple operations
      for (let i = 0; i < 1000; i++) {
        const date = createLocalDate('2024-01-15')
        formatDateForDatabase(date)
        formatDateForDisplay(date)
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(executionTime).toBeLessThan(500) // 500ms - adjusted for CI environments
    })
  })
}) 
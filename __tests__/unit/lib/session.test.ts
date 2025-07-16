import { sessionManager } from '@/lib/session'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('Session Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
  })

  describe('setSession', () => {
    it('should store session data in localStorage', () => {
      const sessionData = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            student_id: 'test-student-id',
            student_name: 'Test Student',
            roll_number: 'TS001',
          },
        },
        session: {
          access_token: 'test-token',
          expires_at: Date.now() + 3600000, // 1 hour from now
          refresh_token: 'test-refresh-token',
        },
      }

      sessionManager.setSession(sessionData)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'student_session',
        JSON.stringify(sessionData)
      )
    })

    it('should handle session data with minimal fields', () => {
      const minimalSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            student_id: 'test-student-id',
            student_name: 'Test Student',
            roll_number: 'TS001',
          },
        },
        session: {
          access_token: 'test-token',
          expires_at: Date.now() + 3600000,
          refresh_token: 'test-refresh-token',
        },
      }

      expect(() => sessionManager.setSession(minimalSession)).not.toThrow()
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'student_session',
        JSON.stringify(minimalSession)
      )
    })

    it('should handle complex session objects', () => {
      const complexSession = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            student_id: 'test-id',
            student_name: 'Test Student',
            roll_number: 'TS001',
          },
        },
        session: {
          access_token: 'complex-token',
          refresh_token: 'refresh-token',
          expires_at: Date.now() + 3600000,
        },
      }

      sessionManager.setSession(complexSession)
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'student_session',
        JSON.stringify(complexSession)
      )
    })
  })

  describe('getSession', () => {
    it('should retrieve valid session from localStorage', () => {
      const validSession = {
        user: {
          user_metadata: {
            student_id: 'test-student-id',
            email: 'test@example.com',
          },
        },
        session: {
          access_token: 'test-token',
          expires_at: Date.now() + 3600000, // 1 hour from now
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validSession))

      const result = sessionManager.getSession()

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('student_session')
      expect(result).toEqual(validSession)
    })

    it('should return null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = sessionManager.getSession()

      expect(result).toBeNull()
    })

    it('should clear expired session and return null', () => {
      const expiredSession = {
        user: {
          user_metadata: {
            student_id: 'test-student-id',
          },
        },
        session: {
          access_token: 'expired-token',
          expires_at: Date.now() - 3600000, // 1 hour ago (expired)
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSession))

      const result = sessionManager.getSession()

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('student_session')
    })

    it('should handle corrupted session data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json-data')

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const result = sessionManager.getSession()

      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('student_session')
      
      consoleSpy.mockRestore()
    })

    it('should handle session without expiration', () => {
      const sessionWithoutExpiry = {
        user: {
          user_metadata: {
            student_id: 'test-student-id',
          },
        },
        session: {
          access_token: 'test-token',
          // No expires_at field
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutExpiry))

      const result = sessionManager.getSession()

      expect(result).toEqual(sessionWithoutExpiry)
    })
  })

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      sessionManager.clearSession()

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('student_session')
    })

    it('should not throw error when clearing non-existent session', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        // Simulate no session to remove
      })

      expect(() => sessionManager.clearSession()).not.toThrow()
    })
  })

  describe('isAuthenticated', () => {
    it('should return true for valid authenticated session', () => {
      const validSession = {
        user: {
          user_metadata: {
            student_id: 'test-student-id',
            email: 'test@example.com',
          },
        },
        session: {
          access_token: 'test-token',
          expires_at: Date.now() + 3600000,
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validSession))

      const result = sessionManager.isAuthenticated()

      expect(result).toBe(true)
    })

    it('should return false for no session', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = sessionManager.isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false for session without student_id', () => {
      const invalidSession = {
        user: {
          user_metadata: {
            email: 'test@example.com',
            // Missing student_id
          },
        },
        session: {
          access_token: 'test-token',
          expires_at: Date.now() + 3600000,
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(invalidSession))

      const result = sessionManager.isAuthenticated()

      expect(result).toBe(false)
    })

    it('should return false for expired session', () => {
      const expiredSession = {
        user: {
          user_metadata: {
            student_id: 'test-student-id',
          },
        },
        session: {
          access_token: 'expired-token',
          expires_at: Date.now() - 3600000, // Expired
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSession))

      const result = sessionManager.isAuthenticated()

      expect(result).toBe(false)
    })
  })

  describe('getCurrentStudentId', () => {
    it('should return student ID from valid session', () => {
      const validSession = {
        user: {
          user_metadata: {
            student_id: 'test-student-id',
            email: 'test@example.com',
          },
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validSession))

      const result = sessionManager.getCurrentStudentId()

      expect(result).toBe('test-student-id')
    })

    it('should return null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = sessionManager.getCurrentStudentId()

      expect(result).toBeNull()
    })

    it('should return null when student_id is missing', () => {
      const sessionWithoutId = {
        user: {
          user_metadata: {
            email: 'test@example.com',
            // Missing student_id
          },
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutId))

      const result = sessionManager.getCurrentStudentId()

      expect(result).toBeNull()
    })
  })

  describe('getCurrentStudent', () => {
    it('should return complete student metadata from session', () => {
      const studentMetadata = {
        student_id: 'test-student-id',
        email: 'test@example.com',
        studentName: 'Test Student',
        rollNumber: 'TS001',
      }

      const validSession = {
        user: {
          user_metadata: studentMetadata,
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validSession))

      const result = sessionManager.getCurrentStudent()

      expect(result).toEqual(studentMetadata)
    })

    it('should return null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = sessionManager.getCurrentStudent()

      expect(result).toBeNull()
    })

    it('should return empty object when user_metadata is empty', () => {
      const sessionWithEmptyMetadata = {
        user: {
          user_metadata: {},
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithEmptyMetadata))

      const result = sessionManager.getCurrentStudent()

      expect(result).toEqual({})
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const result = sessionManager.getSession()
      
      expect(result).toBeNull()
      expect(mockLocalStorage.removeItem).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('should handle setItem errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded')
      })

      const sessionData = {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            student_id: 'test',
            student_name: 'Test Student',
            roll_number: 'TS001',
          },
        },
        session: {
          access_token: 'token',
          expires_at: Date.now() + 3600000,
          refresh_token: 'test-refresh-token',
        },
      }

      // Should not throw error even if localStorage fails
      expect(() => sessionManager.setSession(sessionData)).not.toThrow()
    })

    it('should handle malformed session data', () => {
      const malformedSessions = [
        '{"user":}', // Invalid JSON
        '{"incomplete":', // Incomplete JSON
        'not-json-at-all',
        '""', // Empty string
        '{}', // Empty object
      ]

      malformedSessions.forEach(malformedSession => {
        mockLocalStorage.getItem.mockReturnValue(malformedSession)
        
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
        const result = sessionManager.getSession()
        
        expect(result).toBeNull()
        consoleSpy.mockRestore()
      })
    })
  })

  describe('Session expiration scenarios', () => {
    it('should handle sessions expiring exactly now', () => {
      const sessionExpiringNow = {
        user: {
          user_metadata: { student_id: 'test-id' },
        },
        session: {
          access_token: 'token',
          expires_at: Date.now(), // Expires exactly now
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionExpiringNow))

      const result = sessionManager.getSession()

      // Should be considered expired
      expect(result).toBeNull()
    })

    it('should handle very large expiration timestamps', () => {
      const futureSession = {
        user: {
          user_metadata: { student_id: 'test-id' },
        },
        session: {
          access_token: 'token',
          expires_at: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(futureSession))

      const result = sessionManager.getSession()

      expect(result).toEqual(futureSession)
    })

    it('should handle negative expiration timestamps', () => {
      const negativeExpirySession = {
        user: {
          user_metadata: { student_id: 'test-id' },
        },
        session: {
          access_token: 'token',
          expires_at: -1, // Negative timestamp
        },
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(negativeExpirySession))

      const result = sessionManager.getSession()

      // Should be considered expired
      expect(result).toBeNull()
    })
  })
}) 
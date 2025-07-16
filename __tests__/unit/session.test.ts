import { sessionManager, StudentSession } from '../../lib/session';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Session Management Utility Functions', () => {
  const mockSessionData: StudentSession = {
    user: {
      id: 'user123',
      email: 'student@example.com',
      user_metadata: {
        student_id: 'STU001',
        student_name: 'John Doe',
        roll_number: 'CS001',
      },
    },
    session: {
      access_token: 'access_token_123',
      expires_at: Date.now() + 3600000, // 1 hour from now
      refresh_token: 'refresh_token_123',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing console.error mocks
    jest.restoreAllMocks();
  });

  describe('setSession', () => {
    test('stores session data in localStorage', () => {
      sessionManager.setSession(mockSessionData);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'student_session',
        JSON.stringify(mockSessionData)
      );
    });

    test('overwrites existing session data', () => {
      const newSessionData = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: {
            ...mockSessionData.user.user_metadata,
            student_name: 'Jane Doe',
          },
        },
      };

      sessionManager.setSession(mockSessionData);
      sessionManager.setSession(newSessionData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
      expect(mockLocalStorage.setItem).toHaveBeenLastCalledWith(
        'student_session',
        JSON.stringify(newSessionData)
      );
    });
  });

  describe('getSession', () => {
    test('retrieves and parses valid session data', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSessionData));
      
      const result = sessionManager.getSession();
      
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('student_session');
      expect(result).toEqual(mockSessionData);
    });

    test('returns null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = sessionManager.getSession();
      
      expect(result).toBeNull();
    });

    test('returns null and clears session when session is expired', () => {
      const expiredSessionData = {
        ...mockSessionData,
        session: {
          ...mockSessionData.session,
          expires_at: Date.now() - 3600000, // 1 hour ago
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData));
      
      const result = sessionManager.getSession();
      
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('student_session');
    });

    test('handles invalid JSON gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = sessionManager.getSession();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing session:', expect.any(SyntaxError));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('student_session');
      
      consoleSpy.mockRestore();
    });

    test('handles missing session expiration gracefully', () => {
      const sessionWithoutExpiration = {
        ...mockSessionData,
        session: {
          access_token: 'token123',
          refresh_token: 'refresh123',
          // expires_at is missing
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutExpiration));
      
      const result = sessionManager.getSession();
      
      expect(result).toEqual(sessionWithoutExpiration);
    });

    test('handles session without session object', () => {
      const sessionWithoutSessionObject = {
        user: mockSessionData.user,
        // session object is missing
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutSessionObject));
      
      const result = sessionManager.getSession();
      
      expect(result).toEqual(sessionWithoutSessionObject);
    });
  });

  describe('clearSession', () => {
    test('removes session from localStorage', () => {
      sessionManager.clearSession();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('student_session');
    });

    test('can be called multiple times safely', () => {
      sessionManager.clearSession();
      sessionManager.clearSession();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
    });
  });

  describe('isAuthenticated', () => {
    test('returns true when valid session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSessionData));
      
      const result = sessionManager.isAuthenticated();
      
      expect(result).toBe(true);
    });

    test('returns false when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = sessionManager.isAuthenticated();
      
      expect(result).toBe(false);
    });

    test('returns false when session is expired', () => {
      const expiredSessionData = {
        ...mockSessionData,
        session: {
          ...mockSessionData.session,
          expires_at: Date.now() - 3600000, // 1 hour ago
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData));
      
      const result = sessionManager.isAuthenticated();
      
      expect(result).toBe(false);
    });

    test('returns false when session has no user metadata', () => {
      const sessionWithoutMetadata = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: null,
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutMetadata));
      
      const result = sessionManager.isAuthenticated();
      
      expect(result).toBe(false);
    });

    test('returns false when session has no student_id', () => {
      const sessionWithoutStudentId = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: {
            ...mockSessionData.user.user_metadata,
            student_id: null,
          },
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutStudentId));
      
      const result = sessionManager.isAuthenticated();
      
      expect(result).toBe(false);
    });

    test('returns false when session has empty student_id', () => {
      const sessionWithEmptyStudentId = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: {
            ...mockSessionData.user.user_metadata,
            student_id: '',
          },
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithEmptyStudentId));
      
      const result = sessionManager.isAuthenticated();
      
      expect(result).toBe(false);
    });
  });

  describe('getCurrentStudentId', () => {
    test('returns student ID when valid session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSessionData));
      
      const result = sessionManager.getCurrentStudentId();
      
      expect(result).toBe('STU001');
    });

    test('returns null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = sessionManager.getCurrentStudentId();
      
      expect(result).toBeNull();
    });

    test('returns null when session is expired', () => {
      const expiredSessionData = {
        ...mockSessionData,
        session: {
          ...mockSessionData.session,
          expires_at: Date.now() - 3600000, // 1 hour ago
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData));
      
      const result = sessionManager.getCurrentStudentId();
      
      expect(result).toBeNull();
    });

    test('returns null when session has no user metadata', () => {
      const sessionWithoutMetadata = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: null,
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutMetadata));
      
      const result = sessionManager.getCurrentStudentId();
      
      expect(result).toBeNull();
    });

    test('returns null when session has no student_id', () => {
      const sessionWithoutStudentId = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: {
            student_name: 'John Doe',
            roll_number: 'CS001',
            // student_id is missing
          },
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutStudentId));
      
      const result = sessionManager.getCurrentStudentId();
      
      expect(result).toBeNull();
    });
  });

  describe('getCurrentStudent', () => {
    test('returns student metadata when valid session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSessionData));
      
      const result = sessionManager.getCurrentStudent();
      
      expect(result).toEqual({
        student_id: 'STU001',
        student_name: 'John Doe',
        roll_number: 'CS001',
      });
    });

    test('returns null when no session exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const result = sessionManager.getCurrentStudent();
      
      expect(result).toBeNull();
    });

    test('returns null when session is expired', () => {
      const expiredSessionData = {
        ...mockSessionData,
        session: {
          ...mockSessionData.session,
          expires_at: Date.now() - 3600000, // 1 hour ago
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData));
      
      const result = sessionManager.getCurrentStudent();
      
      expect(result).toBeNull();
    });

    test('returns null when session has no user metadata', () => {
      const sessionWithoutMetadata = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: null,
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithoutMetadata));
      
      const result = sessionManager.getCurrentStudent();
      
      expect(result).toBeNull();
    });

    test('returns partial metadata when some fields are missing', () => {
      const sessionWithPartialMetadata = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: {
            student_id: 'STU001',
            student_name: 'John Doe',
            // roll_number is missing
          },
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(sessionWithPartialMetadata));
      
      const result = sessionManager.getCurrentStudent();
      
      expect(result).toEqual({
        student_id: 'STU001',
        student_name: 'John Doe',
      });
    });
  });

  describe('Integration and Edge Cases', () => {
    test('session expiration is checked consistently across methods', () => {
      const expiredSessionData = {
        ...mockSessionData,
        session: {
          ...mockSessionData.session,
          expires_at: Date.now() - 1000, // 1 second ago
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredSessionData));
      
      // All methods should return null/false for expired session
      expect(sessionManager.getSession()).toBeNull();
      expect(sessionManager.isAuthenticated()).toBe(false);
      expect(sessionManager.getCurrentStudentId()).toBeNull();
      expect(sessionManager.getCurrentStudent()).toBeNull();
    });

    test('session clearing works correctly', () => {
      // Set up a valid session
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockSessionData));
      
      // Verify session exists
      expect(sessionManager.isAuthenticated()).toBe(true);
      
      // Clear session
      sessionManager.clearSession();
      
      // Set up localStorage to return null (as if cleared)
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // Verify session is gone
      expect(sessionManager.isAuthenticated()).toBe(false);
      expect(sessionManager.getCurrentStudentId()).toBeNull();
      expect(sessionManager.getCurrentStudent()).toBeNull();
    });

    test('handles localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const result = sessionManager.getSession();
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing session:', expect.any(Error));
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('student_session');
      
      consoleSpy.mockRestore();
    });

    test('session update flow works correctly', () => {
      // Set initial session
      sessionManager.setSession(mockSessionData);
      
      // Update with new session data
      const updatedSessionData = {
        ...mockSessionData,
        user: {
          ...mockSessionData.user,
          user_metadata: {
            ...mockSessionData.user.user_metadata,
            student_name: 'Jane Smith',
          },
        },
      };
      
      sessionManager.setSession(updatedSessionData);
      
      // Mock localStorage to return updated data
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(updatedSessionData));
      
      const result = sessionManager.getCurrentStudent();
      expect(result?.student_name).toBe('Jane Smith');
    });

    test('handles malformed session data gracefully', () => {
      const malformedSessionData = {
        // Missing required fields
        user: {
          id: 'user123',
          // missing email and user_metadata
        },
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(malformedSessionData));
      
      expect(sessionManager.isAuthenticated()).toBe(false);
      expect(sessionManager.getCurrentStudentId()).toBeNull();
      expect(sessionManager.getCurrentStudent()).toBeNull();
    });
  });
}); 
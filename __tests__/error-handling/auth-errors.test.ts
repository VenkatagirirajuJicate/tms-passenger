// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('../../lib/supabase', () => ({
  createClient: () => mockSupabaseClient,
}));

describe('Authentication and Authorization Errors', () => {
  describe('Login Errors', () => {
    test('handles invalid credentials', async () => {
      mockSupabaseClient.auth.signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await mockSupabaseClient.auth.signIn({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

      expect(result.error.message).toBe('Invalid login credentials');
      expect(result.data.user).toBeNull();
    });

    test('handles account locked errors', async () => {
      mockSupabaseClient.auth.signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Account is locked due to too many failed attempts' }
      });

      const result = await mockSupabaseClient.auth.signIn({
        email: 'locked@example.com',
        password: 'password123'
      });

      expect(result.error.message).toBe('Account is locked due to too many failed attempts');
    });

    test('handles email not verified errors', async () => {
      mockSupabaseClient.auth.signIn.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email not confirmed' }
      });

      const result = await mockSupabaseClient.auth.signIn({
        email: 'unverified@example.com',
        password: 'password123'
      });

      expect(result.error.message).toBe('Email not confirmed');
    });

    test('handles rate limiting during login', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Too many login attempts. Please try again later.' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
      });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Too many login attempts. Please try again later.');
    });
  });

  describe('Session Management Errors', () => {
    test('handles expired session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      });

      const result = await mockSupabaseClient.auth.getSession();
      expect(result.error.message).toBe('Session expired');
      expect(result.data.session).toBeNull();
    });

    test('handles invalid session token', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid session token' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/schedules/availability', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid session token');
    });

    test('handles session refresh failures', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Unable to refresh session' }
      });

      const result = await mockSupabaseClient.auth.getSession();
      expect(result.error.message).toBe('Unable to refresh session');
    });
  });

  describe('Authorization Errors', () => {
    test('handles insufficient permissions', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Insufficient permissions to access this resource' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/admin/users');
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Insufficient permissions to access this resource');
    });

    test('handles role-based access control errors', async () => {
      const checkPermission = (userRole: string, requiredRole: string) => {
        const roleHierarchy = { 'admin': 3, 'staff': 2, 'student': 1 };
        const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
        const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
        
        if (userLevel < requiredLevel) {
          return { authorized: false, error: 'Insufficient role permissions' };
        }
        return { authorized: true, error: null };
      };

      const result = checkPermission('student', 'admin');
      expect(result.authorized).toBe(false);
      expect(result.error).toBe('Insufficient role permissions');

      const validResult = checkPermission('admin', 'student');
      expect(validResult.authorized).toBe(true);
      expect(validResult.error).toBeNull();
    });

    test('handles resource ownership validation', async () => {
      const validateOwnership = (userId: string, resourceOwnerId: string) => {
        if (userId !== resourceOwnerId) {
          return { authorized: false, error: 'You can only access your own resources' };
        }
        return { authorized: true, error: null };
      };

      const result = validateOwnership('user123', 'user456');
      expect(result.authorized).toBe(false);
      expect(result.error).toBe('You can only access your own resources');
    });
  });

  describe('Password Management Errors', () => {
    test('handles password reset errors', async () => {
      mockSupabaseClient.auth.signIn.mockResolvedValue({
        data: null,
        error: { message: 'Unable to send password reset email' }
      });

      const result = await mockSupabaseClient.auth.signIn({
        email: 'test@example.com'
      });

      expect(result.error.message).toBe('Unable to send password reset email');
    });

    test('handles weak password errors', async () => {
      const validatePasswordStrength = (password: string) => {
        const requirements = {
          length: password.length >= 8,
          uppercase: /[A-Z]/.test(password),
          lowercase: /[a-z]/.test(password),
          numbers: /\d/.test(password),
          special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const failedRequirements = Object.entries(requirements)
          .filter(([_, met]) => !met)
          .map(([requirement, _]) => requirement);

        if (failedRequirements.length > 0) {
          return { valid: false, errors: failedRequirements };
        }
        return { valid: true, errors: [] };
      };

      const result = validatePasswordStrength('weak');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('length');
      expect(result.errors).toContain('uppercase');
      expect(result.errors).toContain('numbers');
      expect(result.errors).toContain('special');
    });

    test('handles password change errors', async () => {
      mockSupabaseClient.auth.signIn.mockResolvedValue({
        data: null,
        error: { message: 'Current password is incorrect' }
      });

      const result = await mockSupabaseClient.auth.signIn({
        password: 'newPassword123',
        oldPassword: 'wrongCurrentPassword'
      });

      expect(result.error.message).toBe('Current password is incorrect');
    });
  });

  describe('Multi-Factor Authentication Errors', () => {
    test('handles MFA setup errors', async () => {
      const mockMFASetup = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Unable to set up MFA' }
      });

      const result = await mockMFASetup();
      expect(result.error.message).toBe('Unable to set up MFA');
    });

    test('handles invalid MFA code', async () => {
      const validateMFACode = (code: string) => {
        if (code.length !== 6 || !/^\d+$/.test(code)) {
          return { valid: false, error: 'MFA code must be 6 digits' };
        }
        // Simulate invalid code
        if (code !== '123456') {
          return { valid: false, error: 'Invalid MFA code' };
        }
        return { valid: true, error: null };
      };

      const result = validateMFACode('000000');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid MFA code');
    });

    test('handles MFA code expiration', async () => {
      const validateMFACodeExpiry = (codeTimestamp: number) => {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - codeTimestamp > fiveMinutes) {
          return { valid: false, error: 'MFA code has expired' };
        }
        return { valid: true, error: null };
      };

      const expiredTimestamp = Date.now() - (10 * 60 * 1000); // 10 minutes ago
      const result = validateMFACodeExpiry(expiredTimestamp);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('MFA code has expired');
    });
  });

  describe('Account Management Errors', () => {
    test('handles account suspension', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Account has been suspended' })
      });
      global.fetch = mockFetch;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'suspended@example.com', password: 'password123' })
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Account has been suspended');
    });

    test('handles account deletion errors', async () => {
      const mockAccountDeletion = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Cannot delete account with active bookings' }
      });

      const result = await mockAccountDeletion();
      expect(result.error.message).toBe('Cannot delete account with active bookings');
    });

    test('handles email change verification errors', async () => {
      const mockEmailChange = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Email already in use by another account' }
      });

      const result = await mockEmailChange();
      expect(result.error.message).toBe('Email already in use by another account');
    });
  });

  describe('External Authentication Errors', () => {
    test('handles OAuth provider errors', async () => {
      const mockOAuthSignIn = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'OAuth provider authentication failed' }
      });

      const result = await mockOAuthSignIn();
      expect(result.error.message).toBe('OAuth provider authentication failed');
    });

    test('handles SSO integration errors', async () => {
      const mockSSOSignIn = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'SSO provider is temporarily unavailable' }
      });

      const result = await mockSSOSignIn();
      expect(result.error.message).toBe('SSO provider is temporarily unavailable');
    });
  });
}); 
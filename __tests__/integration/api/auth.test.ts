import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as firstLoginHandler } from '@/app/api/auth/first-login/route'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn()
      }))
    }))
  }))
}

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}))

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

import bcrypt from 'bcryptjs'

describe('Authentication API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  describe('POST /api/auth/login', () => {
    it('should authenticate valid user successfully', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        student_name: 'Test Student',
        password_hash: 'hashed-password',
        first_login_completed: true,
        account_locked_until: null,
        failed_login_attempts: 0
      }

      // Mock successful database query
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      // Mock successful password comparison
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      // Mock successful login attempt update
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'correct-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.student).toEqual(expect.objectContaining({
        id: 'student-123',
        email: 'test@example.com',
        student_name: 'Test Student'
      }))
      expect(data.user).toBeDefined()
      expect(data.session).toBeDefined()
    })

    it('should reject invalid credentials', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_login_completed: true,
        account_locked_until: null,
        failed_login_attempts: 0
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      // Mock failed password comparison
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid email or password')
    })

    it('should reject login for non-existent user', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'any-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Student not found')
    })

    it('should reject login for user who has not completed first login', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        first_login_completed: false
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'any-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Please complete first time login using your date of birth')
    })

    it('should reject login for locked account', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        first_login_completed: true,
        account_locked_until: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'any-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(423)
      expect(data.error).toBe('Account is temporarily locked due to multiple failed login attempts')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing email or password')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Student not found')
    })

    it('should increment failed login attempts on wrong password', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_login_completed: true,
        account_locked_until: null,
        failed_login_attempts: 2
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: { ...mockStudent, failed_login_attempts: 3 },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)

      expect(response.status).toBe(401)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          failed_login_attempts: 3,
          last_login_attempt: expect.any(String)
        })
      )
    })
  })

  describe('POST /api/auth/first-login', () => {
    it('should verify student with valid email and DOB', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'newstudent@example.com',
        student_name: 'New Student',
        date_of_birth: '1990-01-15',
        first_login_completed: false
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/first-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newstudent@example.com',
          dateOfBirth: '1990-01-15'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await firstLoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.student).toEqual(expect.objectContaining({
        id: 'student-123',
        email: 'newstudent@example.com',
        student_name: 'New Student'
      }))
    })

    it('should complete password setup for verified student', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'newstudent@example.com',
        date_of_birth: '1990-01-15',
        first_login_completed: false
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      ;(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password')

      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: { ...mockStudent, first_login_completed: true },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/first-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'newstudent@example.com',
          dateOfBirth: '1990-01-15',
          newPassword: 'securePassword123'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await firstLoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Password setup completed successfully')
      expect(bcrypt.hash).toHaveBeenCalledWith('securePassword123', 12)
    })

    it('should reject invalid date of birth', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'student@example.com',
        date_of_birth: '1990-01-15',
        first_login_completed: false
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/first-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          dateOfBirth: '1990-01-16' // Wrong DOB
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await firstLoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Date of birth does not match our records')
    })

    it('should reject student who already completed first login', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'student@example.com',
        date_of_birth: '1990-01-15',
        first_login_completed: true // Already completed
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/first-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          dateOfBirth: '1990-01-15'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await firstLoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('First time login has already been completed')
    })

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/first-login', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await firstLoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and date of birth are required')
    })

    it('should validate password strength for password setup', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/first-login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'student@example.com',
          dateOfBirth: '1990-01-15',
          newPassword: '123' // Too weak
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await firstLoginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 8 characters long')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Server configuration error')
    })

    it('should handle database connection failures', async () => {
      mockSupabaseClient.from().select().eq().single.mockRejectedValue(
        new Error('Connection timeout')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Security Tests', () => {
    it('should not expose sensitive information in error messages', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Internal database error with sensitive details', code: 'DB_ERROR' }
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Student not found')
      expect(data.error).not.toContain('sensitive details')
    })

    it('should implement rate limiting behavior through failed attempts', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_login_completed: true,
        account_locked_until: null,
        failed_login_attempts: 4 // One away from lockout
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      // Mock account lockout
      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: { 
          ...mockStudent, 
          failed_login_attempts: 5,
          account_locked_until: new Date(Date.now() + 3600000).toISOString()
        },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          failed_login_attempts: 5,
          account_locked_until: expect.any(String)
        })
      )
    })

    it('should reset failed attempts on successful login', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        password_hash: 'hashed-password',
        first_login_completed: true,
        account_locked_until: null,
        failed_login_attempts: 3
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      mockSupabaseClient.from().update().eq().single.mockResolvedValue({
        data: { ...mockStudent, failed_login_attempts: 0 },
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'correct-password'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await loginHandler(request)

      expect(response.status).toBe(200)
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          failed_login_attempts: 0,
          last_login: expect.any(String)
        })
      )
    })
  })
}) 
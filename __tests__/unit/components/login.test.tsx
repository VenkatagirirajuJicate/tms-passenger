import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../../__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/login/page'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(fetch as jest.Mock).mockClear()
    mockPush.mockClear()
    mockReplace.mockClear()
    localStorage.clear()
  })

  describe('Rendering and Initial State', () => {
    it('should render login form with both login modes', () => {
      render(<LoginPage />)

      // Check for main elements
      expect(screen.getByText('Student Portal')).toBeInTheDocument()
      expect(screen.getByText('Transport Management System')).toBeInTheDocument()
      
      // Check for mode toggle buttons
      expect(screen.getByText('Login')).toBeInTheDocument()
      expect(screen.getByText('First Time Setup')).toBeInTheDocument()
    })

    it('should default to regular login mode', () => {
      render(<LoginPage />)

      // Should show regular login fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should switch to first-time setup mode', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Click first-time setup tab
      await user.click(screen.getByText('First Time Setup'))

      // Should show first-time setup fields
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /verify & setup/i })).toBeInTheDocument()
    })
  })

  describe('Regular Login Flow', () => {
    it('should handle successful login', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        success: true,
        user: { id: 'user-id' },
        session: { access_token: 'token' },
        student: { id: 'student-id', student_name: 'Test Student' },
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      render(<LoginPage />)

      // Fill in login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      })

      // Should redirect to dashboard
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should handle login failure', async () => {
      const user = userEvent.setup()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })

      // Should not redirect
      expect(mockReplace).not.toHaveBeenCalled()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Try to submit without filling fields
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Should show validation errors
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })

    it('should validate email format', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
    })

    it('should handle network errors', async () => {
      const user = userEvent.setup()
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('First-Time Setup Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      await user.click(screen.getByText('First Time Setup'))
    })

    it('should handle successful first-time setup', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        success: true,
        student: { id: 'student-id', student_name: 'Test Student' },
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      // Fill in first-time setup form
      await user.type(screen.getByLabelText(/email/i), 'newstudent@example.com')
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-15')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /verify & setup/i }))

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/auth/first-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'newstudent@example.com',
            dateOfBirth: '1990-01-15',
          }),
        })
      })
    })

    it('should show password setup after successful verification', async () => {
      const user = userEvent.setup()
      const mockResponse = {
        success: true,
        student: { id: 'student-id', student_name: 'Test Student' },
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      await user.type(screen.getByLabelText(/email/i), 'newstudent@example.com')
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-15')
      await user.click(screen.getByRole('button', { name: /verify & setup/i }))

      await waitFor(() => {
        expect(screen.getByText(/create your password/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      })
    })

    it('should validate password requirements', async () => {
      const user = userEvent.setup()
      
      // Mock successful verification first
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, student: { id: 'test' } }),
      })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-15')
      await user.click(screen.getByRole('button', { name: /verify & setup/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      // Try with weak password
      await user.type(screen.getByLabelText(/new password/i), '123')
      await user.type(screen.getByLabelText(/confirm password/i), '123')

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it('should validate password confirmation', async () => {
      const user = userEvent.setup()
      
      // Mock successful verification
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, student: { id: 'test' } }),
      })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/date of birth/i), '1990-01-15')
      await user.click(screen.getByRole('button', { name: /verify & setup/i }))

      await waitFor(() => {
        expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
      })

      // Passwords don't match
      await user.type(screen.getByLabelText(/new password/i), 'password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'different123')

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('should handle invalid date of birth', async () => {
      const user = userEvent.setup()
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid date of birth' }),
      })

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/date of birth/i), '2000-01-01')
      await user.click(screen.getByRole('button', { name: /verify & setup/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid date of birth/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Interface Interactions', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup()
      
      // Mock a delayed response
      ;(fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          }), 100)
        )
      )

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      // Should show loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      
      // Button should be disabled
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })

    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle to show password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')

      // Click again to hide password
      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      // Focus should start on email input
      emailInput.focus()
      expect(emailInput).toHaveFocus()

      // Tab to password input
      await user.tab()
      expect(passwordInput).toHaveFocus()

      // Tab to submit button
      await user.tab()
      expect(submitButton).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<LoginPage />)

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('aria-required', 'true')
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('aria-required', 'true')
    })

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        const errorMessage = screen.getByText(/email is required/i)
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it('should have proper focus management', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Submit form to trigger validation
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        // Focus should move to first error field
        expect(screen.getByLabelText(/email/i)).toHaveFocus()
      })
    })
  })

  describe('Error Recovery', () => {
    it('should clear errors when user starts typing', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)

      // Trigger validation error
      await user.click(screen.getByRole('button', { name: /sign in/i }))
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()

      // Start typing in email field
      await user.type(screen.getByLabelText(/email/i), 't')

      // Error should be cleared
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    })

    it('should allow retry after failed login', async () => {
      const user = userEvent.setup()
      
      // Mock initial failure
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })

      render(<LoginPage />)

      await user.type(screen.getByLabelText(/email/i), 'test@example.com')
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })

      // Mock successful retry
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          user: { id: 'user-id' },
          session: { access_token: 'token' },
          student: { id: 'student-id' },
        }),
      })

      // Correct the password and retry
      await user.clear(screen.getByLabelText(/password/i))
      await user.type(screen.getByLabelText(/password/i), 'correctpassword')
      await user.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard')
      })
    })
  })
}) 
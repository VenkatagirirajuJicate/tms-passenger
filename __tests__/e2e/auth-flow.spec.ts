import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/')
  })

  test.describe('Landing Page', () => {
    test('should display the login page with correct elements', async ({ page }) => {
      // Wait for the page to load
      await expect(page.getByText('Student Portal')).toBeVisible()
      await expect(page.getByText('Transport Management System')).toBeVisible()
      
      // Check for mode toggle buttons
      await expect(page.getByText('Login')).toBeVisible()
      await expect(page.getByText('First Time Setup')).toBeVisible()
      
      // Check default state is regular login
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('should switch between login modes', async ({ page }) => {
      // Default should be login mode
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      
      // Switch to first-time setup
      await page.getByText('First Time Setup').click()
      
      // Should show first-time setup fields
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/date of birth/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /verify & setup/i })).toBeVisible()
      
      // Switch back to login
      await page.getByText('Login').click()
      
      // Should show login fields again
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })
  })

  test.describe('Regular Login Flow', () => {
    test('should show validation errors for empty fields', async ({ page }) => {
      // Try to submit without filling fields
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should show validation errors
      await expect(page.getByText(/email is required/i)).toBeVisible()
      await expect(page.getByText(/password is required/i)).toBeVisible()
    })

    test('should validate email format', async ({ page }) => {
      // Enter invalid email
      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should show email format error
      await expect(page.getByText(/invalid email format/i)).toBeVisible()
    })

    test('should handle login attempt with mock API', async ({ page }) => {
      // Mock API response for login failure
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Invalid credentials' })
        })
      })
      
      // Fill login form
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should show error message
      await expect(page.getByText(/invalid credentials/i)).toBeVisible()
      
      // Should not redirect
      await expect(page.url()).toContain('/login')
    })

    test('should handle successful login', async ({ page }) => {
      // Mock successful API response
      await page.route('/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { id: 'user-123' },
            session: { access_token: 'token-123' },
            student: { id: 'student-123', student_name: 'Test Student' }
          })
        })
      })
      
      // Mock dashboard page to prevent actual navigation
      await page.route('/dashboard', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<html><body><h1>Dashboard</h1></body></html>'
        })
      })
      
      // Fill login form
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('correctpassword')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should redirect to dashboard
      await page.waitForURL('/dashboard')
      await expect(page.getByText('Dashboard')).toBeVisible()
    })

    test('should show loading state during login', async ({ page }) => {
      // Mock slow API response
      await page.route('/api/auth/login', async route => {
        // Delay response by 1 second
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        })
      })
      
      // Fill form and submit
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should show loading state
      await expect(page.getByText(/signing in/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })
  })

  test.describe('First-Time Setup Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to first-time setup mode
      await page.getByText('First Time Setup').click()
    })

    test('should validate required fields', async ({ page }) => {
      // Try to submit without filling fields
      await page.getByRole('button', { name: /verify & setup/i }).click()
      
      // Should show validation errors
      await expect(page.getByText(/email is required/i)).toBeVisible()
      await expect(page.getByText(/date of birth is required/i)).toBeVisible()
    })

    test('should handle DOB verification', async ({ page }) => {
      // Mock API response for DOB verification
      await page.route('/api/auth/first-login', async route => {
        const request = route.request()
        const postData = request.postDataJSON()
        
        if (postData.dateOfBirth === '1990-01-15') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              student: { id: 'student-123', student_name: 'Test Student' }
            })
          })
        } else {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Date of birth does not match our records' })
          })
        }
      })
      
      // Test wrong DOB
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/date of birth/i).fill('1990-01-16')
      await page.getByRole('button', { name: /verify & setup/i }).click()
      
      await expect(page.getByText(/date of birth does not match/i)).toBeVisible()
      
      // Test correct DOB
      await page.getByLabel(/date of birth/i).fill('1990-01-15')
      await page.getByRole('button', { name: /verify & setup/i }).click()
      
      // Should proceed to password setup
      await expect(page.getByText(/create your password/i)).toBeVisible()
      await expect(page.getByLabel(/new password/i)).toBeVisible()
      await expect(page.getByLabel(/confirm password/i)).toBeVisible()
    })

    test('should validate password requirements', async ({ page }) => {
      // Mock successful DOB verification first
      await page.route('/api/auth/first-login', async route => {
        const request = route.request()
        const postData = request.postDataJSON()
        
        if (!postData.newPassword) {
          // DOB verification step
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              student: { id: 'student-123', student_name: 'Test Student' }
            })
          })
        } else {
          // Password setup step
          if (postData.newPassword.length < 8) {
            await route.fulfill({
              status: 400,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Password must be at least 8 characters long' })
            })
          } else {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true, message: 'Password setup completed' })
            })
          }
        }
      })
      
      // Complete DOB verification
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/date of birth/i).fill('1990-01-15')
      await page.getByRole('button', { name: /verify & setup/i }).click()
      
      // Wait for password setup form
      await expect(page.getByLabel(/new password/i)).toBeVisible()
      
      // Test weak password
      await page.getByLabel(/new password/i).fill('123')
      await page.getByLabel(/confirm password/i).fill('123')
      await page.getByRole('button', { name: /complete setup/i }).click()
      
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible()
    })

    test('should validate password confirmation', async ({ page }) => {
      // Mock successful DOB verification
      await page.route('/api/auth/first-login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            student: { id: 'student-123', student_name: 'Test Student' }
          })
        })
      })
      
      // Complete DOB verification
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/date of birth/i).fill('1990-01-15')
      await page.getByRole('button', { name: /verify & setup/i }).click()
      
      // Wait for password setup form
      await expect(page.getByLabel(/new password/i)).toBeVisible()
      
      // Test mismatched passwords
      await page.getByLabel(/new password/i).fill('password123')
      await page.getByLabel(/confirm password/i).fill('different123')
      
      // Should show mismatch error
      await expect(page.getByText(/passwords do not match/i)).toBeVisible()
    })
  })

  test.describe('UI Interactions', () => {
    test('should handle password visibility toggle', async ({ page }) => {
      const passwordInput = page.getByLabel(/password/i)
      const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })
      
      // Initially password should be hidden
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click toggle to show password
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click again to hide password
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should handle keyboard navigation', async ({ page }) => {
      const emailInput = page.getByLabel(/email/i)
      const passwordInput = page.getByLabel(/password/i)
      const submitButton = page.getByRole('button', { name: /sign in/i })
      
      // Focus on email input
      await emailInput.focus()
      await expect(emailInput).toBeFocused()
      
      // Tab to password input
      await page.keyboard.press('Tab')
      await expect(passwordInput).toBeFocused()
      
      // Tab to submit button
      await page.keyboard.press('Tab')
      await expect(submitButton).toBeFocused()
    })

    test('should clear errors when user starts typing', async ({ page }) => {
      // Trigger validation error
      await page.getByRole('button', { name: /sign in/i }).click()
      await expect(page.getByText(/email is required/i)).toBeVisible()
      
      // Start typing in email field
      await page.getByLabel(/email/i).type('t')
      
      // Error should be cleared
      await expect(page.getByText(/email is required/i)).not.toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await expect(page.getByLabel(/email/i)).toHaveAttribute('aria-required', 'true')
      await expect(page.getByLabel(/password/i)).toHaveAttribute('aria-required', 'true')
    })

    test('should announce errors to screen readers', async ({ page }) => {
      // Trigger validation error
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Error message should have proper ARIA role
      const errorMessage = page.getByText(/email is required/i)
      await expect(errorMessage).toHaveAttribute('role', 'alert')
    })

    test('should support high contrast mode', async ({ page }) => {
      // Test with forced-colors media query
      await page.emulateMedia({ forcedColors: 'active' })
      
      // Elements should still be visible and functional
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
      
      // All elements should be visible and functional
      await expect(page.getByText('Student Portal')).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
      
      // Form should be submittable
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByLabel(/password/i).fill('password123')
      
      // Button should be clickable
      await expect(page.getByRole('button', { name: /sign in/i })).toBeEnabled()
    })

    test('should handle touch interactions', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Skipping touch test on desktop')
      
      // Test touch interactions
      await page.getByText('First Time Setup').tap()
      await expect(page.getByLabel(/date of birth/i)).toBeVisible()
      
      // Test form input with touch
      await page.getByLabel(/email/i).tap()
      await page.getByLabel(/email/i).fill('test@example.com')
      
      await expect(page.getByLabel(/email/i)).toHaveValue('test@example.com')
    })
  })
}) 
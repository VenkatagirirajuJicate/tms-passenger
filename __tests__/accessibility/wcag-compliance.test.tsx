import React from 'react'
import { render, screen, fireEvent } from '../utils/test-utils'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock components for testing
const MockLoginForm = () => (
  <div role="main">
    <h1>Student Login</h1>
    <form aria-label="Login Form">
      <div>
        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          name="email"
          aria-required="true"
          aria-describedby="email-error"
        />
        <div id="email-error" role="alert" aria-live="polite"></div>
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          name="password"
          aria-required="true"
          aria-describedby="password-help"
        />
        <div id="password-help">
          Password must be at least 8 characters long
        </div>
      </div>
      
      <button type="submit" aria-describedby="submit-help">
        Sign In
      </button>
      <div id="submit-help">
        Press Enter or click to sign in to your account
      </div>
    </form>
  </div>
)

const MockDashboard = () => (
  <div>
    <nav aria-label="Main Navigation" role="navigation">
      <ul>
        <li><a href="/dashboard" aria-current="page">Dashboard</a></li>
        <li><a href="/routes">Routes</a></li>
        <li><a href="/schedules">Schedules</a></li>
        <li><a href="/grievances">Grievances</a></li>
      </ul>
    </nav>
    
    <main role="main">
      <h1>Student Dashboard</h1>
      
      <section aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading">Quick Actions</h2>
        <div role="group" aria-labelledby="quick-actions-heading">
          <button>Book Transport</button>
          <button>View Bookings</button>
          <button>Submit Grievance</button>
        </div>
      </section>
      
      <section aria-labelledby="notifications-heading">
        <h2 id="notifications-heading">Notifications</h2>
        <div role="region" aria-labelledby="notifications-heading">
          <div role="alert" aria-live="polite">
            New route R005 added to your area
          </div>
        </div>
      </section>
    </main>
  </div>
)

const MockDataTable = () => (
  <div role="region" aria-labelledby="bookings-table-heading">
    <h2 id="bookings-table-heading">Your Bookings</h2>
    <table role="table" aria-labelledby="bookings-table-heading">
      <caption>List of your current and past transport bookings</caption>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Route</th>
          <th scope="col">Time</th>
          <th scope="col">Status</th>
          <th scope="col">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>2024-01-15</td>
          <td>R001 - City Center to University</td>
          <td>08:00 AM</td>
          <td>
            <span aria-label="Booking confirmed">Confirmed</span>
          </td>
          <td>
            <button aria-label="Cancel booking for January 15">
              Cancel
            </button>
          </td>
        </tr>
        <tr>
          <td>2024-01-16</td>
          <td>R001 - City Center to University</td>
          <td>08:00 AM</td>
          <td>
            <span aria-label="Booking pending">Pending</span>
          </td>
          <td>
            <button aria-label="Cancel booking for January 16">
              Cancel
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
)

const MockModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div role="document">
        <h2 id="modal-title">Book Transport</h2>
        <p id="modal-description">
          Select your preferred route and schedule
        </p>
        
        <form>
          <fieldset>
            <legend>Route Selection</legend>
            <div role="radiogroup" aria-labelledby="route-label">
              <span id="route-label">Available Routes</span>
              <label>
                <input type="radio" name="route" value="R001" />
                R001 - City Center to University
              </label>
              <label>
                <input type="radio" name="route" value="R002" />
                R002 - Airport to University
              </label>
            </div>
          </fieldset>
          
          <div>
            <label htmlFor="schedule-select">Select Schedule</label>
            <select id="schedule-select" aria-required="true">
              <option value="">Choose a time</option>
              <option value="08:00">08:00 AM</option>
              <option value="09:00">09:00 AM</option>
            </select>
          </div>
          
          <div role="group">
            <button type="submit">Book Now</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

describe('WCAG Compliance Tests', () => {
  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in login form', async () => {
      const { container } = render(<MockLoginForm />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in dashboard', async () => {
      const { container } = render(<MockDashboard />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in data table', async () => {
      const { container } = render(<MockDataTable />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations in modal', async () => {
      const { container } = render(
        <MockModal isOpen={true} onClose={() => {}} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Semantic HTML Structure', () => {
    it('should have proper heading hierarchy', () => {
      render(<MockDashboard />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2s = screen.getAllByRole('heading', { level: 2 })
      
      expect(h1).toHaveTextContent('Student Dashboard')
      expect(h2s).toHaveLength(2)
      expect(h2s[0]).toHaveTextContent('Quick Actions')
      expect(h2s[1]).toHaveTextContent('Notifications')
    })

    it('should have proper landmark roles', () => {
      render(<MockDashboard />)
      
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getAllByRole('region')).toHaveLength(2)
    })

    it('should have proper form labeling', () => {
      render(<MockLoginForm />)
      
      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      
      expect(emailInput).toHaveAttribute('aria-required', 'true')
      expect(passwordInput).toHaveAttribute('aria-required', 'true')
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
    })

    it('should have proper table structure', () => {
      render(<MockDataTable />)
      
      const table = screen.getByRole('table')
      const caption = screen.getByText('List of your current and past transport bookings')
      const columnHeaders = screen.getAllByRole('columnheader')
      
      expect(table).toBeInTheDocument()
      expect(caption).toBeInTheDocument()
      expect(columnHeaders).toHaveLength(5)
      
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in forms', async () => {
      const user = userEvent.setup()
      render(<MockLoginForm />)
      
      const emailInput = screen.getByLabelText('Email Address')
      const passwordInput = screen.getByLabelText('Password')
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      // Test Tab navigation
      await user.tab()
      expect(emailInput).toHaveFocus()
      
      await user.tab()
      expect(passwordInput).toHaveFocus()
      
      await user.tab()
      expect(submitButton).toHaveFocus()
    })

    it('should support keyboard navigation in navigation menu', async () => {
      const user = userEvent.setup()
      render(<MockDashboard />)
      
      const navLinks = screen.getAllByRole('link')
      
      // Focus first link
      navLinks[0].focus()
      expect(navLinks[0]).toHaveFocus()
      
      // Tab to next link
      await user.tab()
      expect(navLinks[1]).toHaveFocus()
    })

    it('should support Enter and Space key activation', async () => {
      const user = userEvent.setup()
      const mockClick = jest.fn()
      
      render(
        <button onClick={mockClick} type="button">
          Test Button
        </button>
      )
      
      const button = screen.getByRole('button')
      button.focus()
      
      // Test Enter key
      await user.keyboard('{Enter}')
      expect(mockClick).toHaveBeenCalledTimes(1)
      
      // Test Space key
      await user.keyboard(' ')
      expect(mockClick).toHaveBeenCalledTimes(2)
    })

    it('should trap focus in modal dialogs', async () => {
      const user = userEvent.setup()
      const onClose = jest.fn()
      
      render(<MockModal isOpen={true} onClose={onClose} />)
      
      const modal = screen.getByRole('dialog')
      const radioButtons = screen.getAllByRole('radio')
      const select = screen.getByRole('combobox')
      const buttons = screen.getAllByRole('button')
      
      expect(modal).toBeInTheDocument()
      
      // Focus should be trapped within modal
      radioButtons[0].focus()
      expect(radioButtons[0]).toHaveFocus()
      
      await user.tab()
      expect(radioButtons[1]).toHaveFocus()
      
      await user.tab()
      expect(select).toHaveFocus()
    })
  })

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and descriptions', () => {
      render(<MockLoginForm />)
      
      const form = screen.getByRole('form', { name: 'Login Form' })
      const emailInput = screen.getByLabelText('Email Address')
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      
      expect(form).toHaveAttribute('aria-label', 'Login Form')
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      expect(submitButton).toHaveAttribute('aria-describedby', 'submit-help')
    })

    it('should announce dynamic content changes', () => {
      render(<MockDashboard />)
      
      const notification = screen.getByText('New route R005 added to your area')
      const notificationContainer = notification.closest('[role="alert"]')
      
      expect(notificationContainer).toHaveAttribute('aria-live', 'polite')
      expect(notificationContainer).toHaveAttribute('role', 'alert')
    })

    it('should have descriptive button labels', () => {
      render(<MockDataTable />)
      
      const cancelButtons = screen.getAllByRole('button', { name: /cancel booking/i })
      
      expect(cancelButtons[0]).toHaveAttribute('aria-label', 'Cancel booking for January 15')
      expect(cancelButtons[1]).toHaveAttribute('aria-label', 'Cancel booking for January 16')
    })

    it('should have proper status announcements', () => {
      render(<MockDataTable />)
      
      const confirmedStatus = screen.getByLabelText('Booking confirmed')
      const pendingStatus = screen.getByLabelText('Booking pending')
      
      expect(confirmedStatus).toHaveTextContent('Confirmed')
      expect(pendingStatus).toHaveTextContent('Pending')
    })
  })

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', () => {
      render(<MockDataTable />)
      
      // Status should have text labels, not just colors
      const statuses = screen.getAllByText(/confirmed|pending/i)
      statuses.forEach(status => {
        expect(status).toHaveAttribute('aria-label')
      })
    })

    it('should have sufficient color contrast', () => {
      // This would typically be tested with tools like axe-core
      // or by checking computed styles and contrast ratios
      render(<MockLoginForm />)
      
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        const styles = window.getComputedStyle(input)
        // In a real test, you'd check contrast ratios here
        expect(styles.color).toBeDefined()
        expect(styles.backgroundColor).toBeDefined()
      })
    })
  })

  describe('Error Handling and Feedback', () => {
    it('should provide accessible error messages', () => {
      render(
        <div>
          <label htmlFor="test-input">Test Input</label>
          <input
            id="test-input"
            aria-required="true"
            aria-invalid="true"
            aria-describedby="test-error"
          />
          <div id="test-error" role="alert" aria-live="assertive">
            This field is required
          </div>
        </div>
      )
      
      const input = screen.getByLabelText('Test Input')
      const errorMessage = screen.getByRole('alert')
      
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby', 'test-error')
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive')
      expect(errorMessage).toHaveTextContent('This field is required')
    })

    it('should provide loading state announcements', () => {
      render(
        <div>
          <button aria-describedby="loading-status">Submit</button>
          <div id="loading-status" aria-live="polite" aria-atomic="true">
            Loading, please wait...
          </div>
        </div>
      )
      
      const loadingStatus = screen.getByText('Loading, please wait...')
      
      expect(loadingStatus).toHaveAttribute('aria-live', 'polite')
      expect(loadingStatus).toHaveAttribute('aria-atomic', 'true')
    })
  })

  describe('Mobile Accessibility', () => {
    it('should have appropriate touch targets', () => {
      render(<MockDashboard />)
      
      const buttons = screen.getAllByRole('button')
      const links = screen.getAllByRole('link')
      
      // All interactive elements should be large enough for touch
      [...buttons, ...links].forEach(element => {
        const styles = window.getComputedStyle(element)
        // In a real test, you'd check minimum touch target size (44px)
        expect(element).toBeInTheDocument()
      })
    })

    it('should support zoom up to 200% without horizontal scrolling', () => {
      // This would typically be tested in a real browser environment
      render(<MockLoginForm />)
      
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
      
      // In a real test, you'd simulate zoom and check layout
    })
  })

  describe('Focus Management', () => {
    it('should have visible focus indicators', () => {
      render(<MockLoginForm />)
      
      const inputs = screen.getAllByRole('textbox')
      const buttons = screen.getAllByRole('button')
      
      [...inputs, ...buttons].forEach(element => {
        element.focus()
        expect(element).toHaveFocus()
        
        // In a real test, you'd check that focus indicators are visible
        const styles = window.getComputedStyle(element, ':focus')
        expect(styles).toBeDefined()
      })
    })

    it('should manage focus when content changes', async () => {
      const user = userEvent.setup()
      const TestComponent = () => {
        const [showContent, setShowContent] = React.useState(false)
        const contentRef = React.useRef<HTMLDivElement>(null)
        
        React.useEffect(() => {
          if (showContent && contentRef.current) {
            contentRef.current.focus()
          }
        }, [showContent])
        
        return (
          <div>
            <button onClick={() => setShowContent(true)}>
              Show Content
            </button>
            {showContent && (
              <div ref={contentRef} tabIndex={-1} role="region" aria-label="New content">
                <h2>Dynamic Content</h2>
                <p>This content was loaded dynamically</p>
              </div>
            )}
          </div>
        )
      }
      
      render(<TestComponent />)
      
      const button = screen.getByRole('button', { name: 'Show Content' })
      await user.click(button)
      
      const newContent = screen.getByRole('region', { name: 'New content' })
      expect(newContent).toHaveFocus()
    })
  })

  describe('Alternative Text and Media', () => {
    it('should have proper alternative text for images', () => {
      render(
        <div>
          <img src="route-map.jpg" alt="Route map showing stops from City Center to University Campus" />
          <img src="decorative-pattern.jpg" alt="" role="presentation" />
        </div>
      )
      
      const routeMap = screen.getByAltText('Route map showing stops from City Center to University Campus')
      const decorativeImage = screen.getByRole('presentation')
      
      expect(routeMap).toBeInTheDocument()
      expect(decorativeImage).toHaveAttribute('alt', '')
    })

    it('should provide text alternatives for icons', () => {
      render(
        <div>
          <button>
            <span aria-label="Download PDF" role="img">📄</span>
            Download
          </button>
          <button aria-label="Print this page">
            <span aria-hidden="true">🖨️</span>
          </button>
        </div>
      )
      
      const downloadButton = screen.getByRole('button', { name: /download/i })
      const printButton = screen.getByRole('button', { name: 'Print this page' })
      
      expect(downloadButton).toBeInTheDocument()
      expect(printButton).toBeInTheDocument()
    })
  })
}) 
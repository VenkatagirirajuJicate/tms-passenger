import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Toaster } from 'react-hot-toast'

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Common test utilities
export const testUtils = {
  // Mock API responses
  mockApiResponse: (data: any, status = 200) => ({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  }),

  // Mock error response
  mockApiError: (message: string, status = 500) => ({
    ok: false,
    status,
    json: () => Promise.resolve({ error: message }),
    text: () => Promise.resolve(JSON.stringify({ error: message })),
  }),

  // Wait for element to appear/disappear
  waitForCondition: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now()
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    if (!condition()) {
      throw new Error('Condition not met within timeout')
    }
  },

  // Mock student session
  mockStudentSession: (student: any = {}) => {
    const mockStudent = {
      id: 'test-student-id',
      studentName: 'Test Student',
      email: 'test@example.com',
      ...student,
    }

    const mockSession = {
      user: {
        user_metadata: {
          student_id: mockStudent.id,
          ...mockStudent,
        },
      },
      session: {
        expires_at: Date.now() + 3600000, // 1 hour from now
        access_token: 'mock-token',
      },
    }

    // Mock localStorage
    localStorage.setItem('student_session', JSON.stringify(mockSession))
    return mockSession
  },

  // Clear mocks
  clearAllMocks: () => {
    jest.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  },

  // Mock fetch responses
  setupFetchMock: (responses: Record<string, any>) => {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const endpoint = Object.keys(responses).find(key => url.includes(key))
      if (endpoint) {
        return Promise.resolve(testUtils.mockApiResponse(responses[endpoint]))
      }
      return Promise.resolve(testUtils.mockApiError('Not found', 404))
    })
  },

  // Mock successful Supabase operations
  mockSupabaseSuccess: (data: any) => ({
    data,
    error: null,
    count: Array.isArray(data) ? data.length : 1,
  }),

  // Mock Supabase errors
  mockSupabaseError: (message: string, code = 'UNKNOWN_ERROR') => ({
    data: null,
    error: {
      message,
      code,
      details: message,
      hint: null,
    },
    count: 0,
  }),

  // Generate test data
  generateTestData: {
    student: (overrides = {}) => ({
      id: `student-${Math.random().toString(36).substr(2, 9)}`,
      studentName: 'Test Student',
      rollNumber: 'TS001',
      email: 'test@example.com',
      mobile: '9876543210',
      firstLoginCompleted: true,
      profileCompletionPercentage: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }),

    route: (overrides = {}) => ({
      id: `route-${Math.random().toString(36).substr(2, 9)}`,
      routeNumber: 'R001',
      routeName: 'Test Route',
      startLocation: 'Start Point',
      endLocation: 'End Point',
      fare: 50,
      status: 'active',
      departureTime: '08:00:00',
      arrivalTime: '09:30:00',
      ...overrides,
    }),

    booking: (overrides = {}) => ({
      id: `booking-${Math.random().toString(36).substr(2, 9)}`,
      studentId: 'test-student-id',
      routeId: 'test-route-id',
      scheduleId: 'test-schedule-id',
      tripDate: new Date().toISOString().split('T')[0],
      boardingStop: 'Test Stop',
      amount: 50,
      status: 'confirmed',
      paymentStatus: 'paid',
      createdAt: new Date(),
      ...overrides,
    }),

    schedule: (overrides = {}) => ({
      id: `schedule-${Math.random().toString(36).substr(2, 9)}`,
      routeId: 'test-route-id',
      scheduleDate: new Date().toISOString().split('T')[0],
      departureTime: '08:00:00',
      arrivalTime: '09:30:00',
      availableSeats: 30,
      bookedSeats: 5,
      status: 'scheduled',
      ...overrides,
    }),

    grievance: (overrides = {}) => ({
      id: `grievance-${Math.random().toString(36).substr(2, 9)}`,
      studentId: 'test-student-id',
      category: 'complaint',
      grievanceType: 'service_complaint',
      subject: 'Test Grievance',
      description: 'This is a test grievance',
      status: 'open',
      priority: 'medium',
      createdAt: new Date(),
      ...overrides,
    }),

    notification: (overrides = {}) => ({
      id: `notification-${Math.random().toString(36).substr(2, 9)}`,
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      category: 'transport',
      targetAudience: 'students',
      isActive: true,
      createdAt: new Date(),
      ...overrides,
    }),
  },
}

// Custom matchers for testing
expect.extend({
  toBeInDocument(received) {
    const pass = received && document.body.contains(received)
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in document`,
      pass,
    }
  },
  
  toHaveLoadingState(received) {
    const pass = received && (
      received.querySelector('[data-testid="loading"]') ||
      received.querySelector('.animate-spin') ||
      received.textContent?.includes('Loading')
    )
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to have loading state`,
      pass,
    }
  },
})

export { testUtils as default } 
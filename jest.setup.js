import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_123456789'
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock fetch for API testing
global.fetch = jest.fn()

// Mock console warnings in tests
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  // Suppress specific warnings in tests
  if (
    args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
    args[0]?.includes?.('Warning: validateDOMNesting')
  ) {
    return
  }
  originalConsoleWarn(...args)
}

// Setup global test utilities
global.testUtils = {
  // Helper to create mock student data
  createMockStudent: (overrides = {}) => ({
    id: 'test-student-id',
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
  
  // Helper to create mock route data
  createMockRoute: (overrides = {}) => ({
    id: 'test-route-id',
    routeNumber: 'R001',
    routeName: 'Test Route',
    startLocation: 'Start Point',
    endLocation: 'End Point',
    fare: 50,
    status: 'active',
    ...overrides,
  }),
  
  // Helper to create mock booking data
  createMockBooking: (overrides = {}) => ({
    id: 'test-booking-id',
    studentId: 'test-student-id',
    routeId: 'test-route-id',
    scheduleId: 'test-schedule-id',
    tripDate: '2024-01-01',
    boardingStop: 'Test Stop',
    amount: 50,
    status: 'confirmed',
    paymentStatus: 'paid',
    createdAt: new Date(),
    ...overrides,
  }),
  
  // Helper to wait for async operations
  waitFor: (callback, options = {}) => {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 5000
      const interval = options.interval || 50
      const start = Date.now()
      
      const check = () => {
        try {
          const result = callback()
          if (result) {
            resolve(result)
          } else if (Date.now() - start > timeout) {
            reject(new Error('Timeout waiting for condition'))
          } else {
            setTimeout(check, interval)
          }
        } catch (error) {
          if (Date.now() - start > timeout) {
            reject(error)
          } else {
            setTimeout(check, interval)
          }
        }
      }
      
      check()
    })
  }
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.clear.mockClear()
  sessionStorageMock.clear.mockClear()
})

export {} 
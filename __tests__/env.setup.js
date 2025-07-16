// Environment setup for Jest tests
// This file runs before any imports to ensure environment variables are set

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.DaYlNEoUNEIjDPLdoweKQp-ZILzb0DG9OE7VNNWIUhg'
process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_1234567890'
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key_1234567890'
process.env.NODE_ENV = 'test'

// Mock window global for DOM testing
if (typeof window === 'undefined') {
  global.window = {}
}

// Mock performance API
global.performance = global.performance || {
  now: jest.fn(() => Date.now()),
}

// Mock BroadcastChannel for MSW
if (typeof BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(name) {
      this.name = name
    }
    postMessage(message) {
      // Mock implementation
    }
    addEventListener(type, listener) {
      // Mock implementation
    }
    removeEventListener(type, listener) {
      // Mock implementation
    }
    close() {
      // Mock implementation
    }
  }
}

// Mock crypto for Node.js environment
if (typeof crypto === 'undefined') {
  global.crypto = {
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
  }
}

// Mock TextEncoder/TextDecoder for Node.js
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder
}

// Mock Web APIs for Next.js
if (typeof Request === 'undefined') {
  global.Request = class MockRequest {
    constructor(url, options = {}) {
      this.url = url
      this.method = options.method || 'GET'
      this.headers = new Map(Object.entries(options.headers || {}))
      this.body = options.body || null
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
  }
}

if (typeof Response === 'undefined') {
  global.Response = class MockResponse {
    constructor(body, options = {}) {
      this.body = body
      this.status = options.status || 200
      this.statusText = options.statusText || 'OK'
      this.headers = new Map(Object.entries(options.headers || {}))
      this.ok = this.status >= 200 && this.status < 300
    }
    
    async json() {
      return JSON.parse(this.body || '{}')
    }
    
    async text() {
      return this.body || ''
    }
  }
}

if (typeof Headers === 'undefined') {
  global.Headers = class MockHeaders extends Map {
    get(name) {
      return super.get(name.toLowerCase())
    }
    
    set(name, value) {
      return super.set(name.toLowerCase(), value)
    }
    
    has(name) {
      return super.has(name.toLowerCase())
    }
    
    delete(name) {
      return super.delete(name.toLowerCase())
    }
  }
}

// Suppress console warnings during tests
const originalConsoleWarn = console.warn
console.warn = (...args) => {
  // Suppress specific warnings that are expected in tests
  const message = args[0]
  if (
    typeof message === 'string' && (
      message.includes('Warning: ReactDOM.render is no longer supported') ||
      message.includes('Warning: validateDOMNesting') ||
      message.includes('Warning: Each child in a list should have a unique "key" prop') ||
      message.includes('Supabase') ||
      message.includes('realtime')
    )
  ) {
    return
  }
  originalConsoleWarn.apply(console, args)
} 
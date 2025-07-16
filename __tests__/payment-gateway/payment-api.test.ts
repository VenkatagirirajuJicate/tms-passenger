import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

// Mock Next.js
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({
      json: () => Promise.resolve(data),
      status: options?.status || 200,
    })),
  },
}));

// Create a comprehensive mock query builder that handles all chaining patterns
const createMockQueryBuilder = () => {
  const builder = {
    select: jest.fn(),
    eq: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  };

  // Set up proper chaining - each method returns the builder for chaining
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);

  return builder;
};

// Create mock Supabase client
const mockQueryBuilder = createMockQueryBuilder();
const mockSupabase = {
  from: jest.fn(() => mockQueryBuilder),
};

jest.mock('@/lib/supabase', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

// Mock Razorpay functions
const mockCreatePaymentOrder = jest.fn();
const mockVerifyPaymentSignature = jest.fn();
const mockGetPaymentDetails = jest.fn();

jest.mock('@/lib/razorpay', () => ({
  createPaymentOrder: mockCreatePaymentOrder,
  verifyPaymentSignature: mockVerifyPaymentSignature,
  getPaymentDetails: mockGetPaymentDetails,
  RAZORPAY_CONFIG: {
    currency: 'INR',
    company_name: 'JKKN College of Engineering',
    theme_color: '#2196F3',
  },
}));

// Helper function to create mock NextRequest with proper methods
const createMockRequest = (body: any) => {
  const mockRequest = {
    json: jest.fn().mockResolvedValue(body),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    headers: {
      get: jest.fn((key: string) => null),
      set: jest.fn(),
      has: jest.fn(() => false),
      delete: jest.fn(),
      forEach: jest.fn(),
      entries: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
    },
    body: JSON.stringify(body),
    bodyUsed: false,
    cache: 'default' as RequestCache,
    credentials: 'same-origin' as RequestCredentials,
    destination: '' as RequestDestination,
    integrity: '',
    method: 'POST',
    mode: 'cors' as RequestMode,
    redirect: 'follow' as RequestRedirect,
    referrer: '',
    referrerPolicy: '' as ReferrerPolicy,
    signal: new AbortController().signal,
    url: 'http://localhost:3000/api/test',
  };
  
  // Add additional methods that might be needed
  mockRequest.json = jest.fn().mockResolvedValue(body);
  mockRequest.text = jest.fn().mockResolvedValue(JSON.stringify(body));
  
  return mockRequest;
};

describe('Payment API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all query builder mocks
    const newBuilder = createMockQueryBuilder();
    mockSupabase.from.mockReturnValue(newBuilder);
    
    // Set up default responses for different query patterns
    
    // For maybeSingle() calls (checking existing payments)
    newBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: null
    });
    
    // For single() calls (getting specific records)
    newBuilder.single.mockResolvedValue({
      data: { id: 'PAY001', amount: 5000 },
      error: null
    });
    
    // For insert().select().single() calls
    newBuilder.insert.mockImplementation((data) => {
      const insertBuilder = createMockQueryBuilder();
      insertBuilder.single.mockResolvedValue({
        data: [{ id: 'PAY001', ...data }],
        error: null
      });
      return insertBuilder;
    });
    
    // For update().eq().select().single() calls
    newBuilder.update.mockImplementation((data) => {
      const updateBuilder = createMockQueryBuilder();
      updateBuilder.eq.mockImplementation(() => {
        const eqBuilder = createMockQueryBuilder();
        eqBuilder.single.mockResolvedValue({
          data: [{ id: 'PAY001', ...data }],
          error: null
        });
        return eqBuilder;
      });
      return updateBuilder;
    });
    
    // For delete().eq() calls
    newBuilder.delete.mockImplementation(() => {
      const deleteBuilder = createMockQueryBuilder();
      deleteBuilder.eq.mockResolvedValue({
        data: null,
        error: null
      });
      return deleteBuilder;
    });
    
    // Update the mockQueryBuilder reference
    Object.assign(mockQueryBuilder, newBuilder);
  });

  describe('POST /api/payments/create-order', () => {
    test('creates payment order successfully', async () => {
      // Mock specific responses for this test
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null, // No existing payment
        error: null
      });
      
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: { id: 'FEE001', semester_fee: 5000, effective_from: '2024-01-01', effective_until: '2024-12-31' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'STU001', full_name: 'Test Student', email: 'test@example.com' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'ROUTE001', route_name: 'Test Route', route_number: 'RT001' },
          error: null
        });

      mockCreatePaymentOrder.mockResolvedValue({
        success: true,
        order: {
          id: 'order_test_123',
          amount: 500000,
          currency: 'INR',
          status: 'created',
        }
      });

      const { POST } = await import('@/app/api/payments/create-order/route');
      const mockRequest = createMockRequest({
        studentId: 'STU001',
        semesterFeeId: 'FEE001',
        routeId: 'ROUTE001',
        stopName: 'Main Gate',
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(200);
      expect(mockCreatePaymentOrder).toHaveBeenCalled();
    });

    test('handles missing required fields', async () => {
      const { POST } = await import('@/app/api/payments/create-order/route');
      const mockRequest = createMockRequest({
        studentId: 'STU001',
        // Missing required fields
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(400);
    });

    test('handles existing confirmed payment', async () => {
      // Mock existing confirmed payment
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'PAY001',
          payment_status: 'confirmed',
          razorpay_order_id: 'order_existing_123',
          created_at: '2023-01-01T00:00:00.000Z'
        },
        error: null
      });

      const { POST } = await import('@/app/api/payments/create-order/route');
      const mockRequest = createMockRequest({
        studentId: 'STU001',
        semesterFeeId: 'FEE001',
        routeId: 'ROUTE001',
        stopName: 'Main Gate',
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(409);
    });

    test('handles demo mode', async () => {
      // Set demo mode
      process.env.DEMO_MODE = 'true';
      
      // Mock successful responses
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });
      
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: { id: 'FEE001', semester_fee: 5000, effective_from: '2024-01-01', effective_until: '2024-12-31' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'STU001', full_name: 'Test Student', email: 'test@example.com' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'ROUTE001', route_name: 'Test Route', route_number: 'RT001' },
          error: null
        });

      const { POST } = await import('@/app/api/payments/create-order/route');
      const mockRequest = createMockRequest({
        studentId: 'STU001',
        semesterFeeId: 'FEE001',
        routeId: 'ROUTE001',
        stopName: 'Main Gate',
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(200);
      expect(mockCreatePaymentOrder).not.toHaveBeenCalled(); // Should not call real Razorpay in demo mode
      
      // Reset demo mode
      delete process.env.DEMO_MODE;
    });

    test('handles Razorpay order creation failure', async () => {
      // Mock successful database responses
      mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });
      
      mockQueryBuilder.single
        .mockResolvedValueOnce({
          data: { id: 'FEE001', semester_fee: 5000, effective_from: '2024-01-01', effective_until: '2024-12-31' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'STU001', full_name: 'Test Student', email: 'test@example.com' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'ROUTE001', route_name: 'Test Route', route_number: 'RT001' },
          error: null
        });

      mockCreatePaymentOrder.mockResolvedValue({
        success: false,
        error: 'Razorpay API error'
      });

      const { POST } = await import('@/app/api/payments/create-order/route');
      const mockRequest = createMockRequest({
        studentId: 'STU001',
        semesterFeeId: 'FEE001',
        routeId: 'ROUTE001',
        stopName: 'Main Gate',
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/payments/verify', () => {
    test('verifies payment successfully', async () => {
      // Mock payment record lookup
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: {
          id: 'PAY001',
          student_id: 'STU001',
          razorpay_order_id: 'order_test_123',
          amount_paid: 5000,
          payment_status: 'pending'
        },
        error: null
      });

      mockVerifyPaymentSignature.mockReturnValue(true);
      mockGetPaymentDetails.mockResolvedValue({
        success: true,
        payment: {
          id: 'pay_test_456',
          amount: 500000,
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          created_at: 1640995200,
        }
      });

      const { POST } = await import('@/app/api/payments/verify/route');
      const mockRequest = createMockRequest({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'valid_signature',
        paymentId: 'PAY001',
        isDemo: false,
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(200);
      expect(mockVerifyPaymentSignature).toHaveBeenCalledWith({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'valid_signature',
      });
    });

    test('handles invalid signature', async () => {
      mockVerifyPaymentSignature.mockReturnValue(false);

      const { POST } = await import('@/app/api/payments/verify/route');
      const mockRequest = createMockRequest({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'invalid_signature',
        paymentId: 'PAY001',
        isDemo: false,
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(400);
    });

    test('handles demo mode verification', async () => {
      const { POST } = await import('@/app/api/payments/verify/route');
      const mockRequest = createMockRequest({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'valid_signature',
        paymentId: 'PAY001',
        isDemo: true,
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(200);
      expect(mockVerifyPaymentSignature).not.toHaveBeenCalled();
    });

    test('handles payment not captured', async () => {
      // Mock payment record lookup
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: {
          id: 'PAY001',
          student_id: 'STU001',
          razorpay_order_id: 'order_test_123',
          amount_paid: 5000,
          payment_status: 'pending'
        },
        error: null
      });

      mockVerifyPaymentSignature.mockReturnValue(true);
      mockGetPaymentDetails.mockResolvedValue({
        success: true,
        payment: {
          id: 'pay_test_456',
          amount: 500000,
          currency: 'INR',
          status: 'failed',
          method: 'upi',
          created_at: 1640995200,
        }
      });

      const { POST } = await import('@/app/api/payments/verify/route');
      const mockRequest = createMockRequest({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'valid_signature',
        paymentId: 'PAY001',
        isDemo: false,
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(400);
    });

    test('handles amount mismatch', async () => {
      // Mock payment record lookup
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: {
          id: 'PAY001',
          student_id: 'STU001',
          razorpay_order_id: 'order_test_123',
          amount_paid: 5000,
          payment_status: 'pending'
        },
        error: null
      });

      mockVerifyPaymentSignature.mockReturnValue(true);
      mockGetPaymentDetails.mockResolvedValue({
        success: true,
        payment: {
          id: 'pay_test_456',
          amount: 100000, // Different amount
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          created_at: 1640995200,
        }
      });

      const { POST } = await import('@/app/api/payments/verify/route');
      const mockRequest = createMockRequest({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_456',
        razorpay_signature: 'valid_signature',
        paymentId: 'PAY001',
        isDemo: false,
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payments/config-check', () => {
    test('returns valid configuration', async () => {
      process.env.RAZORPAY_KEY_ID = 'test_key';
      process.env.RAZORPAY_KEY_SECRET = 'test_secret';
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'test_key';

      const { GET } = await import('@/app/api/payments/config-check/route');
      const response = await GET();
      
      expect(response.status).toBe(200);
    });

    test('handles missing environment variables', async () => {
      delete process.env.RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_SECRET;
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      const { GET } = await import('@/app/api/payments/config-check/route');
      const response = await GET();
      
      expect(response.status).toBe(200); // config-check returns 200 with config details
    });
  });

  describe('POST /api/payments/validate-account', () => {
    test('validates account successfully', async () => {
      // Mock fetch to return success
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          id: 'order_test_123',
          amount: 100,
          currency: 'INR',
          status: 'created'
        })
      });

      const { POST } = await import('@/app/api/payments/validate-account/route');
      const mockRequest = createMockRequest({
        keyId: 'test_key',
        keySecret: 'test_secret',
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(200);
    });

    test('handles invalid API keys', async () => {
      // Mock fetch to return error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: { description: 'Invalid API key' }
        })
      });

      const { POST } = await import('@/app/api/payments/validate-account/route');
      const mockRequest = createMockRequest({
        keyId: 'invalid_key',
        keySecret: 'invalid_secret',
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(200); // Still returns 200 but with validation: false
    });

    test('handles missing keys', async () => {
      const { POST } = await import('@/app/api/payments/validate-account/route');
      const mockRequest = createMockRequest({});

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(400);
    });

    test('handles network errors', async () => {
      // Mock fetch to throw error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const { POST } = await import('@/app/api/payments/validate-account/route');
      const mockRequest = createMockRequest({
        keyId: 'test_key',
        keySecret: 'test_secret',
      });

      const response = await POST(mockRequest as any);
      
      expect(response.status).toBe(500);
    });
  });
}); 
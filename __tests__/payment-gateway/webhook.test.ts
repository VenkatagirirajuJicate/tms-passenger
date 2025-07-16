import { NextRequest } from 'next/server';
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
    update: jest.fn(),
    single: jest.fn(),
  };

  // Set up proper chaining - each method returns the builder for chaining
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);

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

// Mock crypto for webhook signature verification
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('expected_signature'),
  })),
}));

// Helper function to set NODE_ENV safely
const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, 'NODE_ENV', {
    value,
    writable: true,
    configurable: true
  });
};

// Helper function to create mock NextRequest with proper methods
const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
  const mockRequest = {
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn((key: string) => headers[key] || null),
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
    url: 'http://localhost:3000/api/webhook',
  };
  
  return mockRequest;
};

describe('Razorpay Webhook Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset all query builder mocks
    const newBuilder = createMockQueryBuilder();
    mockSupabase.from.mockReturnValue(newBuilder);
    
    // Set up default responses for webhook operations
    
    // For single() calls (finding payment records)
    newBuilder.single.mockResolvedValue({
      data: {
        id: 'PAY001',
        payment_status: 'pending',
        student_id: 'STU001',
        amount_paid: 5000,
        razorpay_order_id: 'order_test_123'
      },
      error: null
    });
    
    // For update().eq() calls (updating payment status)
    newBuilder.update.mockImplementation((data) => {
      const updateBuilder = createMockQueryBuilder();
      updateBuilder.eq.mockResolvedValue({
        data: [{ id: 'PAY001', ...data }],
        error: null
      });
      return updateBuilder;
    });
    
    // Update the mockQueryBuilder reference
    Object.assign(mockQueryBuilder, newBuilder);
  });

  describe('POST /api/payments/webhook', () => {
    test('processes payment.captured webhook successfully', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('semester_payments');
    });

    test('processes payment.failed webhook successfully', async () => {
      const webhookPayload = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'failed',
              error_code: 'PAYMENT_DECLINED',
              error_description: 'Payment was declined by the bank'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('semester_payments');
    });

    test('processes order.paid webhook successfully', async () => {
      const webhookPayload = {
        event: 'order.paid',
        payload: {
          order: {
            entity: {
              id: 'order_test_123',
              amount: 50000,
              status: 'paid'
            }
          },
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
    });

    test('handles unhandled webhook events', async () => {
      const webhookPayload = {
        event: 'subscription.created',
        payload: {}
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
    });

    test('rejects webhook with invalid signature', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {}
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'invalid_signature'
      });

      // Mock crypto to return different signature
      const crypto = require('crypto');
      crypto.createHmac = jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('different_signature'),
      }));

      // Set production environment for signature verification
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      setNodeEnv('production');
      process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(400);
      
      // Reset environment
      setNodeEnv(originalEnv || 'test');
      process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
    });

    test('rejects webhook with missing signature', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      setNodeEnv('production');
      process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook_secret';

      const webhookPayload = {
        event: 'payment.captured',
        payload: {}
      };

      const mockRequest = createMockRequest(webhookPayload, {});

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(400);
      
      // Reset environment
      setNodeEnv(originalEnv || 'test');
      process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
    });

    test('skips signature verification in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      setNodeEnv('development');
      delete process.env.RAZORPAY_WEBHOOK_SECRET;

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {});

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      
      // Reset environment
      setNodeEnv(originalEnv || 'test');
    });

    test('handles payment record not found', async () => {
      // Mock payment record not found
      mockQueryBuilder.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      });

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200); // Should still return 200 to avoid retries
    });

    test('handles already confirmed payment', async () => {
      // Mock already confirmed payment
      mockQueryBuilder.single.mockResolvedValue({
        data: {
          id: 'PAY001',
          payment_status: 'confirmed',
          student_id: 'STU001',
          amount_paid: 5000,
          razorpay_order_id: 'order_test_123'
        },
        error: null
      });

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
      // Should not call update since payment is already confirmed
    });

    test('handles database update errors', async () => {
      // Mock database update error
      mockQueryBuilder.update.mockImplementation(() => {
        const updateBuilder = createMockQueryBuilder();
        updateBuilder.eq.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Update failed' }
        });
        return updateBuilder;
      });

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200); // Should still return 200 despite internal error
    });

    test('handles malformed JSON webhook payload', async () => {
      const mockRequest = {
        text: jest.fn().mockResolvedValue('invalid json'),
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        headers: {
          get: jest.fn().mockReturnValue('expected_signature'),
        },
      };

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(500);
    });

    test('handles webhook processing errors', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      // Mock an error during processing
      mockQueryBuilder.single.mockRejectedValue(new Error('Database connection failed'));

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(500);
    });

    test('handles missing webhook secret in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      setNodeEnv('production');
      delete process.env.RAZORPAY_WEBHOOK_SECRET;

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200); // Should skip signature verification
      
      // Reset environment
      setNodeEnv(originalEnv || 'test');
      process.env.RAZORPAY_WEBHOOK_SECRET = originalSecret;
    });

    test('handles webhook with empty payload', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {}
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
    });

    test('handles webhook with missing payment entity', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {}
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
    });

    test('processes webhook with custom headers', async () => {
      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test_456',
              order_id: 'order_test_123',
              amount: 50000,
              status: 'captured'
            }
          }
        }
      };

      const mockRequest = createMockRequest(webhookPayload, {
        'x-razorpay-signature': 'expected_signature',
        'user-agent': 'Razorpay/1.0.0',
        'x-forwarded-for': '127.0.0.1'
      });

      const { POST } = await import('@/app/api/payments/webhook/route');
      const response = await POST(mockRequest as any);

      expect(response.status).toBe(200);
    });
  });
}); 
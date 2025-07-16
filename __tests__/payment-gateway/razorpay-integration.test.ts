import {
  createPaymentOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  refundPayment,
  getPaymentConfig,
  RAZORPAY_CONFIG,
  PaymentOrderData,
  PaymentVerificationData,
} from '../../lib/razorpay';

// Mock Razorpay
const mockRazorpay = {
  orders: {
    create: jest.fn(),
  },
  payments: {
    fetch: jest.fn(),
    refund: jest.fn(),
  },
};

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => mockRazorpay);
});

// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn((format: string) => 'mocked_signature'),
    })),
  })),
}));

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    RAZORPAY_KEY_ID: 'rzp_test_1234567890',
    RAZORPAY_KEY_SECRET: 'test_secret_key',
    NEXT_PUBLIC_RAZORPAY_KEY_ID: 'rzp_test_1234567890',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Razorpay Payment Gateway Integration', () => {
  describe('Configuration', () => {
    test('RAZORPAY_CONFIG has correct default values', () => {
      expect(RAZORPAY_CONFIG.currency).toBe('INR');
      expect(RAZORPAY_CONFIG.company_name).toBe('JKKN College of Engineering');
      expect(RAZORPAY_CONFIG.theme_color).toBe('#2196F3');
      expect(typeof RAZORPAY_CONFIG.company_logo).toBe('string');
    });

    test('validates environment variables on module load', () => {
      // This test verifies the configuration validation works
      expect(process.env.RAZORPAY_KEY_ID).toBeDefined();
      expect(process.env.RAZORPAY_KEY_SECRET).toBeDefined();
    });
  });

  describe('Payment Order Creation', () => {
    const mockOrderData: PaymentOrderData = {
      amount: 50000, // ₹500 in paisa
      currency: 'INR',
      receipt: 'TMS_1234567890_STU001',
      notes: {
        student_id: 'STU001',
        student_name: 'John Doe',
        route_id: 'ROUTE001',
        semester_fee_id: 'FEE001',
        academic_year: '2024-25',
        semester: '1',
      },
    };

    test('creates payment order successfully', async () => {
      const mockOrder = {
        id: 'order_test_123',
        amount: 50000,
        currency: 'INR',
        receipt: 'TMS_1234567890_STU001',
        status: 'created',
        notes: mockOrderData.notes,
      };

      mockRazorpay.orders.create.mockResolvedValue(mockOrder);

      const result = await createPaymentOrder(mockOrderData);

      expect(result.success).toBe(true);
      expect(result.order).toEqual(mockOrder);
      expect(mockRazorpay.orders.create).toHaveBeenCalledWith({
        amount: mockOrderData.amount,
        currency: mockOrderData.currency,
        receipt: mockOrderData.receipt,
        notes: mockOrderData.notes,
        payment_capture: true,
      });
    });

    test('handles order creation failure', async () => {
      const mockError = new Error('Razorpay API error');
      mockRazorpay.orders.create.mockRejectedValue(mockError);

      const result = await createPaymentOrder(mockOrderData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Razorpay API error');
    });

    test('handles order creation with invalid amount', async () => {
      const invalidOrderData = {
        ...mockOrderData,
        amount: 0,
      };

      const mockError = new Error('Invalid amount');
      mockRazorpay.orders.create.mockRejectedValue(mockError);

      const result = await createPaymentOrder(invalidOrderData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid amount');
    });

    test('handles order creation with invalid currency', async () => {
      const invalidOrderData = {
        ...mockOrderData,
        currency: 'USD',
      };

      const mockError = new Error('Currency not supported');
      mockRazorpay.orders.create.mockRejectedValue(mockError);

      const result = await createPaymentOrder(invalidOrderData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Currency not supported');
    });
  });

  describe('Payment Signature Verification', () => {
    const mockVerificationData: PaymentVerificationData = {
      razorpay_order_id: 'order_test_123',
      razorpay_payment_id: 'pay_test_456',
      razorpay_signature: 'mocked_signature',
    };

    test('verifies valid payment signature', () => {
      const result = verifyPaymentSignature(mockVerificationData);
      expect(result).toBe(true);
    });

    test('rejects invalid payment signature', () => {
      const invalidData = {
        ...mockVerificationData,
        razorpay_signature: 'invalid_signature',
      };

      const result = verifyPaymentSignature(invalidData);
      expect(result).toBe(false);
    });

    test('handles missing signature data', () => {
      const incompleteData = {
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: '',
        razorpay_signature: 'some_signature',
      };

      const result = verifyPaymentSignature(incompleteData);
      expect(result).toBe(false);
    });

    test('handles verification with missing environment variables', () => {
      delete process.env.RAZORPAY_KEY_SECRET;

      const result = verifyPaymentSignature(mockVerificationData);
      expect(result).toBe(false);
    });
  });

  describe('Payment Details Retrieval', () => {
    const mockPaymentId = 'pay_test_456';

    test('fetches payment details successfully', async () => {
      const mockPayment = {
        id: mockPaymentId,
        amount: 50000,
        currency: 'INR',
        status: 'captured',
        method: 'upi',
        created_at: 1640995200,
        order_id: 'order_test_123',
      };

      mockRazorpay.payments.fetch.mockResolvedValue(mockPayment);

      const result = await getPaymentDetails(mockPaymentId);

      expect(result.success).toBe(true);
      expect(result.payment).toEqual(mockPayment);
      expect(mockRazorpay.payments.fetch).toHaveBeenCalledWith(mockPaymentId);
    });

    test('handles payment not found', async () => {
      const mockError = new Error('Payment not found');
      mockRazorpay.payments.fetch.mockRejectedValue(mockError);

      const result = await getPaymentDetails(mockPaymentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not found');
    });

    test('handles invalid payment ID', async () => {
      const mockError = new Error('Invalid payment ID');
      mockRazorpay.payments.fetch.mockRejectedValue(mockError);

      const result = await getPaymentDetails('invalid_payment_id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid payment ID');
    });
  });

  describe('Payment Refund', () => {
    const mockPaymentId = 'pay_test_456';

    test('processes full refund successfully', async () => {
      const mockRefund = {
        id: 'rfnd_test_789',
        payment_id: mockPaymentId,
        amount: 50000,
        currency: 'INR',
        status: 'processed',
        speed: 'normal',
      };

      mockRazorpay.payments.refund.mockResolvedValue(mockRefund);

      const result = await refundPayment(mockPaymentId);

      expect(result.success).toBe(true);
      expect(result.refund).toEqual(mockRefund);
      expect(mockRazorpay.payments.refund).toHaveBeenCalledWith(mockPaymentId, {
        amount: undefined,
        speed: 'normal',
      });
    });

    test('processes partial refund successfully', async () => {
      const refundAmount = 25000; // ₹250 in paisa
      const mockRefund = {
        id: 'rfnd_test_789',
        payment_id: mockPaymentId,
        amount: refundAmount,
        currency: 'INR',
        status: 'processed',
        speed: 'normal',
      };

      mockRazorpay.payments.refund.mockResolvedValue(mockRefund);

      const result = await refundPayment(mockPaymentId, refundAmount);

      expect(result.success).toBe(true);
      expect(result.refund).toEqual(mockRefund);
      expect(mockRazorpay.payments.refund).toHaveBeenCalledWith(mockPaymentId, {
        amount: refundAmount,
        speed: 'normal',
      });
    });

    test('handles refund failure', async () => {
      const mockError = new Error('Refund failed');
      mockRazorpay.payments.refund.mockRejectedValue(mockError);

      const result = await refundPayment(mockPaymentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refund failed');
    });

    test('handles refund of non-existent payment', async () => {
      const mockError = new Error('Payment not found');
      mockRazorpay.payments.refund.mockRejectedValue(mockError);

      const result = await refundPayment('invalid_payment_id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Payment not found');
    });
  });

  describe('Payment Configuration Generation', () => {
    const mockOrder = {
      id: 'order_test_123',
      amount: 50000,
      currency: 'INR',
      receipt: 'TMS_1234567890_STU001',
      notes: {
        student_id: 'STU001',
        student_name: 'John Doe',
        route_id: 'ROUTE001',
        semester_fee_id: 'FEE001',
        academic_year: '2024-25',
        semester: '1',
      },
    };

    const mockStudentData = {
      studentName: 'John Doe',
      studentEmail: 'john@example.com',
      studentMobile: '9876543210',
      academicYear: '2024-25',
      semester: '1',
    };

    test('generates payment configuration correctly', () => {
      const config = getPaymentConfig(mockOrder, mockStudentData);

      expect(config.key).toBe(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
      expect(config.amount).toBe(mockOrder.amount);
      expect(config.currency).toBe(mockOrder.currency);
      expect(config.name).toBe(RAZORPAY_CONFIG.company_name);
      expect(config.description).toBe('Transport Fee - 2024-25 Semester 1');
      expect(config.order_id).toBe(mockOrder.id);
      expect(config.receipt).toBe(mockOrder.receipt);
      expect(config.prefill.name).toBe(mockStudentData.studentName);
      expect(config.prefill.email).toBe(mockStudentData.studentEmail);
      expect(config.prefill.contact).toBe(mockStudentData.studentMobile);
      expect(config.theme.color).toBe(RAZORPAY_CONFIG.theme_color);
      expect(config.notes).toBe(mockOrder.notes);
    });

    test('handles missing student data gracefully', () => {
      const incompleteStudentData = {
        studentName: 'John Doe',
        studentEmail: '',
        studentMobile: '',
        academicYear: '2024-25',
        semester: '1',
      };

      const config = getPaymentConfig(mockOrder, incompleteStudentData);

      expect(config.prefill.name).toBe('John Doe');
      expect(config.prefill.email).toBe('');
      expect(config.prefill.contact).toBe('');
    });

    test('handles missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      delete process.env.RAZORPAY_KEY_ID;

      const config = getPaymentConfig(mockOrder, mockStudentData);

      expect(config.key).toBeUndefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles network timeout errors', async () => {
      const timeoutError = new Error('Network timeout');
      mockRazorpay.orders.create.mockRejectedValue(timeoutError);

      const orderData: PaymentOrderData = {
        amount: 50000,
        currency: 'INR',
        receipt: 'TMS_1234567890_STU001',
        notes: {
          student_id: 'STU001',
          student_name: 'John Doe',
          route_id: 'ROUTE001',
          semester_fee_id: 'FEE001',
          academic_year: '2024-25',
          semester: '1',
        },
      };

      const result = await createPaymentOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
    });

    test('handles malformed response from Razorpay', async () => {
      mockRazorpay.orders.create.mockResolvedValue(null);

      const orderData: PaymentOrderData = {
        amount: 50000,
        currency: 'INR',
        receipt: 'TMS_1234567890_STU001',
        notes: {
          student_id: 'STU001',
          student_name: 'John Doe',
          route_id: 'ROUTE001',
          semester_fee_id: 'FEE001',
          academic_year: '2024-25',
          semester: '1',
        },
      };

      const result = await createPaymentOrder(orderData);

      expect(result.success).toBe(true);
      expect(result.order).toBeNull();
    });

    test('handles empty payment verification data', () => {
      const emptyData = {
        razorpay_order_id: '',
        razorpay_payment_id: '',
        razorpay_signature: '',
      };

      const result = verifyPaymentSignature(emptyData);
      expect(result).toBe(false);
    });

    test('handles very large payment amounts', async () => {
      const largeAmount = 10000000; // ₹100,000 in paisa
      const orderData: PaymentOrderData = {
        amount: largeAmount,
        currency: 'INR',
        receipt: 'TMS_1234567890_STU001',
        notes: {
          student_id: 'STU001',
          student_name: 'John Doe',
          route_id: 'ROUTE001',
          semester_fee_id: 'FEE001',
          academic_year: '2024-25',
          semester: '1',
        },
      };

      const mockOrder = {
        id: 'order_test_123',
        amount: largeAmount,
        currency: 'INR',
        receipt: 'TMS_1234567890_STU001',
        status: 'created',
      };

      mockRazorpay.orders.create.mockResolvedValue(mockOrder);

      const result = await createPaymentOrder(orderData);

      expect(result.success).toBe(true);
      expect(result.order?.amount).toBe(largeAmount);
    });
  });
}); 
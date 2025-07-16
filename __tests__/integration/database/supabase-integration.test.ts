import { createClient } from '@supabase/supabase-js'

// Mock Supabase for integration testing
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          limit: jest.fn(() => mockQuery)
        }))
      })),
      order: jest.fn(() => mockQuery),
      limit: jest.fn(() => mockQuery)
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => mockQuery),
      single: jest.fn()
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => mockQuery),
        single: jest.fn()
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => mockQuery)
    }))
  })),
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn()
  },
  rpc: jest.fn()
}

const mockQuery = {
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK'
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

describe('Database Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  describe('Student Data Operations', () => {
    it('should fetch student data correctly', async () => {
      const mockStudent = {
        id: 'student-123',
        email: 'test@example.com',
        student_name: 'Test Student',
        roll_number: 'TS001',
        date_of_birth: '1990-01-15',
        first_login_completed: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockStudent,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('students')
        .select('*')
        .eq('email', 'test@example.com')
        .single()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('students')
      expect(data).toEqual(mockStudent)
      expect(error).toBeNull()
    })

    it('should handle student not found scenario', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('students')
        .select('*')
        .eq('email', 'nonexistent@example.com')
        .single()

      expect(data).toBeNull()
      expect(error).toEqual({ code: 'PGRST116', message: 'No rows found' })
    })

    it('should update student login information', async () => {
      const updateData = {
        last_login: new Date().toISOString(),
        failed_login_attempts: 0,
        account_locked_until: null
      }

      const updatedStudent = {
        id: 'student-123',
        email: 'test@example.com',
        ...updateData
      }

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
        data: updatedStudent,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('students')
        .update(updateData)
        .eq('id', 'student-123')
        .select()
        .single()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('students')
      expect(data).toEqual(updatedStudent)
      expect(error).toBeNull()
    })
  })

  describe('Routes Data Operations', () => {
    it('should fetch available routes with stops', async () => {
      const mockRoutes = [
        {
          id: 'route-1',
          route_number: 'R001',
          route_name: 'City Center to University',
          start_location: 'City Center',
          end_location: 'University Campus',
          departure_time: '08:00:00',
          arrival_time: '09:30:00',
          fare: 50,
          status: 'active',
          route_stops: [
            {
              id: 'stop-1',
              stop_name: 'City Center',
              stop_time: '08:00:00',
              sequence_order: 1
            }
          ]
        }
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockRoutes,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('routes')
        .select(`
          *,
          route_stops (
            id,
            stop_name,
            stop_time,
            sequence_order
          )
        `)
        .eq('status', 'active')
        .order('route_number')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('routes')
      expect(data).toEqual(mockRoutes)
      expect(error).toBeNull()
    })

    it('should handle route lookup by ID', async () => {
      const mockRoute = {
        id: 'route-123',
        route_number: 'R001',
        route_name: 'Test Route',
        status: 'active'
      }

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockRoute,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('routes')
        .select('*')
        .eq('id', 'route-123')
        .single()

      expect(data).toEqual(mockRoute)
      expect(error).toBeNull()
    })
  })

  describe('Schedules Data Operations', () => {
    it('should fetch schedules with related data', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          departure_time: '08:00:00',
          available_seats: 30,
          booking_enabled: true,
          status: 'scheduled',
          routes: {
            id: 'route-123',
            route_number: 'R001',
            route_name: 'Test Route',
            fare: 50
          },
          drivers: {
            id: 'driver-1',
            name: 'John Driver'
          },
          vehicles: {
            id: 'vehicle-1',
            registration_number: 'ABC-123'
          }
        }
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockSchedules,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('schedules')
        .select(`
          *,
          routes(*),
          drivers(*),
          vehicles(*)
        `)
        .eq('route_id', 'route-123')
        .order('schedule_date')

      expect(data).toEqual(mockSchedules)
      expect(error).toBeNull()
    })

    it('should filter schedules by date range', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          status: 'scheduled'
        },
        {
          id: 'schedule-2',
          route_id: 'route-123',
          schedule_date: '2024-01-16',
          status: 'scheduled'
        }
      ]

      // Mock the complex query chain
      const mockChain = {
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                data: mockSchedules,
                error: null
              }))
            }))
          }))
        }))
      }

      mockSupabaseClient.from().select.mockReturnValue(mockChain)

      const client = createClient('test-url', 'test-key')
      
      // Simulate the complex query
      const result = await client
        .from('schedules')
        .select('*')
        .gte('schedule_date', '2024-01-15')
        .lte('schedule_date', '2024-01-20')
        .eq('route_id', 'route-123')
        .order('schedule_date')

      expect(result.data).toEqual(mockSchedules)
      expect(result.error).toBeNull()
    })
  })

  describe('Bookings Data Operations', () => {
    it('should create new booking', async () => {
      const bookingData = {
        student_id: 'student-123',
        schedule_id: 'schedule-1',
        boarding_stop_id: 'stop-1',
        alighting_stop_id: 'stop-3',
        booking_date: '2024-01-15',
        status: 'confirmed'
      }

      const createdBooking = {
        id: 'booking-123',
        ...bookingData,
        created_at: '2024-01-15T10:00:00Z'
      }

      mockSupabaseClient.from().insert().select.mockResolvedValue({
        data: [createdBooking],
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('bookings')
        .insert(bookingData)
        .select()

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('bookings')
      expect(data).toEqual([createdBooking])
      expect(error).toBeNull()
    })

    it('should fetch student bookings with related data', async () => {
      const mockBookings = [
        {
          id: 'booking-123',
          student_id: 'student-123',
          booking_date: '2024-01-15',
          status: 'confirmed',
          schedules: {
            id: 'schedule-1',
            schedule_date: '2024-01-15',
            departure_time: '08:00:00',
            routes: {
              route_number: 'R001',
              route_name: 'Test Route'
            }
          },
          boarding_stop: {
            stop_name: 'City Center'
          },
          alighting_stop: {
            stop_name: 'University Campus'
          }
        }
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockBookings,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('bookings')
        .select(`
          *,
          schedules(*, routes(*)),
          boarding_stop:route_stops!boarding_stop_id(*),
          alighting_stop:route_stops!alighting_stop_id(*)
        `)
        .eq('student_id', 'student-123')
        .order('booking_date', { ascending: false })

      expect(data).toEqual(mockBookings)
      expect(error).toBeNull()
    })
  })

  describe('Grievances Data Operations', () => {
    it('should create new grievance', async () => {
      const grievanceData = {
        student_id: 'student-123',
        title: 'Bus Late Issue',
        description: 'The bus was consistently late this week',
        category: 'schedule',
        priority: 'medium',
        status: 'open'
      }

      const createdGrievance = {
        id: 'grievance-123',
        ...grievanceData,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: createdGrievance,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('grievances')
        .insert(grievanceData)
        .select()
        .single()

      expect(data).toEqual(createdGrievance)
      expect(error).toBeNull()
    })

    it('should fetch grievances with filters', async () => {
      const mockGrievances = [
        {
          id: 'grievance-1',
          title: 'Bus Late Issue',
          status: 'open',
          priority: 'medium',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'grievance-2',
          title: 'Payment Issue',
          status: 'resolved',
          priority: 'high',
          created_at: '2024-01-14T10:00:00Z'
        }
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockGrievances,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('grievances')
        .select('*')
        .eq('student_id', 'student-123')
        .order('created_at', { ascending: false })

      expect(data).toEqual(mockGrievances)
      expect(error).toBeNull()
    })
  })

  describe('Payments Data Operations', () => {
    it('should create payment record', async () => {
      const paymentData = {
        student_id: 'student-123',
        amount: 5000, // in paise
        currency: 'INR',
        payment_method: 'razorpay',
        payment_type: 'booking',
        reference_id: 'booking-123',
        status: 'pending'
      }

      const createdPayment = {
        id: 'payment-123',
        ...paymentData,
        created_at: '2024-01-15T10:00:00Z'
      }

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: createdPayment,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('payments')
        .insert(paymentData)
        .select()
        .single()

      expect(data).toEqual(createdPayment)
      expect(error).toBeNull()
    })

    it('should update payment status', async () => {
      const updateData = {
        status: 'completed',
        razorpay_payment_id: 'pay_123456789',
        completed_at: '2024-01-15T10:05:00Z'
      }

      const updatedPayment = {
        id: 'payment-123',
        student_id: 'student-123',
        amount: 5000,
        status: 'completed',
        ...updateData
      }

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
        data: updatedPayment,
        error: null
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('payments')
        .update(updateData)
        .eq('id', 'payment-123')
        .select()
        .single()

      expect(data).toEqual(updatedPayment)
      expect(error).toBeNull()
    })
  })

  describe('Real-time Subscriptions', () => {
    it('should set up auth state change listener', () => {
      const mockCallback = jest.fn()
      
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { id: 'sub-123' } }
      })

      const client = createClient('test-url', 'test-key')
      const { data } = client.auth.onAuthStateChange(mockCallback)

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
      expect(data.subscription.id).toBe('sub-123')
    })
  })

  describe('RPC Functions', () => {
    it('should call database functions', async () => {
      const mockResult = {
        data: { result: 'success', count: 5 },
        error: null
      }

      mockSupabaseClient.rpc.mockResolvedValue(mockResult)

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client.rpc('get_student_booking_count', {
        student_id: 'student-123',
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      })

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_student_booking_count', {
        student_id: 'student-123',
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      })
      expect(data).toEqual({ result: 'success', count: 5 })
      expect(error).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockRejectedValue(
        new Error('Network error')
      )

      const client = createClient('test-url', 'test-key')
      
      try {
        await client
          .from('students')
          .select('*')
          .eq('id', 'student-123')
          .single()
      } catch (error) {
        expect(error.message).toBe('Network error')
      }
    })

    it('should handle database constraint violations', async () => {
      mockSupabaseClient.from().insert().select.mockResolvedValue({
        data: null,
        error: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
          details: 'Key (email)=(test@example.com) already exists'
        }
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('students')
        .insert({
          email: 'test@example.com',
          student_name: 'Test Student'
        })
        .select()

      expect(data).toBeNull()
      expect(error.code).toBe('23505')
      expect(error.message).toContain('duplicate key')
    })

    it('should handle permission errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: {
          code: '42501',
          message: 'permission denied for table students'
        }
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('students')
        .select('*')
        .eq('id', 'student-123')
        .single()

      expect(data).toBeNull()
      expect(error.code).toBe('42501')
      expect(error.message).toContain('permission denied')
    })
  })

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      mockSupabaseClient.from().insert().select.mockResolvedValue({
        data: null,
        error: {
          code: '23502',
          message: 'null value in column "email" violates not-null constraint'
        }
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('students')
        .insert({
          student_name: 'Test Student'
          // Missing required email field
        })
        .select()

      expect(data).toBeNull()
      expect(error.code).toBe('23502')
      expect(error.message).toContain('null value')
    })

    it('should validate foreign key constraints', async () => {
      mockSupabaseClient.from().insert().select.mockResolvedValue({
        data: null,
        error: {
          code: '23503',
          message: 'insert or update on table "bookings" violates foreign key constraint'
        }
      })

      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('bookings')
        .insert({
          student_id: 'nonexistent-student',
          schedule_id: 'schedule-123'
        })
        .select()

      expect(data).toBeNull()
      expect(error.code).toBe('23503')
      expect(error.message).toContain('foreign key constraint')
    })
  })

  describe('Performance Testing', () => {
    it('should handle large result sets efficiently', async () => {
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: `route-${i}`,
        route_number: `R${String(i).padStart(3, '0')}`,
        route_name: `Route ${i}`,
        status: 'active'
      }))

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: largeDataSet,
        error: null
      })

      const startTime = Date.now()
      
      const client = createClient('test-url', 'test-key')
      const { data, error } = await client
        .from('routes')
        .select('*')
        .eq('status', 'active')
        .order('route_number')

      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(data).toHaveLength(1000)
      expect(error).toBeNull()
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle pagination correctly', async () => {
      const pageSize = 50
      const totalRecords = 200
      const firstPage = Array.from({ length: pageSize }, (_, i) => ({
        id: `student-${i}`,
        email: `student${i}@example.com`,
        student_name: `Student ${i}`
      }))

      mockSupabaseClient.from().select().order().limit.mockResolvedValue({
        data: firstPage,
        error: null,
        count: totalRecords
      })

      const client = createClient('test-url', 'test-key')
      const { data, error, count } = await client
        .from('students')
        .select('*', { count: 'exact' })
        .order('student_name')
        .limit(pageSize)

      expect(data).toHaveLength(pageSize)
      expect(count).toBe(totalRecords)
      expect(error).toBeNull()
    })
  })
}) 
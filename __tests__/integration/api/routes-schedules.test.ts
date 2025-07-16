import { NextRequest } from 'next/server'
import { GET as availableRoutesHandler } from '@/app/api/routes/available/route'
import { GET as routeStopsHandler } from '@/app/api/routes/[routeId]/stops/route'
import { GET as scheduleAvailabilityHandler } from '@/app/api/schedules/availability/route'
import { GET as specificDateHandler } from '@/app/api/schedules/specific-date/route'

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          single: jest.fn()
        })),
        gte: jest.fn(() => ({
          lte: jest.fn(() => ({
            in: jest.fn(() => ({
              order: jest.fn(() => mockQuery)
            }))
          }))
        }))
      })),
      order: jest.fn(() => mockQuery),
      in: jest.fn(() => ({
        order: jest.fn(() => mockQuery)
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          in: jest.fn(() => ({
            order: jest.fn(() => mockQuery)
          }))
        }))
      })),
      lte: jest.fn(() => ({
        in: jest.fn(() => ({
          order: jest.fn(() => mockQuery)
        }))
      }))
    }))
  }))
}

const mockQuery = {
  single: jest.fn(),
  order: jest.fn(() => mockQuery),
  limit: jest.fn(() => mockQuery),
  range: jest.fn(() => mockQuery)
}

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}))

describe('Routes and Schedules API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  describe('GET /api/routes/available', () => {
    it('should return all active routes with stops', async () => {
      const mockRoutes = [
        {
          id: 'route-1',
          route_number: 'R001',
          route_name: 'City Center to University',
          start_location: 'City Center',
          end_location: 'University Campus',
          departure_time: '08:00:00',
          arrival_time: '09:30:00',
          duration: 90,
          distance: 25.5,
          fare: 50,
          total_capacity: 35,
          current_passengers: 20,
          status: 'active',
          route_stops: [
            {
              id: 'stop-1',
              stop_name: 'City Center',
              stop_time: '08:00:00',
              sequence_order: 1,
              is_major_stop: true
            },
            {
              id: 'stop-2',
              stop_name: 'Metro Station',
              stop_time: '08:15:00',
              sequence_order: 2,
              is_major_stop: false
            },
            {
              id: 'stop-3',
              stop_name: 'University Campus',
              stop_time: '09:30:00',
              sequence_order: 3,
              is_major_stop: true
            }
          ]
        },
        {
          id: 'route-2',
          route_number: 'R002',
          route_name: 'Airport to University',
          start_location: 'Airport',
          end_location: 'University Campus',
          departure_time: '07:30:00',
          arrival_time: '09:00:00',
          duration: 90,
          distance: 30.0,
          fare: 75,
          total_capacity: 40,
          current_passengers: 15,
          status: 'active',
          route_stops: [
            {
              id: 'stop-4',
              stop_name: 'Airport',
              stop_time: '07:30:00',
              sequence_order: 1,
              is_major_stop: true
            },
            {
              id: 'stop-5',
              stop_name: 'Highway Junction',
              stop_time: '08:00:00',
              sequence_order: 2,
              is_major_stop: false
            },
            {
              id: 'stop-6',
              stop_name: 'University Campus',
              stop_time: '09:00:00',
              sequence_order: 3,
              is_major_stop: true
            }
          ]
        }
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockRoutes,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/routes/available')
      const response = await availableRoutesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.routes).toHaveLength(2)
      expect(data.count).toBe(2)
      
      // Check route structure
      expect(data.routes[0]).toEqual(expect.objectContaining({
        id: 'route-1',
        route_number: 'R001',
        route_name: 'City Center to University',
        fare: 50,
        route_stops: expect.arrayContaining([
          expect.objectContaining({
            stop_name: 'City Center',
            sequence_order: 1
          })
        ])
      }))

      // Check stops are sorted by sequence_order
      expect(data.routes[0].route_stops[0].sequence_order).toBe(1)
      expect(data.routes[0].route_stops[1].sequence_order).toBe(2)
      expect(data.routes[0].route_stops[2].sequence_order).toBe(3)
    })

    it('should return empty array when no active routes exist', async () => {
      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null
      })

      const response = await availableRoutesHandler()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.routes).toHaveLength(0)
      expect(data.count).toBe(0)
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed', code: 'CONNECTION_ERROR' }
      })

      const response = await availableRoutesHandler()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch routes')
    })

    it('should handle server configuration errors', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.SUPABASE_SERVICE_ROLE_KEY

      const response = await availableRoutesHandler()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Server configuration error')
    })
  })

  describe('GET /api/routes/[routeId]/stops', () => {
    it('should return stops for a valid route', async () => {
      const mockRoute = {
        id: 'route-123',
        route_number: 'R001',
        route_name: 'Test Route',
        status: 'active'
      }

      const mockStops = [
        {
          id: 'stop-1',
          stop_name: 'Start Point',
          stop_time: '08:00:00',
          sequence_order: 1,
          is_major_stop: true
        },
        {
          id: 'stop-2',
          stop_name: 'Middle Stop',
          stop_time: '08:30:00',
          sequence_order: 2,
          is_major_stop: false
        },
        {
          id: 'stop-3',
          stop_name: 'End Point',
          stop_time: '09:00:00',
          sequence_order: 3,
          is_major_stop: true
        }
      ]

      // Mock route verification
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockRoute,
        error: null
      })

      // Mock stops query
      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockStops,
        error: null
      })

      const response = await routeStopsHandler(
        new NextRequest('http://localhost:3000/api/routes/route-123/stops'),
        { params: Promise.resolve({ routeId: 'route-123' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.route).toEqual(mockRoute)
      expect(data.stops).toHaveLength(3)
      expect(data.stops[0].sequence_order).toBe(1)
      expect(data.stops[2].sequence_order).toBe(3)
    })

    it('should return 404 for non-existent route', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const response = await routeStopsHandler(
        new NextRequest('http://localhost:3000/api/routes/invalid-route/stops'),
        { params: Promise.resolve({ routeId: 'invalid-route' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Route not found')
    })

    it('should validate route ID parameter', async () => {
      const response = await routeStopsHandler(
        new NextRequest('http://localhost:3000/api/routes//stops'),
        { params: Promise.resolve({ routeId: '' }) }
      )
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Route ID is required')
    })
  })

  describe('GET /api/schedules/availability', () => {
    it('should return available schedules for a route', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          departure_time: '08:00:00',
          arrival_time: '09:30:00',
          available_seats: 30,
          booked_seats: 5,
          total_seats: 35,
          booking_enabled: true,
          admin_scheduling_enabled: true,
          booking_deadline: null,
          special_instructions: null,
          status: 'scheduled',
          driver_id: 'driver-1',
          vehicle_id: 'vehicle-1',
          routes: {
            id: 'route-123',
            route_number: 'R001',
            route_name: 'Test Route',
            start_location: 'Start',
            end_location: 'End',
            fare: 50,
            total_capacity: 35,
            status: 'active'
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

      const mockSettings = {
        settings_data: {
          enableBookingTimeWindow: true,
          bookingWindowEndHour: 19,
          bookingWindowDaysBefore: 1
        }
      }

      // Mock schedules query
      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockResolvedValueOnce({
        data: mockSchedules,
        error: null
      })

      // Mock settings query
      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockSettings,
        error: null
      })

      const request = new NextRequest(
        'http://localhost:3000/api/schedules/availability?routeId=route-123&startDate=2024-01-15&endDate=2024-01-20&studentId=student-123'
      )
      const response = await scheduleAvailabilityHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(1)
      expect(data[0]).toEqual(expect.objectContaining({
        id: 'schedule-1',
        route_id: 'route-123',
        schedule_date: '2024-01-15',
        available_seats: 30,
        is_booking_available: expect.any(Boolean),
        is_booking_window_open: expect.any(Boolean)
      }))
    })

    it('should require routeId parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/schedules/availability')
      const response = await scheduleAvailabilityHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Route ID is required')
    })

    it('should use default date range when not provided', async () => {
      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockResolvedValue({
        data: [],
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest('http://localhost:3000/api/schedules/availability?routeId=route-123')
      const response = await scheduleAvailabilityHandler(request)
      
      expect(response.status).toBe(200)
      expect(mockSupabaseClient.from().select().eq().gte).toHaveBeenCalled()
    })

    it('should filter schedules with inactive routes', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          available_seats: 30,
          routes: { status: 'active' }
        },
        {
          id: 'schedule-2',
          route_id: 'route-456',
          schedule_date: '2024-01-15',
          available_seats: 25,
          routes: { status: 'inactive' }
        }
      ]

      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockResolvedValue({
        data: mockSchedules,
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest('http://localhost:3000/api/schedules/availability?routeId=route-123')
      const response = await scheduleAvailabilityHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // Should only return schedules with active routes
      expect(data).toHaveLength(1)
      expect(data[0].id).toBe('schedule-1')
    })
  })

  describe('GET /api/schedules/specific-date', () => {
    it('should return schedules for a specific date', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          departure_time: '08:00:00',
          arrival_time: '09:30:00',
          available_seats: 30,
          booked_seats: 5,
          status: 'scheduled',
          routes: {
            id: 'route-123',
            route_number: 'R001',
            route_name: 'Test Route',
            status: 'active'
          }
        }
      ]

      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: mockSchedules,
        error: null
      })

      const request = new NextRequest(
        'http://localhost:3000/api/schedules/specific-date?routeId=route-123&scheduleDate=2024-01-15'
      )
      const response = await specificDateHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.schedules).toHaveLength(1)
      expect(data.schedules[0]).toEqual(expect.objectContaining({
        id: 'schedule-1',
        schedule_date: '2024-01-15',
        is_booking_available: expect.any(Boolean)
      }))
    })

    it('should require both routeId and scheduleDate parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/schedules/specific-date?routeId=route-123')
      const response = await specificDateHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Route ID and schedule date are required')
    })

    it('should handle no schedules found for date', async () => {
      mockSupabaseClient.from().select().eq().order.mockResolvedValue({
        data: [],
        error: null
      })

      const request = new NextRequest(
        'http://localhost:3000/api/schedules/specific-date?routeId=route-123&scheduleDate=2024-01-15'
      )
      const response = await specificDateHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.schedules).toHaveLength(0)
      expect(data.message).toBe('No schedules found for this date')
    })
  })

  describe('Booking Window and Availability Logic', () => {
    it('should calculate booking availability based on admin settings', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          departure_time: '08:00:00',
          available_seats: 30,
          booking_enabled: true,
          status: 'scheduled',
          routes: { status: 'active' }
        }
      ]

      const mockSettings = {
        settings_data: {
          enableBookingTimeWindow: true,
          bookingWindowEndHour: 19, // 7 PM cutoff
          bookingWindowDaysBefore: 1 // Must book at least 1 day before
        }
      }

      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockResolvedValue({
        data: mockSchedules,
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: mockSettings,
        error: null
      })

      const request = new NextRequest('http://localhost:3000/api/schedules/availability?routeId=route-123')
      const response = await scheduleAvailabilityHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0]).toHaveProperty('is_booking_window_open')
      expect(data[0]).toHaveProperty('is_booking_available')
    })

    it('should handle disabled booking schedules', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          available_seats: 30,
          booking_enabled: false, // Booking disabled
          status: 'scheduled',
          routes: { status: 'active' }
        }
      ]

      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockResolvedValue({
        data: mockSchedules,
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest('http://localhost:3000/api/schedules/availability?routeId=route-123')
      const response = await scheduleAvailabilityHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0].is_booking_available).toBe(false)
    })

    it('should handle schedules with no available seats', async () => {
      const mockSchedules = [
        {
          id: 'schedule-1',
          route_id: 'route-123',
          schedule_date: '2024-01-15',
          available_seats: 0, // No seats available
          booking_enabled: true,
          status: 'scheduled',
          routes: { status: 'active' }
        }
      ]

      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockResolvedValue({
        data: mockSchedules,
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const request = new NextRequest('http://localhost:3000/api/schedules/availability?routeId=route-123')
      const response = await scheduleAvailabilityHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data[0].is_booking_available).toBe(false)
    })
  })

  describe('Error Handling and Performance', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeScheduleSet = Array.from({ length: 100 }, (_, i) => ({
        id: `schedule-${i}`,
        route_id: 'route-123',
        schedule_date: '2024-01-15',
        available_seats: 30,
        status: 'scheduled',
        routes: { status: 'active' }
      }))

      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockResolvedValue({
        data: largeScheduleSet,
        error: null
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })

      const startTime = Date.now()
      const request = new NextRequest('http://localhost:3000/api/schedules/availability?routeId=route-123')
      const response = await scheduleAvailabilityHandler(request)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle database timeout errors', async () => {
      mockSupabaseClient.from().select().eq().gte().lte().in().order.mockRejectedValue(
        new Error('Query timeout')
      )

      const request = new NextRequest('http://localhost:3000/api/schedules/availability?routeId=route-123')
      const response = await scheduleAvailabilityHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch schedules')
    })

    it('should validate date format parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/schedules/specific-date?routeId=route-123&scheduleDate=invalid-date'
      )

      // This should not crash the handler
      const response = await specificDateHandler(request)
      
      // The response should either handle the invalid date gracefully or return an error
      expect([200, 400, 500]).toContain(response.status)
    })
  })
}) 
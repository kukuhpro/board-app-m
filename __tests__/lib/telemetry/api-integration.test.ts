import { NextRequest } from 'next/server'

// Mock Supabase and use cases before importing the route
jest.mock('@/lib/supabase/auth-helpers', () => ({
  getUser: jest.fn(),
}))

jest.mock('@/application/useCases/GetJobsUseCase', () => ({
  GetJobsUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      data: {
        jobs: [
          {
            id: '1',
            title: 'Test Job',
            company: 'Test Company',
            location: 'Test Location',
            jobType: 'Full-Time',
          },
        ],
        total: 1,
        hasMore: false,
      },
    }),
  })),
}))

jest.mock('@/application/useCases/CreateJobUseCase', () => ({
  CreateJobUseCase: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      job: {
        id: 'new-job-id',
        title: 'New Job',
        company: 'New Company',
      },
    }),
  })),
}))

// Mock telemetry
jest.mock('@/lib/telemetry/tracer', () => ({
  withSpan: jest.fn((name, fn) =>
    fn({
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    })
  ),
  addSpanAttributes: jest.fn(),
  getTracer: jest.fn(() => ({
    startSpan: jest.fn(() => ({
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
    })),
  })),
  getMeter: jest.fn(() => ({
    createCounter: jest.fn(() => ({ add: jest.fn() })),
    createHistogram: jest.fn(() => ({ record: jest.fn() })),
    createUpDownCounter: jest.fn(() => ({ add: jest.fn() })),
  })),
}))

describe('API Route Telemetry Integration', () => {
  let GET: any
  let POST: any

  beforeEach(() => {
    jest.clearAllMocks()
    // Import route handlers after mocks are set up
    jest.isolateModules(() => {
      const routeModule = require('../../../app/api/jobs/route')
      GET = routeModule.GET
      POST = routeModule.POST
    })
  })

  describe('GET /api/jobs with telemetry', () => {
    it('should trace GET requests', async () => {
      const { withSpan, addSpanAttributes } = require('@/lib/telemetry/tracer')

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/jobs?page=1&limit=10',
        nextUrl: {
          searchParams: new URLSearchParams({
            page: '1',
            limit: '10',
          }),
        },
        headers: new Headers({
          'host': 'localhost:3000',
        }),
      } as unknown as NextRequest

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Verify telemetry was called
      expect(withSpan).toHaveBeenCalledWith(
        'GetJobsUseCase.execute',
        expect.any(Function)
      )

      // Verify attributes were added
      expect(addSpanAttributes).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'jobs.query.page': 1,
          'jobs.query.limit': 10,
        })
      )

      expect(addSpanAttributes).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'jobs.result.count': 1,
          'jobs.result.total': 1,
          'jobs.result.hasMore': false,
        })
      )
    })

    it('should handle filters in telemetry', async () => {
      const { addSpanAttributes } = require('@/lib/telemetry/tracer')
      addSpanAttributes.mockClear()

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/jobs',
        nextUrl: {
          searchParams: new URLSearchParams({
            location: 'Remote',
            jobType: 'Full-Time',
            search: 'developer',
          }),
        },
        headers: new Headers(),
      } as unknown as NextRequest

      await GET(mockRequest)

      expect(addSpanAttributes).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'jobs.query.location': 'Remote',
          'jobs.query.jobType': 'Full-Time',
          'jobs.query.searchTerm': 'developer',
        })
      )
    })
  })

  describe('POST /api/jobs with telemetry', () => {
    it('should trace POST requests', async () => {
      const { getUser } = require('@/lib/supabase/auth-helpers')
      const { withSpan, addSpanAttributes } = require('@/lib/telemetry/tracer')

      getUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      })

      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:3000/api/jobs',
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: jest.fn().mockResolvedValue({
          title: 'New Job',
          company: 'New Company',
          description: 'Job description',
          location: 'Remote',
          jobType: 'Full-Time',
        }),
      } as unknown as NextRequest

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)

      // Verify telemetry was called
      expect(withSpan).toHaveBeenCalledWith(
        'CreateJobUseCase.execute',
        expect.any(Function)
      )

      // Verify attributes were added
      expect(addSpanAttributes).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'jobs.create.userId': 'user-123',
          'jobs.create.jobType': 'Full-Time',
          'jobs.create.location': 'Remote',
        })
      )

      expect(addSpanAttributes).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'jobs.create.jobId': 'new-job-id',
          'jobs.create.success': true,
        })
      )
    })

    it('should trace authentication failures', async () => {
      const { getUser } = require('@/lib/supabase/auth-helpers')
      getUser.mockResolvedValue(null)

      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:3000/api/jobs',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest

      const response = await POST(mockRequest)

      expect(response.status).toBe(401)
    })

    it('should trace validation failures', async () => {
      const { getUser } = require('@/lib/supabase/auth-helpers')
      const { addSpanAttributes } = require('@/lib/telemetry/tracer')

      getUser.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
      })

      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:3000/api/jobs',
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({
          // Missing required fields
          title: '',
        }),
      } as unknown as NextRequest

      const response = await POST(mockRequest)

      expect(response.status).toBe(422)

      // Should not call the use case span since validation failed
      expect(addSpanAttributes).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'jobs.create.userId': expect.any(String),
        })
      )
    })
  })

  describe('Context propagation', () => {
    it('should propagate context between frontend and backend spans', async () => {
      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/jobs',
        nextUrl: {
          searchParams: new URLSearchParams(),
        },
        headers: new Headers({
          'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
          'tracestate': 'congo=t61rcWkgMzE',
        }),
      } as unknown as NextRequest

      await GET(mockRequest)

      // The withSpan function should be called, indicating telemetry is active
      const { withSpan } = require('@/lib/telemetry/tracer')
      expect(withSpan).toHaveBeenCalled()
    })
  })
})
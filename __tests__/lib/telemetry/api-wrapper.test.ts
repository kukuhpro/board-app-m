/**
 * @jest-environment node
 */
import { SpanKind } from '@opentelemetry/api'

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    method: init?.method || 'GET',
    url,
    headers: new Map(Object.entries(init?.headers || {})),
    nextUrl: {
      searchParams: new URLSearchParams(),
    },
    json: jest.fn(),
  })),
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      headers: new Map(),
      json: jest.fn().mockResolvedValue(data),
    })),
  },
}))

// Mock the tracer module
jest.mock('@/lib/telemetry/tracer', () => ({
  withSpan: jest.fn((name, fn, options) => fn({
    setAttribute: jest.fn(),
    setStatus: jest.fn(),
    recordException: jest.fn(),
  })),
  addSpanAttributes: jest.fn(),
  getMeter: jest.fn(() => ({
    createCounter: jest.fn(() => ({
      add: jest.fn(),
    })),
    createHistogram: jest.fn(() => ({
      record: jest.fn(),
    })),
    createUpDownCounter: jest.fn(() => ({
      add: jest.fn(),
    })),
  })),
}))

import { withTelemetry, createApiMetrics } from '@/lib/telemetry/api-wrapper'

describe('API Telemetry Wrapper', () => {
  describe('withTelemetry', () => {
    it('should wrap API handler and add telemetry', async () => {
      const { NextResponse } = require('next/server')
      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true }, { status: 200 })
      )

      const wrappedHandler = withTelemetry(mockHandler)

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/test',
        headers: {
          get: (key: string) => {
            const headers: any = {
              'host': 'localhost:3000',
              'user-agent': 'test-agent',
            }
            return headers[key]
          }
        },
      } as any

      const response = await wrappedHandler(mockRequest)

      expect(mockHandler).toHaveBeenCalledWith(mockRequest)
      expect(response.status).toBe(200)
    })

    it('should use custom span name when provided', async () => {
      const { withSpan } = require('@/lib/telemetry/tracer')
      withSpan.mockClear()

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      )

      const wrappedHandler = withTelemetry(mockHandler, {
        spanName: 'custom-span-name',
      })

      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:3000/api/test',
        headers: new Headers(),
      } as unknown as NextRequest

      await wrappedHandler(mockRequest)

      expect(withSpan).toHaveBeenCalledWith(
        'custom-span-name',
        expect.any(Function),
        expect.objectContaining({
          kind: SpanKind.SERVER,
        })
      )
    })

    it('should add request attributes to span', async () => {
      const { addSpanAttributes } = require('@/lib/telemetry/tracer')
      addSpanAttributes.mockClear()

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true })
      )

      const wrappedHandler = withTelemetry(mockHandler, {
        attributes: {
          'custom.attribute': 'value',
        },
      })

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/test?param=value',
        headers: new Headers({
          'host': 'localhost:3000',
          'user-agent': 'Mozilla/5.0',
        }),
      } as unknown as NextRequest

      await wrappedHandler(mockRequest)

      expect(addSpanAttributes).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'http.method': 'GET',
          'http.url': 'http://localhost:3000/api/test?param=value',
          'http.target': '/api/test',
          'http.scheme': 'http',
          'http.host': 'localhost:3000',
          'http.user_agent': 'Mozilla/5.0',
          'custom.attribute': 'value',
        })
      )
    })

    it('should add response attributes to span', async () => {
      const { addSpanAttributes } = require('@/lib/telemetry/tracer')
      addSpanAttributes.mockClear()

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ data: 'test' }, { status: 201 })
      )

      const wrappedHandler = withTelemetry(mockHandler)

      const mockRequest = {
        method: 'POST',
        url: 'http://localhost:3000/api/test',
        headers: new Headers(),
      } as unknown as NextRequest

      const response = await wrappedHandler(mockRequest)

      expect(addSpanAttributes).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          'http.status_code': 201,
        })
      )

      expect(response.status).toBe(201)
    })

    it('should handle errors and record exceptions', async () => {
      const mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
      }

      const { withSpan, addSpanAttributes } = require('@/lib/telemetry/tracer')
      withSpan.mockImplementationOnce((name, fn) => fn(mockSpan))

      const testError = new Error('API handler error')
      const mockHandler = jest.fn().mockRejectedValue(testError)

      const wrappedHandler = withTelemetry(mockHandler)

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/test',
        headers: new Headers(),
      } as unknown as NextRequest

      await expect(wrappedHandler(mockRequest)).rejects.toThrow('API handler error')

      expect(mockSpan.recordException).toHaveBeenCalledWith(testError)
      expect(addSpanAttributes).toHaveBeenCalledWith(
        mockSpan,
        expect.objectContaining({
          'error': true,
          'error.message': 'API handler error',
        })
      )
    })

    it('should mark 4xx and 5xx responses as errors', async () => {
      const mockSpan = {
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
        recordException: jest.fn(),
      }

      const { withSpan } = require('@/lib/telemetry/tracer')
      withSpan.mockImplementationOnce((name, fn) => fn(mockSpan))

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ error: 'Not found' }, { status: 404 })
      )

      const wrappedHandler = withTelemetry(mockHandler)

      const mockRequest = {
        method: 'GET',
        url: 'http://localhost:3000/api/test',
        headers: new Headers(),
      } as unknown as NextRequest

      await wrappedHandler(mockRequest)

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: expect.any(Number),
        message: 'HTTP 404',
      })
    })
  })

  describe('createApiMetrics', () => {
    it('should create metrics collectors', () => {
      const metrics = createApiMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.recordRequest).toBeDefined()
      expect(metrics.incrementActiveRequests).toBeDefined()
      expect(metrics.decrementActiveRequests).toBeDefined()
    })

    it('should record request metrics', () => {
      const mockCounter = { add: jest.fn() }
      const mockHistogram = { record: jest.fn() }

      const { getMeter } = require('@/lib/telemetry/tracer')
      getMeter.mockReturnValueOnce({
        createCounter: jest.fn(() => mockCounter),
        createHistogram: jest.fn(() => mockHistogram),
        createUpDownCounter: jest.fn(() => ({ add: jest.fn() })),
      })

      const metrics = createApiMetrics()
      metrics.recordRequest('GET', '/api/test', 200, 150)

      expect(mockCounter.add).toHaveBeenCalledWith(1, {
        method: 'GET',
        path: '/api/test',
        status: 200,
      })

      expect(mockHistogram.record).toHaveBeenCalledWith(150, {
        method: 'GET',
        path: '/api/test',
        status: 200,
      })
    })

    it('should track active requests', () => {
      const mockUpDownCounter = { add: jest.fn() }

      const { getMeter } = require('@/lib/telemetry/tracer')
      getMeter.mockReturnValueOnce({
        createCounter: jest.fn(() => ({ add: jest.fn() })),
        createHistogram: jest.fn(() => ({ record: jest.fn() })),
        createUpDownCounter: jest.fn(() => mockUpDownCounter),
      })

      const metrics = createApiMetrics()

      metrics.incrementActiveRequests()
      expect(mockUpDownCounter.add).toHaveBeenCalledWith(1)

      metrics.decrementActiveRequests()
      expect(mockUpDownCounter.add).toHaveBeenCalledWith(-1)
    })
  })
})
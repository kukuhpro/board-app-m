import { NextRequest, NextResponse } from 'next/server'
import { withSpan, getTracer, addSpanAttributes } from './tracer'
import { SpanKind, SpanStatusCode } from '@opentelemetry/api'

export interface ApiHandlerOptions {
  spanName?: string
  attributes?: Record<string, any>
}

export function withTelemetry<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse | Response>,
  options: ApiHandlerOptions = {}
) {
  return async (...args: T): Promise<NextResponse | Response> => {
    const request = args[0] as NextRequest
    const method = request.method
    const url = request.url
    const pathname = new URL(url).pathname

    const spanName = options.spanName || `${method} ${pathname}`

    return withSpan(
      spanName,
      async (span) => {
        addSpanAttributes(span, {
          'http.method': method,
          'http.url': url,
          'http.target': pathname,
          'http.scheme': new URL(url).protocol.replace(':', ''),
          'http.host': request.headers.get('host'),
          'http.user_agent': request.headers.get('user-agent'),
          ...options.attributes,
        })

        try {
          const startTime = Date.now()
          const response = await handler(...args)
          const duration = Date.now() - startTime

          addSpanAttributes(span, {
            'http.status_code': response.status,
            'http.response_content_length': response.headers.get('content-length'),
            'http.duration': duration,
          })

          if (response.status >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${response.status}`,
            })
          }

          return response
        } catch (error) {
          addSpanAttributes(span, {
            'error': true,
            'error.message': error instanceof Error ? error.message : 'Unknown error',
          })

          if (error instanceof Error) {
            span.recordException(error)
          }

          throw error
        }
      },
      {
        kind: SpanKind.SERVER,
      }
    )
  }
}

export function createApiMetrics() {
  const { getMeter } = require('./tracer')
  const meter = getMeter('api-metrics')

  const requestCounter = meter.createCounter('api_requests_total', {
    description: 'Total number of API requests',
  })

  const requestDuration = meter.createHistogram('api_request_duration_ms', {
    description: 'API request duration in milliseconds',
  })

  const activeRequests = meter.createUpDownCounter('api_active_requests', {
    description: 'Number of active API requests',
  })

  return {
    recordRequest: (method: string, path: string, status: number, duration: number) => {
      requestCounter.add(1, {
        method,
        path,
        status,
      })

      requestDuration.record(duration, {
        method,
        path,
        status,
      })
    },
    incrementActiveRequests: () => activeRequests.add(1),
    decrementActiveRequests: () => activeRequests.add(-1),
  }
}

export const apiMetrics = createApiMetrics()
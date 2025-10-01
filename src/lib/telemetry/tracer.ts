import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { trace, context, SpanStatusCode, Span } from '@opentelemetry/api'
import { PeriodicExportingMetricReader, MeterProvider } from '@opentelemetry/sdk-metrics'

const serviceName = process.env.OTEL_SERVICE_NAME || 'job-board-app'
const environment = process.env.NODE_ENV || 'development'

export function initializeTracer() {
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      'deployment.environment': environment,
    }),
    spanProcessor: new BatchSpanProcessor(traceExporter),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false,
        },
      }),
    ],
  })

  sdk.start()
  console.log('OpenTelemetry tracing initialized')

  return sdk
}

export function getTracer(name: string = 'default') {
  return trace.getTracer(name, '1.0.0')
}

export function createSpan(
  name: string,
  options?: {
    attributes?: Record<string, any>
    kind?: any
  }
) {
  const tracer = getTracer()
  const span = tracer.startSpan(name, options)
  return span
}

export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    attributes?: Record<string, any>
    kind?: any
  }
): Promise<T> {
  const span = createSpan(name, options)

  try {
    const result = await context.with(
      trace.setSpan(context.active(), span),
      async () => await fn(span)
    )
    span.setStatus({ code: SpanStatusCode.OK })
    return result
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    if (error instanceof Error) {
      span.recordException(error)
    }
    throw error
  } finally {
    span.end()
  }
}

export function addSpanAttributes(span: Span, attributes: Record<string, any>) {
  Object.entries(attributes).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      span.setAttribute(key, value)
    }
  })
}

export function recordSpanException(span: Span, error: Error) {
  span.recordException(error)
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message,
  })
}

const metricsExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const meterProvider = new MeterProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
  }),
  readers: [
    new PeriodicExportingMetricReader({
      exporter: metricsExporter as any,
      exportIntervalMillis: 10000,
    }),
  ],
})

export function getMeter(name: string = 'default') {
  return meterProvider.getMeter(name, '1.0.0')
}
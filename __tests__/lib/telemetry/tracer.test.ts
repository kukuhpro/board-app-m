import { SpanStatusCode } from '@opentelemetry/api'

// Mock OpenTelemetry modules before importing tracer
jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
  })),
}))

jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: jest.fn(() => []),
}))

jest.mock('@opentelemetry/resources', () => ({
  Resource: jest.fn().mockImplementation((attributes) => ({ attributes })),
}))

jest.mock('@opentelemetry/semantic-conventions', () => ({
  SemanticResourceAttributes: {
    SERVICE_NAME: 'service.name',
    SERVICE_VERSION: 'service.version',
    DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
  },
}))

jest.mock('@opentelemetry/sdk-trace-node', () => ({
  BatchSpanProcessor: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@opentelemetry/sdk-metrics', () => ({
  MeterProvider: jest.fn().mockImplementation(() => ({
    getMeter: jest.fn(() => ({
      createCounter: jest.fn(() => ({ add: jest.fn() })),
      createHistogram: jest.fn(() => ({ record: jest.fn() })),
      createUpDownCounter: jest.fn(() => ({ add: jest.fn() })),
    })),
  })),
  PeriodicExportingMetricReader: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@opentelemetry/api', () => {
  const actual = jest.requireActual('@opentelemetry/api')
  return {
    ...actual,
    trace: {
      getTracer: jest.fn(() => ({
        startSpan: jest.fn(() => ({
          setAttribute: jest.fn(),
          setStatus: jest.fn(),
          recordException: jest.fn(),
          end: jest.fn(),
        })),
      })),
      setSpan: jest.fn((context, span) => context),
    },
    context: {
      active: jest.fn(() => ({})),
      with: jest.fn((context, fn) => fn()),
    },
  }
})

// Import after mocks are set up
import {
  initializeTracer,
  getTracer,
  createSpan,
  withSpan,
  addSpanAttributes,
  recordSpanException,
  getMeter
} from '@/lib/telemetry/tracer'

// Mock console to avoid noise in tests
const originalConsoleLog = console.log
const originalConsoleError = console.error
beforeAll(() => {
  console.log = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
})

describe('Telemetry Tracer', () => {
  describe('initializeTracer', () => {
    it('should initialize the tracer without errors', async () => {
      const sdk = initializeTracer()
      expect(sdk).toBeDefined()
      expect(sdk.start).toBeDefined()
    })

    it('should handle initialization errors gracefully', async () => {
      const { NodeSDK } = require('@opentelemetry/sdk-node')
      NodeSDK.mockImplementationOnce(() => ({
        start: jest.fn().mockRejectedValue(new Error('Initialization failed')),
      }))

      const sdk = initializeTracer()
      expect(sdk).toBeDefined()
    })
  })

  describe('getTracer', () => {
    it('should return a tracer with default name', () => {
      const tracer = getTracer()
      expect(tracer).toBeDefined()
      expect(tracer.startSpan).toBeDefined()
    })

    it('should return a tracer with custom name', () => {
      const tracer = getTracer('custom-tracer')
      expect(tracer).toBeDefined()
      expect(tracer.startSpan).toBeDefined()
    })
  })

  describe('createSpan', () => {
    it('should create a span with name', () => {
      const span = createSpan('test-span')
      expect(span).toBeDefined()
      expect(span.end).toBeDefined()
      expect(span.setStatus).toBeDefined()
      expect(span.setAttribute).toBeDefined()
      span.end()
    })

    it('should create a span with attributes', () => {
      const span = createSpan('test-span', {
        attributes: {
          'test.attribute': 'value',
          'test.number': 123,
        },
      })
      expect(span).toBeDefined()
      span.end()
    })
  })

  describe('withSpan', () => {
    it('should execute function within span context', async () => {
      const result = await withSpan(
        'test-operation',
        async (span) => {
          expect(span).toBeDefined()
          return 'test-result'
        }
      )

      expect(result).toBe('test-result')
    })

    it('should handle successful operations', async () => {
      let capturedSpan: any

      const result = await withSpan('test-success', async (span) => {
        capturedSpan = span
        return 'success'
      })

      expect(result).toBe('success')
      expect(capturedSpan).toBeDefined()
      expect(capturedSpan.setStatus).toBeDefined()
      expect(capturedSpan.end).toBeDefined()
    })

    it('should handle errors and record exceptions', async () => {
      const testError = new Error('Test error')
      let capturedSpan: any

      await expect(
        withSpan('test-error', async (span) => {
          capturedSpan = span
          throw testError
        })
      ).rejects.toThrow('Test error')

      expect(capturedSpan).toBeDefined()
      expect(capturedSpan.setStatus).toBeDefined()
      expect(capturedSpan.recordException).toBeDefined()
      expect(capturedSpan.end).toBeDefined()
    })

    it('should pass attributes to span', async () => {
      await withSpan(
        'test-with-attributes',
        async (span) => {
          expect(span).toBeDefined()
          return 'result'
        },
        {
          attributes: {
            'custom.attr': 'value',
          },
        }
      )
    })
  })

  describe('addSpanAttributes', () => {
    it('should add attributes to span', () => {
      const mockSpan = {
        setAttribute: jest.fn(),
      }

      addSpanAttributes(mockSpan as any, {
        'attr1': 'value1',
        'attr2': 123,
        'attr3': true,
        'attr4': undefined,
        'attr5': null,
      })

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('attr1', 'value1')
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('attr2', 123)
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('attr3', true)
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('attr4', undefined)
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('attr5', null)
    })
  })

  describe('recordSpanException', () => {
    it('should record exception and set error status', () => {
      const mockSpan = {
        recordException: jest.fn(),
        setStatus: jest.fn(),
      }

      const error = new Error('Test exception')
      recordSpanException(mockSpan as any, error)

      expect(mockSpan.recordException).toHaveBeenCalledWith(error)
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Test exception',
      })
    })
  })

  describe('getMeter', () => {
    it('should return a meter with default name', () => {
      const meter = getMeter()
      expect(meter).toBeDefined()
      expect(meter.createCounter).toBeDefined()
      expect(meter.createHistogram).toBeDefined()
      expect(meter.createUpDownCounter).toBeDefined()
    })

    it('should return a meter with custom name', () => {
      const meter = getMeter('custom-meter')
      expect(meter).toBeDefined()
    })
  })
})
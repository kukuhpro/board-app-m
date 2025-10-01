export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeTracer } = await import('./src/lib/telemetry/tracer')
    initializeTracer()
  }
}
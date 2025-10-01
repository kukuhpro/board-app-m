/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals and custom performance metrics
 */

export interface PerformanceMetrics {
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  TTI?: number // Time to Interactive
}

/**
 * Report Web Vitals to analytics or monitoring service
 */
export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric)
  }

  // Send to analytics endpoint in production
  if (process.env.NODE_ENV === 'production') {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    })

    // Send to your analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body)
    } else {
      fetch('/api/analytics/vitals', {
        method: 'POST',
        body,
        keepalive: true,
      })
    }
  }
}

/**
 * Custom performance marks and measures
 */
export class PerformanceTracker {
  private marks: Map<string, number> = new Map()
  private measures: Map<string, number> = new Map()

  // Mark a point in time
  mark(name: string) {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name)
      this.marks.set(name, performance.now())
    }
  }

  // Measure between two marks
  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && window.performance) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark)
        } else {
          performance.measure(name, startMark)
        }

        const entries = performance.getEntriesByName(name, 'measure')
        if (entries.length > 0) {
          const duration = entries[entries.length - 1].duration
          this.measures.set(name, duration)
          return duration
        }
      } catch (error) {
        console.error(`Failed to measure ${name}:`, error)
      }
    }
    return 0
  }

  // Get all measures
  getMeasures(): Record<string, number> {
    const result: Record<string, number> = {}
    this.measures.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  // Clear all marks and measures
  clear() {
    this.marks.clear()
    this.measures.clear()
    if (typeof window !== 'undefined' && window.performance) {
      performance.clearMarks()
      performance.clearMeasures()
    }
  }
}

// Global performance tracker instance
export const perfTracker = new PerformanceTracker()

/**
 * Monitor long tasks that block the main thread
 */
export function observeLongTasks(callback?: (duration: number) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Long task is > 50ms
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration}ms`)
          callback?.(entry.duration)
        }
      }
    })

    observer.observe({ entryTypes: ['longtask'] })
    return () => observer.disconnect()
  } catch (error) {
    console.error('Failed to observe long tasks:', error)
  }
}

/**
 * Resource timing analysis
 */
export function analyzeResourceTiming() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const resources = performance.getEntriesByType('resource')
  const analysis = {
    totalResources: resources.length,
    totalSize: 0,
    totalDuration: 0,
    slowResources: [] as string[],
    largeResources: [] as string[],
    byType: {} as Record<string, { count: number; duration: number }>,
  }

  resources.forEach((resource: any) => {
    const duration = resource.duration
    const size = resource.transferSize || 0

    analysis.totalDuration += duration
    analysis.totalSize += size

    // Track slow resources (> 500ms)
    if (duration > 500) {
      analysis.slowResources.push(resource.name)
    }

    // Track large resources (> 100KB)
    if (size > 100 * 1024) {
      analysis.largeResources.push(resource.name)
    }

    // Group by resource type
    const type = resource.initiatorType || 'other'
    if (!analysis.byType[type]) {
      analysis.byType[type] = { count: 0, duration: 0 }
    }
    analysis.byType[type].count++
    analysis.byType[type].duration += duration
  })

  return analysis
}

/**
 * Memory usage monitoring (Chrome only)
 */
export function getMemoryUsage() {
  if (typeof window === 'undefined') {
    return null
  }

  // @ts-ignore - performance.memory is Chrome-specific
  if (window.performance && performance.memory) {
    // @ts-ignore
    const memory = performance.memory
    return {
      usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      percentUsed: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
    }
  }
  return null
}

/**
 * FPS monitoring for smooth animations
 */
export class FPSMonitor {
  private fps = 0
  private lastTime = performance.now()
  private frames = 0
  private rafId: number | null = null

  start(callback?: (fps: number) => void) {
    const measure = () => {
      const currentTime = performance.now()
      this.frames++

      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime))
        callback?.(this.fps)
        this.frames = 0
        this.lastTime = currentTime
      }

      this.rafId = requestAnimationFrame(measure)
    }

    this.rafId = requestAnimationFrame(measure)
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  getFPS() {
    return this.fps
  }
}

/**
 * Check if user has reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Network connection monitoring
 */
export function getNetworkInfo() {
  if (typeof window === 'undefined' || !('navigator' in window)) {
    return null
  }

  // @ts-ignore - navigator.connection is not standard
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (connection) {
    return {
      effectiveType: connection.effectiveType, // 'slow-2g', '2g', '3g', or '4g'
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // Round-trip time in ms
      saveData: connection.saveData, // Data saver enabled
    }
  }

  return null
}

/**
 * Detect and report performance bottlenecks
 */
export function detectBottlenecks() {
  const bottlenecks = []

  // Check for too many DOM nodes
  if (typeof document !== 'undefined') {
    const nodeCount = document.getElementsByTagName('*').length
    if (nodeCount > 1500) {
      bottlenecks.push({
        type: 'DOM_NODES',
        message: `High DOM node count: ${nodeCount}`,
        severity: nodeCount > 3000 ? 'high' : 'medium',
      })
    }
  }

  // Check memory usage
  const memory = getMemoryUsage()
  if (memory && memory.percentUsed > 80) {
    bottlenecks.push({
      type: 'MEMORY',
      message: `High memory usage: ${memory.percentUsed}%`,
      severity: memory.percentUsed > 90 ? 'high' : 'medium',
    })
  }

  // Check resource count
  const resources = analyzeResourceTiming()
  if (resources) {
    if (resources.totalResources > 100) {
      bottlenecks.push({
        type: 'RESOURCES',
        message: `Too many resources: ${resources.totalResources}`,
        severity: resources.totalResources > 200 ? 'high' : 'medium',
      })
    }

    if (resources.slowResources.length > 5) {
      bottlenecks.push({
        type: 'SLOW_RESOURCES',
        message: `Multiple slow resources detected: ${resources.slowResources.length}`,
        severity: 'medium',
      })
    }
  }

  return bottlenecks
}
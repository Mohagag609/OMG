/**
 * Performance Monitoring and Optimization Utilities
 */

// FIXED: Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map()
  private static activeTimers: Map<string, number> = new Map()

  static startTimer(label: string): void {
    this.activeTimers.set(label, performance.now())
  }

  static endTimer(label: string): number {
    const startTime = this.activeTimers.get(label)
    if (!startTime) {
      console.warn(`Timer ${label} was not started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.activeTimers.delete(label)

    // Store measurement for analytics
    if (!this.measurements.has(label)) {
      this.measurements.set(label, [])
    }
    this.measurements.get(label)!.push(duration)

    // Keep only last 100 measurements
    const measurements = this.measurements.get(label)!
    if (measurements.length > 100) {
      measurements.splice(0, measurements.length - 100)
    }

    return duration
  }

  static getAverageTime(label: string): number {
    const measurements = this.measurements.get(label)
    if (!measurements || measurements.length === 0) return 0
    
    return measurements.reduce((sum, time) => sum + time, 0) / measurements.length
  }

  static getStats(label: string): { average: number; min: number; max: number; count: number } {
    const measurements = this.measurements.get(label)
    if (!measurements || measurements.length === 0) {
      return { average: 0, min: 0, max: 0, count: 0 }
    }

    return {
      average: this.getAverageTime(label),
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    }
  }

  static getAllStats(): Record<string, { average: number; min: number; max: number; count: number }> {
    const stats: Record<string, { average: number; min: number; max: number; count: number }> = {}
    
    for (const [label] of this.measurements) {
      stats[label] = this.getStats(label)
    }

    return stats
  }

  static clearStats(): void {
    this.measurements.clear()
    this.activeTimers.clear()
  }
}

// FIXED: Debounce utility for search and API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

// FIXED: Throttle utility for scroll and resize events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// FIXED: Memory usage monitoring
export function getMemoryUsage(): {
  used: number
  total: number
  percentage: number
} {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    return {
      used: usage.heapUsed,
      total: usage.heapTotal,
      percentage: (usage.heapUsed / usage.heapTotal) * 100
    }
  }

  // Browser fallback
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    }
  }

  return { used: 0, total: 0, percentage: 0 }
}

// FIXED: API response time monitoring
export async function monitorApiCall<T>(
  apiCall: () => Promise<T>,
  label: string
): Promise<T> {
  PerformanceMonitor.startTimer(label)
  
  try {
    const result = await apiCall()
    const duration = PerformanceMonitor.endTimer(label)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Call ${label}: ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    PerformanceMonitor.endTimer(label)
    throw error
  }
}

// FIXED: Component render time monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  const WrappedComponent = React.memo((props: P) => {
    PerformanceMonitor.startTimer(`render-${componentName}`)
    
    const result = React.createElement(Component, props)
    
    React.useEffect(() => {
      const duration = PerformanceMonitor.endTimer(`render-${componentName}`)
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎨 Render ${componentName}: ${duration.toFixed(2)}ms`)
      }
    })
    
    return result
  })
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`
  return WrappedComponent
}

// FIXED: Bundle size monitoring
export function logBundleSize(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    
    console.group('📦 Bundle Analysis')
    console.log(`Scripts: ${scripts.length}`)
    console.log(`Stylesheets: ${styles.length}`)
    
    // Log performance metrics
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      console.log(`Page Load Time: ${navigation.loadEventEnd - navigation.loadEventStart}ms`)
      console.log(`DOM Content Loaded: ${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`)
    }
    
    console.groupEnd()
  }
}

// FIXED: Cache hit rate monitoring
export class CacheMonitor {
  private static hits: Map<string, number> = new Map()
  private static misses: Map<string, number> = new Map()

  static recordHit(key: string): void {
    this.hits.set(key, (this.hits.get(key) || 0) + 1)
  }

  static recordMiss(key: string): void {
    this.misses.set(key, (this.misses.get(key) || 0) + 1)
  }

  static getHitRate(key: string): number {
    const hits = this.hits.get(key) || 0
    const misses = this.misses.get(key) || 0
    const total = hits + misses
    
    return total === 0 ? 0 : (hits / total) * 100
  }

  static getAllHitRates(): Record<string, number> {
    const rates: Record<string, number> = {}
    const allKeys = new Set([...this.hits.keys(), ...this.misses.keys()])
    
    for (const key of allKeys) {
      rates[key] = this.getHitRate(key)
    }
    
    return rates
  }

  static clear(): void {
    this.hits.clear()
    this.misses.clear()
  }
}

// FIXED: Import React for the HOC
import React from 'react'
/**
 * Web Vitals Performance Monitoring
 * Reports Core Web Vitals metrics for performance optimization
 */

export type WebVitalMetric = 'FCP' | 'LCP' | 'CLS' | 'FID' | 'TTFB' | 'INP'

export interface WebVitalReport {
  id: string
  name: WebVitalMetric
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: 'navigate' | 'reload' | 'back-forward-cache' | 'restore'
}

/**
 * Report web vitals to console and analytics
 * In production, send to your analytics service
 */
export function reportWebVitals(metric: WebVitalReport) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating)
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Replace with your analytics endpoint
    const body = {
      dsn: process.env.NEXT_PUBLIC_WEB_VITALS_DSN,
      id: metric.id,
      page: window.location.pathname,
      value: metric.value,
      name: metric.name,
      rating: metric.rating,
      navigationType: metric.navigationType,
    }

    // Use sendBeacon for reliable delivery even when page is closing
    navigator.sendBeacon('/api/web-vitals', JSON.stringify(body))
  }
}

/**
 * Get performance mark for custom timing
 */
export function getPerformanceMark(name: string): number | null {
  if (typeof performance === 'undefined') return null
  
  const entries = performance.getEntriesByName(name, 'mark')
  if (entries.length === 0) return null
  
  return entries[0].startTime
}

/**
 * Create a performance mark
 */
export function markPerformance(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(name)
  }
}

/**
 * Measure duration between two marks
 */
export function measurePerformance(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance === 'undefined') return null
  
  try {
    performance.measure(name, startMark, endMark)
    const entries = performance.getEntriesByName(name, 'measure')
    return entries.length > 0 ? entries[0].duration : null
  } catch {
    return null
  }
}

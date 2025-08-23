// Performance monitoring utilities for cache effectiveness

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private cacheHits = 0
  private cacheMisses = 0
  
  // Track cache performance
  recordCacheHit() {
    this.cacheHits++
    this.recordMetric('cache_hit', 1)
  }
  
  recordCacheMiss() {
    this.cacheMisses++
    this.recordMetric('cache_miss', 1)
  }
  
  getCacheHitRate() {
    const total = this.cacheHits + this.cacheMisses
    return total > 0 ? (this.cacheHits / total) * 100 : 0
  }
  
  // Track API response times
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await apiCall()
      const duration = performance.now() - start
      this.recordMetric(`api_${name}_duration`, duration)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`api_${name}_error_duration`, duration)
      throw error
    }
  }
  
  // Record custom metrics
  recordMetric(name: string, value: number) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
    })
    
    // Keep only last 1000 metrics to prevent memory leak
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: name,
        value: value,
      })
    }
  }
  
  // Get metrics summary
  getMetricsSummary() {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {}
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { avg: 0, min: Infinity, max: -Infinity, count: 0 }
      }
      
      const stat = summary[metric.name]
      stat.count++
      stat.avg = (stat.avg * (stat.count - 1) + metric.value) / stat.count
      stat.min = Math.min(stat.min, metric.value)
      stat.max = Math.max(stat.max, metric.value)
    })
    
    return {
      ...summary,
      cacheHitRate: this.getCacheHitRate(),
      totalCacheHits: this.cacheHits,
      totalCacheMisses: this.cacheMisses,
    }
  }
  
  // Web Vitals monitoring
  monitorWebVitals() {
    if (typeof window === 'undefined') return
    
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      this.recordMetric('web_vitals_lcp', lastEntry.startTime)
    })
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    
    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        this.recordMetric('web_vitals_fid', entry.processingStart - entry.startTime)
      })
    })
    fidObserver.observe({ entryTypes: ['first-input'] })
    
    // Cumulative Layout Shift
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
          this.recordMetric('web_vitals_cls', clsValue)
        }
      })
    })
    clsObserver.observe({ entryTypes: ['layout-shift'] })
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Initialize monitoring on client
if (typeof window !== 'undefined') {
  performanceMonitor.monitorWebVitals()
}
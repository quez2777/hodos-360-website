'use client'

import { useEffect } from 'react'

interface PerformanceMonitorProps {
  componentName: string
  onLoad?: (metrics: PerformanceMetrics) => void
}

interface PerformanceMetrics {
  componentName: string
  loadTime: number
  renderTime: number
  timestamp: number
}

export function PerformanceMonitor({ 
  componentName, 
  onLoad 
}: PerformanceMonitorProps) {
  useEffect(() => {
    const startTime = performance.now()
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime
      
      const metrics: PerformanceMetrics = {
        componentName,
        loadTime: startTime,
        renderTime,
        timestamp: Date.now()
      }
      
      // Log performance metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} loaded in ${renderTime.toFixed(2)}ms`)
      }
      
      // Call callback if provided
      onLoad?.(metrics)
      
      // Send to analytics if needed
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'component_load', {
          event_category: 'Performance',
          event_label: componentName,
          value: Math.round(renderTime),
          non_interaction: true
        })
      }
    })
  }, [componentName, onLoad])
  
  return null
}

// Hook to track demo performance
export function useDemoPerformance(demoName: string) {
  useEffect(() => {
    // Mark when demo starts loading
    performance.mark(`${demoName}-start`)
    
    return () => {
      // Mark when demo unmounts
      performance.mark(`${demoName}-end`)
      
      // Measure the duration
      try {
        performance.measure(
          `${demoName}-duration`,
          `${demoName}-start`,
          `${demoName}-end`
        )
        
        const measure = performance.getEntriesByName(`${demoName}-duration`)[0]
        if (measure && process.env.NODE_ENV === 'development') {
          console.log(`📊 ${demoName} total duration: ${measure.duration.toFixed(2)}ms`)
        }
      } catch (e) {
        // Ignore errors from missing marks
      }
    }
  }, [demoName])
}
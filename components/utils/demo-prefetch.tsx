'use client'

import { useEffect } from 'react'

// Prefetch demo modules when the user is likely to interact with them
export function prefetchDemo(demoName: string) {
  switch (demoName) {
    case 'ai-chat':
      import('@/components/demos/ai-chat-demo')
      break
    case 'seo-analysis':
      import('@/components/demos/seo-analysis-demo')
      break
    case 'video-agent':
      import('@/components/demos/video-agent-demo')
      break
    case 'roi-calculator':
      import('@/components/demos/roi-calculator')
      break
    case 'performance-dashboard':
      import('@/components/demos/performance-dashboard')
      break
  }
}

// Hook to prefetch demos based on user behavior
export function useDemoPrefetch() {
  useEffect(() => {
    // Prefetch demos when the page is idle
    if ('requestIdleCallback' in window) {
      const idleCallbackId = requestIdleCallback(() => {
        // Prefetch the most popular demos
        prefetchDemo('ai-chat')
        prefetchDemo('seo-analysis')
      }, { timeout: 2000 })

      return () => {
        if ('cancelIdleCallback' in window) {
          cancelIdleCallback(idleCallbackId)
        }
      }
    }
  }, [])
}

// Component to prefetch demos when hovering over navigation
export function DemoPrefetchTrigger({ demoName }: { demoName: string }) {
  return (
    <div
      onMouseEnter={() => prefetchDemo(demoName)}
      onFocus={() => prefetchDemo(demoName)}
      className="contents"
    >
      {/* This component doesn't render anything, just handles prefetching */}
    </div>
  )
}
'use client'

import { lazy, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

// Demo loading skeleton with animated elements
const DemoLoadingSkeleton = ({ 
  title = "Loading Demo",
  height = "h-[600px]" 
}: { 
  title?: string
  height?: string 
}) => (
  <div className={`relative ${height} w-full`}>
    <div className="absolute inset-0 backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 overflow-hidden">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-gray-600/20 to-gray-700/20 p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-48 bg-white/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <div className="h-4 bg-white/5 rounded animate-pulse" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-white/5 rounded animate-pulse w-1/2" />
      </div>
      
      {/* Loading indicator */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-gray-300">{title}</p>
        </div>
      </motion.div>
    </div>
  </div>
)

// Lazy load demo components with error boundaries and webpack magic comments
export const LazyAIChatDemo = lazy(() => 
  import(/* webpackChunkName: "demo-ai-chat" */ '@/components/demos/ai-chat-demo')
    .then(mod => ({ default: mod.AIChatDemo }))
    .catch(() => ({ default: () => <div>Failed to load AI Chat Demo</div> }))
)

export const LazySEOAnalysisDemo = lazy(() => 
  import(/* webpackChunkName: "demo-seo-analysis" */ '@/components/demos/seo-analysis-demo')
    .then(mod => ({ default: mod.SEOAnalysisDemo }))
    .catch(() => ({ default: () => <div>Failed to load SEO Analysis Demo</div> }))
)

export const LazyVideoAgentDemo = lazy(() => 
  import(/* webpackChunkName: "demo-video-agent" */ '@/components/demos/video-agent-demo')
    .then(mod => ({ default: mod.VideoAgentDemo }))
    .catch(() => ({ default: () => <div>Failed to load Video Agent Demo</div> }))
)

export const LazyROICalculator = lazy(() => 
  import(/* webpackChunkName: "demo-roi-calculator" */ '@/components/demos/roi-calculator')
    .then(mod => ({ default: mod.ROICalculator }))
    .catch(() => ({ default: () => <div>Failed to load ROI Calculator</div> }))
)

export const LazyPerformanceDashboard = lazy(() => 
  import(/* webpackChunkName: "demo-performance-dashboard" */ '@/components/demos/performance-dashboard')
    .then(mod => ({ default: mod.PerformanceDashboard }))
    .catch(() => ({ default: () => <div>Failed to load Performance Dashboard</div> }))
)

// Wrapped components with proper loading states
export const AIChatDemoWithLoader = () => (
  <Suspense fallback={<DemoLoadingSkeleton title="Loading AI Chat Demo" />}>
    <LazyAIChatDemo />
  </Suspense>
)

export const SEOAnalysisDemoWithLoader = () => (
  <Suspense fallback={<DemoLoadingSkeleton title="Loading SEO Analysis Demo" />}>
    <LazySEOAnalysisDemo />
  </Suspense>
)

export const VideoAgentDemoWithLoader = () => (
  <Suspense fallback={<DemoLoadingSkeleton title="Loading Video Agent Demo" height="h-[700px]" />}>
    <LazyVideoAgentDemo />
  </Suspense>
)

export const ROICalculatorWithLoader = () => (
  <Suspense fallback={<DemoLoadingSkeleton title="Loading ROI Calculator" />}>
    <LazyROICalculator />
  </Suspense>
)

export const PerformanceDashboardWithLoader = () => (
  <Suspense fallback={<DemoLoadingSkeleton title="Loading Performance Dashboard" height="h-[500px]" />}>
    <LazyPerformanceDashboard />
  </Suspense>
)
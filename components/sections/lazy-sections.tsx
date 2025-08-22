import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Loading component for sections
const SectionLoader = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-muted animate-pulse" />
      <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  </div>
)

// Lazy load below-fold sections with loading states
export const LazyTrustSection = dynamic(
  () => import('./trust').then((mod) => ({ default: mod.TrustSection })),
  {
    loading: () => <SectionLoader />,
    ssr: true // Keep SSR for SEO
  }
)

export const LazyProductsSection = dynamic(
  () => import('./products').then((mod) => ({ default: mod.ProductsSection })),
  {
    loading: () => <SectionLoader />,
    ssr: true
  }
)

export const LazyStatsSection = dynamic(
  () => import('./stats').then((mod) => ({ default: mod.StatsSection })),
  {
    loading: () => <SectionLoader />,
    ssr: true
  }
)

export const LazyTestimonialsSection = dynamic(
  () => import('./testimonials').then((mod) => ({ default: mod.TestimonialsSection })),
  {
    loading: () => <SectionLoader />,
    ssr: false // Client-only for performance
  }
)

export const LazyCTASection = dynamic(
  () => import('./cta').then((mod) => ({ default: mod.CTASection })),
  {
    loading: () => <SectionLoader />,
    ssr: true
  }
)

// Wrapper component with Suspense boundary
export const LazySection: React.FC<{
  Component: React.ComponentType
  fallback?: React.ReactNode
}> = ({ Component, fallback }) => (
  <Suspense fallback={fallback || <SectionLoader />}>
    <Component />
  </Suspense>
)
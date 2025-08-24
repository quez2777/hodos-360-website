import { getPageRevalidation } from "@/lib/cache-config"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Enable ISR with 1 hour revalidation for homepage
export const revalidate = getPageRevalidation('home')

// Import hero section normally as it's above the fold
import { HeroSection } from "@/components/sections/hero"

// Loading skeleton component
const SectionSkeleton = () => (
  <div className="h-96 bg-muted/10 animate-pulse" />
)

// Dynamic imports for below-the-fold components with loading states
const Navigation = dynamic(() => import("@/components/layout/navigation").then(mod => ({ default: mod.Navigation })), {
  ssr: true,
})

const Footer = dynamic(() => import("@/components/layout/footer").then(mod => ({ default: mod.Footer })), {
  ssr: true,
})

const TrustSection = dynamic(() => import("@/components/sections/trust").then(mod => ({ default: mod.TrustSection })), {
  loading: () => <SectionSkeleton />,
  ssr: true,
})

const ProductsSection = dynamic(() => import("@/components/sections/products").then(mod => ({ default: mod.ProductsSection })), {
  loading: () => <SectionSkeleton />,
  ssr: true,
})

const StatsSection = dynamic(() => import("@/components/sections/stats").then(mod => ({ default: mod.StatsSection })), {
  loading: () => <SectionSkeleton />,
  ssr: true,
})

const DemoShowcase = dynamic(() => import("@/components/sections/demo-showcase").then(mod => ({ default: mod.DemoShowcase })), {
  loading: () => <SectionSkeleton />,
  ssr: true,
})

const TestimonialsSection = dynamic(() => import("@/components/sections/testimonials").then(mod => ({ default: mod.TestimonialsSection })), {
  loading: () => <SectionSkeleton />,
  ssr: true,
})

const CTASection = dynamic(() => import("@/components/sections/cta").then(mod => ({ default: mod.CTASection })), {
  loading: () => <SectionSkeleton />,
  ssr: true,
})

export default function HomePage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <Suspense fallback={<SectionSkeleton />}>
          <TrustSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <ProductsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <StatsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <DemoShowcase />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <TestimonialsSection />
        </Suspense>
        <Suspense fallback={<SectionSkeleton />}>
          <CTASection />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
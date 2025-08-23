import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { ProductHero } from "@/components/sections/product-hero"
import { ProductFeatures } from "@/components/sections/product-features"
import { ProductBenefits } from "@/components/sections/product-benefits"
import { ProductCTA } from "@/components/sections/product-cta"
import { PRODUCTS } from "@/lib/constants"
import { getPageRevalidation } from "@/lib/cache-config"

export const metadata = {
  title: "HODOS - Complete AI Law Firm Management | HODOS 360",
  description: "Transform your entire law firm with AI-powered executives from C-suite to reception. Reduce costs by 60% with 24/7 AI support.",
}

// Enable ISR with 2 hour revalidation
export const revalidate = getPageRevalidation('products')

const product = PRODUCTS.hodos

export default function HODOSProductPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <ProductHero product={product} />
        <ProductFeatures product={product} />
        <ProductBenefits product={product} />
        <ProductCTA product={product} />
      </main>
      <Footer />
    </>
  )
}
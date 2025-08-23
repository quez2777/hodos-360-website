import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { ProductHero } from "@/components/sections/product-hero"
import { ProductFeatures } from "@/components/sections/product-features"
import { ProductBenefits } from "@/components/sections/product-benefits"
import { ProductCTA } from "@/components/sections/product-cta"
import { PRODUCTS } from "@/lib/constants"
import { getPageRevalidation } from "@/lib/cache-config"

export const metadata = {
  title: "HODOS Marketing Platform - AI Legal Marketing | HODOS 360",
  description: "Dominate your market with AI-driven SEO and automated paid marketing campaigns. 3x your leads while reducing costs by 50%.",
}

// Enable ISR with 2 hour revalidation
export const revalidate = getPageRevalidation('products')

const product = PRODUCTS.marketing

export default function MarketingProductPage() {
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
import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { ProductHero } from "@/components/sections/product-hero"
import { ProductFeatures } from "@/components/sections/product-features"
import { ProductBenefits } from "@/components/sections/product-benefits"
import { ProductCTA } from "@/components/sections/product-cta"
import { PRODUCTS } from "@/lib/constants"

export const metadata = {
  title: "HODOS VIDEO Agents - AI Reception & Sales | HODOS 360",
  description: "Revolutionary video and voice AI agents for reception, intake, and sales. Never miss a client call with 24/7 intelligent support.",
}

const product = PRODUCTS.video

export default function VideoAgentsProductPage() {
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
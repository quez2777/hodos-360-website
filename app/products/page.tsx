import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { ProductsHero } from "@/components/sections/products-hero"
import { ProductComparison } from "@/components/sections/product-comparison"
import { ProductsGrid } from "@/components/sections/products-grid"
import { FAQSection } from "@/components/sections/faq"
import { CTASection } from "@/components/sections/cta"

export const metadata = {
  title: "Products - HODOS 360 AI Legal Solutions",
  description: "Explore our comprehensive suite of AI-powered solutions for law firms. From AI management to marketing automation and video agents.",
}

export default function ProductsPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <ProductsHero />
        <ProductsGrid />
        <ProductComparison />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
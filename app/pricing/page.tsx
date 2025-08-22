import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { PricingHero } from "@/components/sections/pricing-hero"
import { PricingCards } from "@/components/sections/pricing-cards"
import { PricingFAQ } from "@/components/sections/pricing-faq"
import { PricingCalculator } from "@/components/sections/pricing-calculator"
import { CTASection } from "@/components/sections/cta"

export const metadata = {
  title: "Pricing - HODOS 360",
  description: "Transparent pricing for HODOS 360's AI-powered legal tech solutions. Choose the plan that fits your firm's needs and budget.",
}

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <PricingHero />
        <PricingCards />
        <PricingCalculator />
        <PricingFAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { PricingHero } from "@/components/sections/pricing-hero"
import { PricingTable } from "@/components/pricing/pricing-table"
import { PricingFAQ } from "@/components/sections/pricing-faq"
import { PricingCalculator } from "@/components/sections/pricing-calculator"
import { CTASection } from "@/components/sections/cta"

export const metadata = {
  title: "Pricing - HODOS 360 | AI-Powered Legal Tech Solutions",
  description: "Transparent pricing for HODOS 360's complete AI-powered legal tech suite. Start your free trial today and transform your law firm with cutting-edge automation.",
  keywords: "legal tech pricing, law firm software cost, AI legal tools, attorney automation, legal practice management pricing",
}

export default function PricingPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <PricingHero />
        
        {/* Main Pricing Table */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] opacity-50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)] opacity-50" />
          
          <div className="relative container mx-auto px-4">
            <PricingTable />
          </div>
        </section>
        
        <PricingCalculator />
        <PricingFAQ />
        
        {/* Money-Back Guarantee */}
        <section className="py-16 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-y border-green-500/20">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                30-Day Money-Back Guarantee
              </h2>
              <p className="text-lg text-white/70">
                Try HODOS 360 risk-free. If you're not completely satisfied within 30 days, 
                we'll refund every penny. No questions asked.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-sm text-white/60">
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Free data migration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
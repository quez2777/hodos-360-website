import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { AboutHero } from "@/components/sections/about-hero"
import { AboutMission } from "@/components/sections/about-mission"
import { AboutTeam } from "@/components/sections/about-team"
import { AboutValues } from "@/components/sections/about-values"
import { CTASection } from "@/components/sections/cta"

export const metadata = {
  title: "About Us - HODOS 360",
  description: "Learn about HODOS 360's mission to transform the legal industry with AI-powered solutions that enhance efficiency and drive growth.",
}

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <AboutHero />
        <AboutMission />
        <AboutValues />
        <AboutTeam />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
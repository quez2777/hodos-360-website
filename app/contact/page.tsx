import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { ContactHero } from "@/components/sections/contact-hero"
import { ContactForm } from "@/components/sections/contact-form"
import { ContactInfo } from "@/components/sections/contact-info"

export const metadata = {
  title: "Contact Us - HODOS 360",
  description: "Get in touch with HODOS 360. Schedule a demo, ask questions, or learn how AI can transform your law firm.",
}

export default function ContactPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        <ContactHero />
        <div className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2">
              <ContactForm />
              <ContactInfo />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
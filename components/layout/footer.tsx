"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { COMPANY, NAV_LINKS, PRODUCTS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { 
  Linkedin, 
  Twitter, 
  Facebook, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
} from "lucide-react"

const footerLinks = {
  products: [
    { label: "HODOS AI Management", href: PRODUCTS.hodos.href },
    { label: "Marketing Platform", href: PRODUCTS.marketing.href },
    { label: "VIDEO Agents", href: PRODUCTS.video.href },
    { label: "All Products", href: "/products" },
    { label: "Pricing", href: "/pricing" },
  ],
  company: [
    { label: "About Us", href: "/about" },
    { label: "Careers", href: "/careers" },
    { label: "Partners", href: "/partners" },
    { label: "Press", href: "/press" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "API Reference", href: "/api" },
    { label: "Blog", href: "/blog" },
    { label: "Case Studies", href: "/case-studies" },
    { label: "Support", href: "/support" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Compliance", href: "/compliance" },
    { label: "Security", href: "/security" },
  ],
}

const socialLinks = [
  { icon: Linkedin, href: COMPANY.social.linkedin, label: "LinkedIn" },
  { icon: Twitter, href: COMPANY.social.twitter, label: "Twitter" },
  { icon: Facebook, href: COMPANY.social.facebook, label: "Facebook" },
  { icon: Youtube, href: COMPANY.social.youtube, label: "YouTube" },
]

const Footer = React.memo(function Footer() {
  const currentYear = new Date().getFullYear()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to subscribe")
      }

      toast({
        title: "Success!",
        description: result.message || "Successfully subscribed to newsletter!",
        variant: "success" as any,
      })

      setEmail("")
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="w-full border-t bg-background">
      {/* Newsletter Section */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              Stay ahead with AI insights
            </h3>
            <p className="mt-2 text-muted-foreground">
              Get the latest updates on AI legal tech delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
                disabled={isSubmitting}
              />
              <Button type="submit" variant="ai" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/images/hodos-logo.svg"
                alt="HODOS 360"
                width={150}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {COMPANY.description}
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a 
                href={`mailto:${COMPANY.email}`}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span>{COMPANY.email}</span>
              </a>
              <a 
                href={`tel:${COMPANY.phone}`}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>{COMPANY.phone}</span>
              </a>
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>
                  {COMPANY.address.street}<br />
                  {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Footer Links */}
          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4">
            {/* Products */}
            <div>
              <h4 className="text-sm font-semibold">Products</h4>
              <ul className="mt-4 space-y-3">
                {footerLinks.products.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold">Company</h4>
              <ul className="mt-4 space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold">Resources</h4>
              <ul className="mt-4 space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold">Legal</h4>
              <ul className="mt-4 space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {currentYear} {COMPANY.name}. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>SOC 2 Compliant</span>
              <span>•</span>
              <span>HIPAA Compliant</span>
              <span>•</span>
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export { Footer }
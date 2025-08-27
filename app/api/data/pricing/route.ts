import { NextRequest, NextResponse } from "next/server"
import { generateCacheHeaders } from "@/lib/api-cache"

// Cached pricing data endpoint
export async function GET() {
  try {
    // This would typically fetch from a database or pricing service
    const pricingPlans = {
      hodos: {
        starter: {
          name: "Starter",
          price: 499,
          features: [
            "AI Reception & Intake",
            "Basic Case Management",
            "Email Automation",
            "Up to 5 team members",
          ],
        },
        professional: {
          name: "Professional",
          price: 999,
          features: [
            "Everything in Starter",
            "Advanced AI Executives",
            "Custom Workflows",
            "Unlimited team members",
            "Priority Support",
          ],
        },
        enterprise: {
          name: "Enterprise",
          price: "Custom",
          features: [
            "Everything in Professional",
            "Custom AI Training",
            "Dedicated Account Manager",
            "SLA Guarantee",
            "White-label Options",
          ],
        },
      },
      marketing: {
        basic: {
          name: "Basic SEO",
          price: 299,
          features: [
            "Keyword Research",
            "On-page Optimization",
            "Monthly Reports",
            "Google My Business",
          ],
        },
        growth: {
          name: "Growth Marketing",
          price: 799,
          features: [
            "Everything in Basic",
            "AI Content Generation",
            "Paid Ad Management",
            "Conversion Optimization",
            "Competitor Analysis",
          ],
        },
        domination: {
          name: "Market Domination",
          price: 1499,
          features: [
            "Everything in Growth",
            "Multi-channel Campaigns",
            "AI Predictive Analytics",
            "Custom Landing Pages",
            "Dedicated Strategist",
          ],
        },
      },
    }
    
    // Cache for 1 hour since pricing doesn't change often
    return NextResponse.json(
      { pricingPlans },
      {
        headers: generateCacheHeaders({ ttl: 3600, swr: 1800 }),
      }
    )
  } catch (error) {
    console.error("Error fetching pricing:", error)
    return NextResponse.json(
      { error: "Failed to fetch pricing" },
      { status: 500 }
    )
  }
}
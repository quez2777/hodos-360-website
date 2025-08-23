import { NextResponse } from "next/server"
import { generateCacheHeaders } from "@/lib/api-cache"

// Example API route with caching for testimonials data
export async function GET() {
  try {
    // This would typically fetch from a database
    const testimonials = [
      {
        id: 1,
        author: "Sarah Johnson",
        role: "Managing Partner",
        company: "Johnson & Associates",
        content: "HODOS transformed our practice. We've reduced overhead by 60% while improving client satisfaction.",
        rating: 5,
      },
      {
        id: 2,
        author: "Michael Chen",
        role: "Senior Partner",
        company: "Chen Law Group",
        content: "The AI-powered intake system has doubled our conversion rate. Best investment we've made.",
        rating: 5,
      },
      {
        id: 3,
        author: "Jennifer Martinez",
        role: "Founder",
        company: "Martinez Legal Solutions",
        content: "24/7 availability without hiring more staff. HODOS VIDEO Agents are game-changing.",
        rating: 5,
      },
    ]
    
    // Return with cache headers for 10 minutes
    return NextResponse.json(
      { testimonials },
      {
        headers: generateCacheHeaders({ ttl: 600, swr: 300 }),
      }
    )
  } catch (error) {
    console.error("Error fetching testimonials:", error)
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    )
  }
}
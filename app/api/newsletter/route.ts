import { NextResponse } from "next/server"
import { getCacheHeaders } from "@/lib/cache-config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate email
    if (!body.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }
    
    // Here you would typically:
    // 1. Add to email marketing service (Mailchimp, SendGrid, etc.)
    // 2. Send welcome email
    // 3. Store in database
    
    // For now, we'll just log and return success
    console.log("Newsletter subscription:", {
      email: body.email,
      timestamp: new Date().toISOString(),
    })
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed to newsletter!",
      },
      {
        headers: getCacheHeaders('api', 'newsletter'),
      }
    )
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
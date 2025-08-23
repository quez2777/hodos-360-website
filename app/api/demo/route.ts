import { NextResponse } from "next/server"
import { getCacheHeaders } from "@/lib/cache-config"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ["email"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
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
    // 1. Check calendar availability
    // 2. Create calendar event
    // 3. Send confirmation email
    // 4. Add to CRM
    
    // For now, we'll just log and return success
    console.log("Demo request:", {
      email: body.email,
      timestamp: new Date().toISOString(),
    })
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return NextResponse.json(
      {
        success: true,
        message: "Demo scheduled! Check your email for confirmation and meeting details.",
      },
      {
        headers: getCacheHeaders('api', 'demo'),
      }
    )
  } catch (error) {
    console.error("Demo request error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
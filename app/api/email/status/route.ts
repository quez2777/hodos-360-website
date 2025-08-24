import { NextResponse } from "next/server"
import { getEmailStatus, getQueueStats } from "@/lib/email/queue"
import { getCacheHeaders } from "@/lib/cache-config"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const emailId = searchParams.get('id')
    
    // If email ID provided, get specific email status
    if (emailId) {
      const status = getEmailStatus(emailId)
      
      if (!status) {
        return NextResponse.json(
          { error: "Email not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        {
          id: status.id,
          status: status.status,
          attempts: status.attempts,
          createdAt: status.createdAt,
          lastAttemptAt: status.lastAttemptAt,
          error: status.error,
        },
        {
          headers: getCacheHeaders('api', 'email-status'),
        }
      )
    }
    
    // Otherwise, return queue statistics
    const stats = getQueueStats()
    
    return NextResponse.json(
      {
        stats,
        timestamp: new Date().toISOString(),
      },
      {
        headers: getCacheHeaders('api', 'email-status'),
      }
    )
  } catch (error) {
    console.error("Email status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
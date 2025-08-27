import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { getCacheHeaders } from "@/lib/cache-config"
import { sendEmail, validateEmail } from "@/lib/email/client"
import { queueEmail } from "@/lib/email/queue"
import { DemoScheduledEmail } from "@/lib/email/templates/demo-scheduled"
import { ContactEmail } from "@/lib/email/templates/contact"

// Mock function to get next available demo slot
// In production, this would integrate with a calendar API
function getNextDemoSlot() {
  const now = new Date()
  const nextSlot = new Date(now)
  
  // Skip weekends
  while (nextSlot.getDay() === 0 || nextSlot.getDay() === 6) {
    nextSlot.setDate(nextSlot.getDate() + 1)
  }
  
  // Set to next business day at 2 PM
  nextSlot.setDate(nextSlot.getDate() + 1)
  nextSlot.setHours(14, 0, 0, 0)
  
  return {
    date: nextSlot.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    time: nextSlot.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    meetingLink: 'https://meet.hodos360.com/demo',
    calendarLink: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=HODOS+360+Demo&dates=${nextSlot.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(nextSlot.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=Demo+of+HODOS+360+AI-powered+legal+tech+solutions`,
  }
}

export async function POST(request: NextRequest) {
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
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }
    
    // Get demo slot
    const demoSlot = getNextDemoSlot()
    
    // Prepare demo data
    const demoData = {
      recipientEmail: body.email.trim().toLowerCase(),
      recipientName: body.name?.trim(),
      demoDate: demoSlot.date,
      demoTime: demoSlot.time,
      demoType: 'video-call' as const,
      meetingLink: demoSlot.meetingLink,
      calendarLink: demoSlot.calendarLink,
      duration: '30 minutes',
      specialRequests: body.specialRequests?.trim(),
    }
    
    // Send demo confirmation email to user
    const confirmationEmailId = await queueEmail({
      to: demoData.recipientEmail,
      subject: 'Your HODOS 360 Demo is Confirmed!',
      react: DemoScheduledEmail(demoData) as React.ReactElement,
      tags: [
        { name: 'type', value: 'demo-confirmation' },
        { name: 'demo-date', value: demoSlot.date },
      ],
    })
    
    // Send internal notification
    const internalNotification = await sendEmail({
      to: process.env.DEMO_NOTIFICATION_EMAIL || 'sales@hodos360.com',
      subject: `New Demo Scheduled - ${demoData.recipientEmail}`,
      react: ContactEmail({
        firstName: demoData.recipientName || 'Demo',
        lastName: 'Request',
        email: demoData.recipientEmail,
        company: body.company || 'Not specified',
        message: `Demo scheduled for ${demoSlot.date} at ${demoSlot.time}\n\nSpecial requests: ${demoData.specialRequests || 'None'}`,
        timestamp: new Date().toISOString(),
      }) as React.ReactElement,
      tags: [
        { name: 'type', value: 'demo-internal' },
        { name: 'demo-date', value: demoSlot.date },
      ],
    })
    
    if (!internalNotification.success) {
      console.error('Failed to send internal demo notification:', internalNotification.error)
    }
    
    // Here you would also:
    // 1. Create calendar event via Google Calendar API
    // 2. Add to CRM with demo scheduled status
    // 3. Create follow-up tasks for sales team
    // 4. Send to analytics for conversion tracking
    
    console.log("Demo scheduled:", {
      email: demoData.recipientEmail,
      demoSlot,
      confirmationEmailId,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json(
      {
        success: true,
        message: "Demo scheduled! Check your email for confirmation and meeting details.",
        demoDetails: {
          date: demoSlot.date,
          time: demoSlot.time,
          duration: '30 minutes',
        },
      },
      {
        headers: getCacheHeaders('api', 'demo'),
      }
    )
  } catch (error) {
    console.error("Demo request error:", error)
    
    // Send error notification
    try {
      await sendEmail({
        to: process.env.ERROR_NOTIFICATION_EMAIL || 'tech@hodos360.com',
        subject: 'Demo Scheduling Error',
        text: `An error occurred scheduling a demo:\n\n${error}`,
      })
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError)
    }
    
    return NextResponse.json(
      { error: "We encountered an issue scheduling your demo. Please try again or call us at 1-800-HODOS360" },
      { status: 500 }
    )
  }
}
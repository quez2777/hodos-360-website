import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCacheHeaders } from "@/lib/cache-config"
import { sendEmail, validateEmail } from "@/lib/email/client"
import { queueEmail } from "@/lib/email/queue"
import { DemoScheduledEmail } from "@/lib/email/templates/demo-scheduled"
import { ContactEmail } from "@/lib/email/templates/contact"
import { demoBookingSchema } from "@/lib/validations"
import { ZodError } from "zod"

// Function to get next available demo slot
// In production, this would integrate with a calendar API like Google Calendar
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
  
  const endTime = new Date(nextSlot.getTime() + 30 * 60000) // 30 minutes later
  
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
    scheduledDate: nextSlot,
    scheduledTime: nextSlot.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit', 
      minute: '2-digit'
    }),
    meetingLink: 'https://meet.hodos360.com/demo',
    calendarLink: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=HODOS+360+Demo&dates=${nextSlot.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endTime.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=Demo+of+HODOS+360+AI-powered+legal+tech+solutions`,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input with Zod schema
    let validatedData
    try {
      validatedData = demoBookingSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid input data",
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
      throw error
    }
    
    // Check for existing demo booking with same email in the last 24 hours
    const existingBooking = await prisma.demoBooking.findFirst({
      where: {
        email: validatedData.email,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        },
        status: {
          in: ['scheduled', 'confirmed']
        }
      }
    })

    if (existingBooking) {
      return NextResponse.json(
        { 
          error: "You already have a demo scheduled. Please check your email or contact us to reschedule.",
          existingDemo: {
            scheduledDate: existingBooking.scheduledDate,
            scheduledTime: existingBooking.scheduledTime,
          }
        },
        { status: 409 }
      )
    }
    
    // Get demo slot (use preferred date if provided, otherwise next available)
    const demoSlot = validatedData.preferredDate 
      ? {
          date: validatedData.preferredDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          time: validatedData.preferredTime || '14:00',
          scheduledDate: validatedData.preferredDate,
          scheduledTime: validatedData.preferredTime || '14:00',
          meetingLink: 'https://meet.hodos360.com/demo',
          calendarLink: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=HODOS+360+Demo&dates=${validatedData.preferredDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${new Date(validatedData.preferredDate.getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=Demo+of+HODOS+360+AI-powered+legal+tech+solutions`,
        }
      : getNextDemoSlot()
    
    // Create demo booking in database
    const demoBooking = await prisma.demoBooking.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        company: validatedData.company,
        phone: validatedData.phone,
        specialRequests: validatedData.specialRequests,
        preferredDate: validatedData.preferredDate,
        preferredTime: validatedData.preferredTime,
        scheduledDate: demoSlot.scheduledDate,
        scheduledTime: demoSlot.scheduledTime,
        meetingLink: demoSlot.meetingLink,
        calendarLink: demoSlot.calendarLink,
        status: 'scheduled',
        demoType: 'video-call',
        duration: '30 minutes',
      }
    })
    
    // Prepare demo data for emails
    const demoData = {
      recipientEmail: validatedData.email,
      recipientName: validatedData.name || undefined,
      demoDate: demoSlot.date,
      demoTime: demoSlot.time,
      demoType: 'video-call' as const,
      meetingLink: demoSlot.meetingLink,
      calendarLink: demoSlot.calendarLink,
      duration: '30 minutes',
      specialRequests: validatedData.specialRequests || undefined,
    }
    
    // Send demo confirmation email to user
    const confirmationEmailId = await queueEmail({
      to: demoData.recipientEmail,
      subject: 'Your HODOS 360 Demo is Confirmed!',
      react: DemoScheduledEmail(demoData) as React.ReactElement,
      tags: [
        { name: 'type', value: 'demo-confirmation' },
        { name: 'demo-date', value: demoSlot.date },
        { name: 'demo-id', value: demoBooking.id },
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
        company: validatedData.company || 'Not specified',
        message: `Demo scheduled for ${demoSlot.date} at ${demoSlot.time}\n\nSpecial requests: ${demoData.specialRequests || 'None'}\n\nDemo ID: ${demoBooking.id}`,
        timestamp: new Date().toISOString(),
      }) as React.ReactElement,
      tags: [
        { name: 'type', value: 'demo-internal' },
        { name: 'demo-date', value: demoSlot.date },
        { name: 'demo-id', value: demoBooking.id },
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
      id: demoBooking.id,
      email: demoData.recipientEmail,
      demoSlot,
      confirmationEmailId,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json(
      {
        success: true,
        message: "Demo scheduled! Check your email for confirmation and meeting details.",
        data: {
          id: demoBooking.id,
          scheduledDate: demoBooking.scheduledDate,
          scheduledTime: demoBooking.scheduledTime,
          meetingLink: demoBooking.meetingLink,
          calendarLink: demoBooking.calendarLink,
          duration: demoBooking.duration,
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
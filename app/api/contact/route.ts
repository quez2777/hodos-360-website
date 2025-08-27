import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { getCacheHeaders } from "@/lib/cache-config"
import { sendEmail, validateEmail, sanitizeEmailContent } from "@/lib/email/client"
import { queueEmail } from "@/lib/email/queue"
import { ContactEmail } from "@/lib/email/templates/contact"
import { WelcomeEmail } from "@/lib/email/templates/welcome"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email", "company", "message"]
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
    
    // Sanitize input
    const sanitizedData = {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(),
      company: body.company.trim(),
      firmSize: body.firmSize?.trim(),
      practiceAreas: body.practiceAreas || [],
      message: sanitizeEmailContent(body.message.trim()),
    }
    
    // Send internal notification email
    const internalNotification = await sendEmail({
      to: process.env.CONTACT_NOTIFICATION_EMAIL || 'sales@hodos360.com',
      subject: `New Contact Form Submission - ${sanitizedData.firstName} ${sanitizedData.lastName}`,
      react: ContactEmail({
        ...sanitizedData,
        timestamp: new Date().toISOString(),
      }) as React.ReactElement,
      tags: [
        { name: 'type', value: 'contact-form' },
        { name: 'company', value: sanitizedData.company },
      ],
    })
    
    if (!internalNotification.success) {
      console.error('Failed to send internal notification:', internalNotification.error)
    }
    
    // Queue welcome email to the user
    const welcomeEmailId = await queueEmail({
      to: sanitizedData.email,
      subject: 'Thank you for contacting HODOS 360',
      react: WelcomeEmail({
        recipientEmail: sanitizedData.email,
        recipientName: sanitizedData.firstName,
        subscriptionType: 'contact',
      }) as React.ReactElement,
      tags: [
        { name: 'type', value: 'welcome-contact' },
        { name: 'source', value: 'contact-form' },
      ],
    })
    
    // Here you would also:
    // 1. Save to database
    // 2. Add to CRM (HubSpot, Salesforce, etc.)
    // 3. Trigger any automation workflows
    
    console.log("Contact form processed:", {
      email: sanitizedData.email,
      company: sanitizedData.company,
      welcomeEmailId,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your message. We'll be in touch within 24 hours.",
        emailQueued: true,
      },
      {
        headers: getCacheHeaders('api', 'contact'),
      }
    )
  } catch (error) {
    console.error("Contact form error:", error)
    
    // Still try to send a notification about the error
    try {
      await sendEmail({
        to: process.env.ERROR_NOTIFICATION_EMAIL || 'tech@hodos360.com',
        subject: 'Contact Form Error',
        text: `An error occurred processing a contact form submission:\n\n${error}`,
      })
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError)
    }
    
    return NextResponse.json(
      { error: "We encountered an issue processing your request. Please try again or email us directly at hello@hodos360.com" },
      { status: 500 }
    )
  }
}
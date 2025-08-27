import React from "react"
import { NextRequest, NextResponse } from "next/server"
import { getCacheHeaders } from "@/lib/cache-config"
import { sendEmail, validateEmail } from "@/lib/email/client"
import { queueEmail } from "@/lib/email/queue"
import { WelcomeEmail } from "@/lib/email/templates/welcome"

// Mock function to add subscriber to mailing list
// In production, this would integrate with your email marketing platform
async function addToMailingList(email: string, tags?: string[]) {
  // This would typically call Mailchimp, SendGrid Marketing, ConvertKit, etc.
  console.log('Adding to mailing list:', { email, tags })
  return { success: true, subscriberId: `sub_${Date.now()}` }
}

export async function POST(request: NextRequest) {
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
    if (!validateEmail(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }
    
    const email = body.email.trim().toLowerCase()
    const source = body.source || 'website-footer'
    
    // Add to mailing list
    const mailingListResult = await addToMailingList(email, [
      'newsletter',
      'legal-tech',
      source,
    ])
    
    if (!mailingListResult.success) {
      throw new Error('Failed to add to mailing list')
    }
    
    // Send welcome email
    const welcomeEmailId = await queueEmail({
      to: email,
      subject: 'Welcome to HODOS 360 Newsletter',
      react: WelcomeEmail({
        recipientEmail: email,
        subscriptionType: 'newsletter',
      }) as React.ReactElement,
      tags: [
        { name: 'type', value: 'welcome-newsletter' },
        { name: 'source', value: source },
      ],
    })
    
    // Send internal notification for tracking
    if (process.env.NEWSLETTER_NOTIFICATION_EMAIL) {
      await sendEmail({
        to: process.env.NEWSLETTER_NOTIFICATION_EMAIL,
        subject: 'New Newsletter Subscriber',
        text: `New newsletter subscription:\n\nEmail: ${email}\nSource: ${source}\nSubscriber ID: ${mailingListResult.subscriberId}\nTimestamp: ${new Date().toISOString()}`,
        tags: [
          { name: 'type', value: 'newsletter-notification' },
        ],
      })
    }
    
    // Here you would also:
    // 1. Store in your database for backup
    // 2. Trigger welcome email sequence
    // 3. Update analytics/tracking
    // 4. Add to customer data platform
    
    console.log("Newsletter subscription processed:", {
      email,
      source,
      subscriberId: mailingListResult.subscriberId,
      welcomeEmailId,
      timestamp: new Date().toISOString(),
    })
    
    return NextResponse.json(
      {
        success: true,
        message: "Successfully subscribed to newsletter! Check your email for a welcome message.",
        subscribed: true,
      },
      {
        headers: getCacheHeaders('api', 'newsletter'),
      }
    )
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    
    // Check if it's a duplicate subscription error
    if (error instanceof Error && error.message.includes('already subscribed')) {
      return NextResponse.json(
        {
          success: false,
          message: "This email is already subscribed to our newsletter.",
          alreadySubscribed: true,
        },
        { status: 409 } // Conflict
      )
    }
    
    // Send error notification
    try {
      await sendEmail({
        to: process.env.ERROR_NOTIFICATION_EMAIL || 'tech@hodos360.com',
        subject: 'Newsletter Subscription Error',
        text: `An error occurred processing a newsletter subscription:\n\n${error}`,
      })
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError)
    }
    
    return NextResponse.json(
      { error: "We encountered an issue with your subscription. Please try again or email us at hello@hodos360.com" },
      { status: 500 }
    )
  }
}
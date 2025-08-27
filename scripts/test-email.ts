#!/usr/bin/env node

/**
 * Email Service Test Script
 * Usage: npx tsx scripts/test-email.ts [template] [email]
 * 
 * Examples:
 * npx tsx scripts/test-email.ts welcome test@example.com
 * npx tsx scripts/test-email.ts contact test@example.com
 * npx tsx scripts/test-email.ts demo test@example.com
 */

import React from 'react'
import { sendEmail } from '../lib/email/client'
import { ContactEmail } from '../lib/email/templates/contact'
import { DemoScheduledEmail } from '../lib/email/templates/demo-scheduled'
import { WelcomeEmail } from '../lib/email/templates/welcome'

async function testEmail() {
  const [,, template = 'welcome', email = 'test@example.com'] = process.argv
  
  console.log(`Testing ${template} template to ${email}...`)
  
  try {
    let result
    
    switch (template) {
      case 'contact':
        result = await sendEmail({
          to: email,
          subject: 'Test: Contact Form Notification',
          react: ContactEmail({
            firstName: 'Test',
            lastName: 'User',
            email: 'testuser@example.com',
            company: 'Test Law Firm',
            firmSize: '10-50 attorneys',
            practiceAreas: ['Personal Injury', 'Criminal Defense'],
            message: 'This is a test message from the email service test script. If you receive this, the email service is working correctly!',
          }) as React.ReactElement,
        })
        break
        
      case 'demo':
        result = await sendEmail({
          to: email,
          subject: 'Test: Demo Scheduled',
          react: DemoScheduledEmail({
            recipientEmail: email,
            recipientName: 'Test User',
            demoDate: 'Friday, December 15, 2024',
            demoTime: '2:00 PM EST',
            demoType: 'video-call',
            meetingLink: 'https://meet.hodos360.com/test-demo',
            calendarLink: 'https://calendar.google.com/test',
            duration: '30 minutes',
            specialRequests: 'Testing the email service',
          }) as React.ReactElement,
        })
        break
        
      case 'welcome':
      default:
        result = await sendEmail({
          to: email,
          subject: 'Test: Welcome to HODOS 360',
          react: WelcomeEmail({
            recipientEmail: email,
            recipientName: 'Test User',
            subscriptionType: 'newsletter',
          }) as React.ReactElement,
        })
        break
    }
    
    if (result.success) {
      console.log('✅ Email sent successfully!')
      console.log('Email ID:', result.id)
    } else {
      console.error('❌ Failed to send email:', result.error)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
testEmail()
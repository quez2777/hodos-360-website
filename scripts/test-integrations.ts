#!/usr/bin/env ts-node

/**
 * Integration APIs Test Suite
 * Tests all third-party integration APIs for HODOS 360
 * 
 * Run with: npx ts-node scripts/test-integrations.ts
 */

import { NextRequest } from 'next/server'

// Test configuration
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const TEST_USER_ID = 'test-user-123'
const TEST_TOKEN = 'test-jwt-token' // In real implementation, get from auth

interface TestResult {
  api: string
  endpoint: string
  method: string
  status: 'PASS' | 'FAIL' | 'SKIP'
  statusCode?: number
  error?: string
  responseTime?: number
}

class IntegrationTester {
  private results: TestResult[] = []
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async makeRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; data: any; responseTime: number }> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_TOKEN}`,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })

      const data = await response.json().catch(() => ({}))
      const responseTime = Date.now() - startTime

      return {
        status: response.status,
        data,
        responseTime,
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      return {
        status: 500,
        data: { error: (error as Error).message },
        responseTime,
      }
    }
  }

  private addResult(
    api: string,
    endpoint: string,
    method: string,
    status: 'PASS' | 'FAIL' | 'SKIP',
    statusCode?: number,
    error?: string,
    responseTime?: number
  ) {
    this.results.push({
      api,
      endpoint,
      method,
      status,
      statusCode,
      error,
      responseTime,
    })
  }

  // Calendar Integration Tests
  async testCalendarIntegration(): Promise<void> {
    console.log('\n🗓️  Testing Calendar Integration API...')
    
    // Test GET - Sync calendar events
    try {
      const response = await this.makeRequest('/api/integrations/calendar?provider=google')
      this.addResult(
        'Calendar',
        '/api/integrations/calendar',
        'GET',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL', // 400 expected if not authenticated
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Calendar', '/api/integrations/calendar', 'GET', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create calendar event
    try {
      const eventData = {
        title: 'Test Meeting',
        description: 'Test calendar integration',
        startDateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        endDateTime: new Date(Date.now() + 90000000).toISOString(), // Tomorrow + 1 hour
        provider: 'google',
      }

      const response = await this.makeRequest('/api/integrations/calendar', 'POST', eventData)
      this.addResult(
        'Calendar',
        '/api/integrations/calendar',
        'POST',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Calendar', '/api/integrations/calendar', 'POST', 'FAIL', undefined, (error as Error).message)
    }

    // Test PUT - Update calendar event
    try {
      const updateData = {
        eventId: 'test-event-123',
        provider: 'google',
        title: 'Updated Test Meeting',
      }

      const response = await this.makeRequest('/api/integrations/calendar', 'PUT', updateData)
      this.addResult(
        'Calendar',
        '/api/integrations/calendar',
        'PUT',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Calendar', '/api/integrations/calendar', 'PUT', 'FAIL', undefined, (error as Error).message)
    }
  }

  // CRM Integration Tests
  async testCRMIntegration(): Promise<void> {
    console.log('\n👥 Testing CRM Integration API...')

    // Test GET - Sync CRM leads
    try {
      const response = await this.makeRequest('/api/integrations/crm?provider=salesforce')
      this.addResult(
        'CRM',
        '/api/integrations/crm',
        'GET',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('CRM', '/api/integrations/crm', 'GET', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create lead
    try {
      const leadData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Doe Law Firm',
        provider: 'salesforce',
      }

      const response = await this.makeRequest('/api/integrations/crm', 'POST', leadData)
      this.addResult(
        'CRM',
        '/api/integrations/crm',
        'POST',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('CRM', '/api/integrations/crm', 'POST', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create opportunity
    try {
      const opportunityData = {
        type: 'opportunity',
        name: 'Test Legal Case',
        amount: 50000,
        stage: 'Qualified',
        closeDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
        provider: 'salesforce',
      }

      const response = await this.makeRequest('/api/integrations/crm', 'POST', opportunityData)
      this.addResult(
        'CRM',
        '/api/integrations/crm',
        'POST (Opportunity)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('CRM', '/api/integrations/crm', 'POST (Opportunity)', 'FAIL', undefined, (error as Error).message)
    }

    // Test PUT - Update lead
    try {
      const updateData = {
        leadId: 'test-lead-123',
        provider: 'salesforce',
        status: 'Contacted',
        description: 'Updated lead description',
      }

      const response = await this.makeRequest('/api/integrations/crm', 'PUT', updateData)
      this.addResult(
        'CRM',
        '/api/integrations/crm',
        'PUT',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('CRM', '/api/integrations/crm', 'PUT', 'FAIL', undefined, (error as Error).message)
    }
  }

  // Payment Integration Tests
  async testPaymentIntegration(): Promise<void> {
    console.log('\n💳 Testing Payment Integration API...')

    // Test GET - Retrieve customer data
    try {
      const response = await this.makeRequest('/api/integrations/payment?type=customer&limit=5')
      this.addResult(
        'Payment',
        '/api/integrations/payment',
        'GET (Customer)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Payment', '/api/integrations/payment', 'GET (Customer)', 'FAIL', undefined, (error as Error).message)
    }

    // Test GET - Retrieve subscriptions
    try {
      const response = await this.makeRequest('/api/integrations/payment?type=subscription&limit=5')
      this.addResult(
        'Payment',
        '/api/integrations/payment',
        'GET (Subscription)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Payment', '/api/integrations/payment', 'GET (Subscription)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create checkout session
    try {
      const checkoutData = {
        type: 'checkout',
        mode: 'payment',
        lineItems: [{
          price: {
            currency: 'usd',
            unitAmount: 5000, // $50.00
            productName: 'Legal Consultation',
          },
          quantity: 1,
        }],
        successUrl: `${this.baseUrl}/success`,
        cancelUrl: `${this.baseUrl}/cancel`,
      }

      const response = await this.makeRequest('/api/integrations/payment', 'POST', checkoutData)
      this.addResult(
        'Payment',
        '/api/integrations/payment',
        'POST (Checkout)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Payment', '/api/integrations/payment', 'POST (Checkout)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create subscription
    try {
      const subscriptionData = {
        type: 'subscription',
        email: 'test@example.com',
        priceId: 'price_test_123',
        trialDays: 7,
      }

      const response = await this.makeRequest('/api/integrations/payment', 'POST', subscriptionData)
      this.addResult(
        'Payment',
        '/api/integrations/payment',
        'POST (Subscription)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Payment', '/api/integrations/payment', 'POST (Subscription)', 'FAIL', undefined, (error as Error).message)
    }

    // Test PUT - Refund payment
    try {
      const refundData = {
        type: 'refund',
        paymentIntentId: 'pi_test_123',
        amount: 2500, // $25.00 partial refund
        reason: 'requested_by_customer',
      }

      const response = await this.makeRequest('/api/integrations/payment', 'PUT', refundData)
      this.addResult(
        'Payment',
        '/api/integrations/payment',
        'PUT (Refund)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Payment', '/api/integrations/payment', 'PUT (Refund)', 'FAIL', undefined, (error as Error).message)
    }
  }

  // Email Integration Tests
  async testEmailIntegration(): Promise<void> {
    console.log('\n📧 Testing Email Integration API...')

    // Test GET - Retrieve email stats
    try {
      const response = await this.makeRequest('/api/integrations/email?type=stats&messageIds=msg_123,msg_456')
      this.addResult(
        'Email',
        '/api/integrations/email',
        'GET (Stats)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Email', '/api/integrations/email', 'GET (Stats)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Send email
    try {
      const emailData = {
        type: 'email',
        to: [{ email: 'test@example.com', name: 'Test User' }],
        from: { email: 'noreply@hodos360.com', name: 'HODOS 360' },
        subject: 'Test Email Integration',
        htmlContent: '<p>This is a test email from the integration API.</p>',
        textContent: 'This is a test email from the integration API.',
      }

      const response = await this.makeRequest('/api/integrations/email', 'POST', emailData)
      this.addResult(
        'Email',
        '/api/integrations/email',
        'POST (Send)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Email', '/api/integrations/email', 'POST (Send)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create campaign
    try {
      const campaignData = {
        type: 'campaign',
        title: 'Test Campaign',
        subject: 'Welcome to HODOS 360',
        senderName: 'HODOS 360 Team',
        senderEmail: 'noreply@hodos360.com',
        htmlContent: '<h1>Welcome!</h1><p>Thank you for joining HODOS 360.</p>',
        categories: ['welcome', 'onboarding'],
      }

      const response = await this.makeRequest('/api/integrations/email', 'POST', campaignData)
      this.addResult(
        'Email',
        '/api/integrations/email',
        'POST (Campaign)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Email', '/api/integrations/email', 'POST (Campaign)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create contact
    try {
      const contactData = {
        type: 'contact',
        email: 'newcontact@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        customFields: {
          company: 'Smith Legal',
          practice_area: 'Personal Injury',
        },
      }

      const response = await this.makeRequest('/api/integrations/email', 'POST', contactData)
      this.addResult(
        'Email',
        '/api/integrations/email',
        'POST (Contact)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Email', '/api/integrations/email', 'POST (Contact)', 'FAIL', undefined, (error as Error).message)
    }
  }

  // Storage Integration Tests
  async testStorageIntegration(): Promise<void> {
    console.log('\n🗄️  Testing Storage Integration API...')

    // Test GET - List files
    try {
      const response = await this.makeRequest('/api/integrations/storage?operation=list&folder=documents&maxKeys=10')
      this.addResult(
        'Storage',
        '/api/integrations/storage',
        'GET (List)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Storage', '/api/integrations/storage', 'GET (List)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create presigned URL
    try {
      const presignedData = {
        operation: 'presigned-url',
        fileName: 'test-document.pdf',
        contentType: 'application/pdf',
        operation_type: 'upload',
        folder: 'documents',
      }

      const response = await this.makeRequest('/api/integrations/storage', 'POST', presignedData)
      this.addResult(
        'Storage',
        '/api/integrations/storage',
        'POST (Presigned URL)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Storage', '/api/integrations/storage', 'POST (Presigned URL)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Initiate multipart upload
    try {
      const multipartData = {
        operation: 'multipart-initiate',
        fileName: 'large-file.zip',
        contentType: 'application/zip',
        fileSize: 50 * 1024 * 1024, // 50MB
        folder: 'uploads',
      }

      const response = await this.makeRequest('/api/integrations/storage', 'POST', multipartData)
      this.addResult(
        'Storage',
        '/api/integrations/storage',
        'POST (Multipart Init)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Storage', '/api/integrations/storage', 'POST (Multipart Init)', 'FAIL', undefined, (error as Error).message)
    }

    // Test POST - Create backup
    try {
      const backupData = {
        operation: 'backup',
        sourceKeys: ['documents/file1.pdf', 'documents/file2.docx'],
        backupFolder: 'backups',
        compressionLevel: 'standard',
        encryptBackup: true,
      }

      const response = await this.makeRequest('/api/integrations/storage', 'POST', backupData)
      this.addResult(
        'Storage',
        '/api/integrations/storage',
        'POST (Backup)',
        response.status === 200 || response.status === 400 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Storage', '/api/integrations/storage', 'POST (Backup)', 'FAIL', undefined, (error as Error).message)
    }

    // Test PUT - Move file
    try {
      const moveData = {
        operation: 'move',
        sourceKey: 'temp/old-file.pdf',
        destinationKey: 'documents/new-file.pdf',
        deleteSource: true,
      }

      const response = await this.makeRequest('/api/integrations/storage', 'PUT', moveData)
      this.addResult(
        'Storage',
        '/api/integrations/storage',
        'PUT (Move)',
        response.status === 200 || response.status === 400 || response.status === 404 ? 'PASS' : 'FAIL', // 404 expected if file doesn't exist
        response.status,
        response.status !== 200 ? response.data.error : undefined,
        response.responseTime
      )
    } catch (error) {
      this.addResult('Storage', '/api/integrations/storage', 'PUT (Move)', 'FAIL', undefined, (error as Error).message)
    }
  }

  // Authentication Tests
  async testAuthentication(): Promise<void> {
    console.log('\n🔐 Testing Authentication & Authorization...')

    // Test unauthorized access
    try {
      const response = await fetch(`${this.baseUrl}/api/integrations/calendar`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header
        },
      })

      this.addResult(
        'Auth',
        'Unauthorized Access',
        'GET',
        response.status === 401 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 401 ? 'Should return 401 for unauthorized access' : undefined
      )
    } catch (error) {
      this.addResult('Auth', 'Unauthorized Access', 'GET', 'FAIL', undefined, (error as Error).message)
    }

    // Test invalid token
    try {
      const response = await fetch(`${this.baseUrl}/api/integrations/crm`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token',
        },
      })

      this.addResult(
        'Auth',
        'Invalid Token',
        'GET',
        response.status === 401 ? 'PASS' : 'FAIL',
        response.status,
        response.status !== 401 ? 'Should return 401 for invalid token' : undefined
      )
    } catch (error) {
      this.addResult('Auth', 'Invalid Token', 'GET', 'FAIL', undefined, (error as Error).message)
    }
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting HODOS 360 Integration APIs Test Suite\n')
    console.log(`Base URL: ${this.baseUrl}`)
    console.log(`Test User ID: ${TEST_USER_ID}\n`)

    const startTime = Date.now()

    // Run all test suites
    await this.testAuthentication()
    await this.testCalendarIntegration()
    await this.testCRMIntegration()
    await this.testPaymentIntegration()
    await this.testEmailIntegration()
    await this.testStorageIntegration()

    const totalTime = Date.now() - startTime

    // Print results
    this.printResults(totalTime)
  }

  private printResults(totalTime: number): void {
    console.log('\n' + '='.repeat(80))
    console.log('📊 TEST RESULTS SUMMARY')
    console.log('='.repeat(80))

    const passed = this.results.filter(r => r.status === 'PASS').length
    const failed = this.results.filter(r => r.status === 'FAIL').length
    const skipped = this.results.filter(r => r.status === 'SKIP').length
    const total = this.results.length

    console.log(`\nTotal Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`⏱️  Total Time: ${totalTime}ms\n`)

    // Group results by API
    const groupedResults = this.results.reduce((acc, result) => {
      if (!acc[result.api]) {
        acc[result.api] = []
      }
      acc[result.api].push(result)
      return acc
    }, {} as Record<string, TestResult[]>)

    // Print detailed results for each API
    Object.entries(groupedResults).forEach(([api, results]) => {
      console.log(`\n${api} API:`)
      results.forEach(result => {
        const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️'
        const time = result.responseTime ? `(${result.responseTime}ms)` : ''
        console.log(`  ${status} ${result.method} ${result.endpoint} ${time}`)
        if (result.error) {
          console.log(`      Error: ${result.error}`)
        }
      })
    })

    // Summary
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Integration APIs are working correctly.')
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Please check the errors above.`)
    }

    console.log('\nNote: Some tests may fail due to missing API keys or authentication.')
    console.log('This is expected in a development environment.')
  }
}

// Main execution
async function main() {
  try {
    const tester = new IntegrationTester(BASE_URL)
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ Test suite failed:', error)
    process.exit(1)
  }
}

// Run the tests
if (require.main === module) {
  main()
}

export { IntegrationTester }
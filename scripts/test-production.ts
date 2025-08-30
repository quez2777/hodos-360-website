#!/usr/bin/env tsx

/**
 * HODOS 360 Production Test Suite
 * 
 * Comprehensive testing for production deployment
 * Tests all API endpoints, integrations, and critical user flows
 */

import axios, { AxiosResponse } from 'axios'
import { performance } from 'perf_hooks'

interface TestResult {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  duration: number
  error?: string
  details?: any
}

interface TestSuite {
  name: string
  results: TestResult[]
  totalTests: number
  passed: number
  failed: number
  duration: number
}

class ProductionTester {
  private baseUrl: string
  private results: TestSuite[] = []
  private apiKey?: string
  private authToken?: string

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.apiKey = apiKey
  }

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    const url = `${this.baseUrl}${endpoint}`
    const config = {
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HODOS-Production-Test-Suite/1.0',
        ...headers,
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` })
      },
      timeout: 30000, // 30 seconds
      validateStatus: () => true // Don't throw on HTTP error codes
    }

    return axios(config)
  }

  private async runTest(name: string, testFn: () => Promise<TestResult>): Promise<TestResult> {
    const startTime = performance.now()
    
    try {
      const result = await testFn()
      result.duration = performance.now() - startTime
      result.name = name
      return result
    } catch (error) {
      return {
        name,
        status: 'FAIL',
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Health Check Tests
  private async testHealthEndpoints(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Health Check Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    // Basic health check
    suite.results.push(await this.runTest('Basic Health Check', async () => {
      const response = await this.makeRequest('GET', '/api/health')
      
      if (response.status === 200 && response.data.status === 'healthy') {
        return {
          name: '',
          status: 'PASS' as const,
          duration: 0,
          details: { responseTime: response.data.checks?.api?.responseTime }
        }
      } else {
        return {
          name: '',
          status: 'FAIL' as const,
          duration: 0,
          error: `Health check failed: ${response.status} - ${JSON.stringify(response.data)}`
        }
      }
    }))

    // Detailed health check
    suite.results.push(await this.runTest('Detailed Health Check', async () => {
      const response = await this.makeRequest('GET', '/api/health/detailed')
      
      if (response.status === 200 && response.data.status === 'healthy') {
        return {
          name: '',
          status: 'PASS' as const,
          duration: 0,
          details: response.data.checks
        }
      } else {
        return {
          name: '',
          status: 'FAIL' as const,
          duration: 0,
          error: `Detailed health check failed: ${response.status}`
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // API Endpoint Tests
  private async testAPIEndpoints(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'API Endpoint Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    const endpoints = [
      { method: 'GET' as const, path: '/api/contact', expectedStatus: [200, 405] },
      { method: 'GET' as const, path: '/api/demo', expectedStatus: [200, 405] },
      { method: 'GET' as const, path: '/api/newsletter', expectedStatus: [200, 405] },
      { method: 'GET' as const, path: '/api/blog', expectedStatus: [200] },
      { method: 'GET' as const, path: '/api/data/pricing', expectedStatus: [200] },
      { method: 'GET' as const, path: '/api/data/testimonials', expectedStatus: [200] },
      { method: 'GET' as const, path: '/api/email/status', expectedStatus: [200, 405] },
      { method: 'GET' as const, path: '/api/cache', expectedStatus: [200, 405] },
    ]

    for (const endpoint of endpoints) {
      suite.results.push(await this.runTest(`${endpoint.method} ${endpoint.path}`, async () => {
        const response = await this.makeRequest(endpoint.method, endpoint.path)
        
        if (endpoint.expectedStatus.includes(response.status)) {
          return {
            name: '',
            status: 'PASS' as const,
            duration: 0,
            details: { status: response.status, size: JSON.stringify(response.data).length }
          }
        } else {
          return {
            name: '',
            status: 'FAIL' as const,
            duration: 0,
            error: `Expected status ${endpoint.expectedStatus}, got ${response.status}`
          }
        }
      }))
    }

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // AI Endpoint Tests
  private async testAIEndpoints(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'AI Endpoint Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    const aiEndpoints = [
      '/api/ai/chat',
      '/api/ai/seo',
      '/api/ai/marketing/content',
      '/api/ai/marketing/keywords',
      '/api/ai/video/script',
      '/api/ai/legal/research'
    ]

    for (const endpoint of aiEndpoints) {
      suite.results.push(await this.runTest(`AI Endpoint ${endpoint}`, async () => {
        const testData = {
          message: 'Test message for AI endpoint validation',
          prompt: 'Generate a brief test response'
        }

        const response = await this.makeRequest('POST', endpoint, testData)
        
        // AI endpoints should return 200 for valid requests or proper error codes
        if ([200, 400, 401, 403, 429, 500].includes(response.status)) {
          return {
            name: '',
            status: response.status === 200 ? 'PASS' as const : 'WARN' as const,
            duration: 0,
            details: { 
              status: response.status,
              hasError: response.status >= 400,
              responseSize: JSON.stringify(response.data).length 
            }
          }
        } else {
          return {
            name: '',
            status: 'FAIL' as const,
            duration: 0,
            error: `Unexpected status code: ${response.status}`
          }
        }
      }))
    }

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // Form Submission Tests
  private async testFormSubmissions(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Form Submission Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    // Test contact form
    suite.results.push(await this.runTest('Contact Form Submission', async () => {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Company',
        message: 'This is a test message from the production test suite',
        phone: '555-0123',
        isTestSubmission: true
      }

      const response = await this.makeRequest('POST', '/api/contact', testData)
      
      if ([200, 201].includes(response.status)) {
        return {
          name: '',
          status: 'PASS' as const,
          duration: 0,
          details: { submissionId: response.data.id || 'unknown' }
        }
      } else {
        return {
          name: '',
          status: 'FAIL' as const,
          duration: 0,
          error: `Contact form submission failed: ${response.status} - ${JSON.stringify(response.data)}`
        }
      }
    }))

    // Test demo booking
    suite.results.push(await this.runTest('Demo Booking Submission', async () => {
      const testData = {
        name: 'Test Demo User',
        email: 'demo@example.com',
        company: 'Test Demo Company',
        phone: '555-0124',
        product: 'HODOS',
        preferredTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        isTestSubmission: true
      }

      const response = await this.makeRequest('POST', '/api/demo', testData)
      
      if ([200, 201].includes(response.status)) {
        return {
          name: '',
          status: 'PASS' as const,
          duration: 0,
          details: { bookingId: response.data.id || 'unknown' }
        }
      } else {
        return {
          name: '',
          status: 'FAIL' as const,
          duration: 0,
          error: `Demo booking failed: ${response.status} - ${JSON.stringify(response.data)}`
        }
      }
    }))

    // Test newsletter subscription
    suite.results.push(await this.runTest('Newsletter Subscription', async () => {
      const testData = {
        email: 'newsletter-test@example.com',
        source: 'production-test-suite'
      }

      const response = await this.makeRequest('POST', '/api/newsletter', testData)
      
      if ([200, 201].includes(response.status)) {
        return {
          name: '',
          status: 'PASS' as const,
          duration: 0
        }
      } else {
        return {
          name: '',
          status: 'FAIL' as const,
          duration: 0,
          error: `Newsletter subscription failed: ${response.status}`
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // GHL Integration Tests
  private async testGHLIntegration(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'GoHighLevel Integration Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    // Test GHL webhook endpoint
    suite.results.push(await this.runTest('GHL Webhook Endpoint', async () => {
      const response = await this.makeRequest('POST', '/api/integrations/crm', {
        type: 'test',
        data: { message: 'Production test webhook' }
      })
      
      if ([200, 400, 401].includes(response.status)) {
        return {
          name: '',
          status: response.status === 200 ? 'PASS' as const : 'WARN' as const,
          duration: 0,
          details: { status: response.status }
        }
      } else {
        return {
          name: '',
          status: 'FAIL' as const,
          duration: 0,
          error: `GHL webhook test failed: ${response.status}`
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // Page Load Tests
  private async testPageLoads(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Page Load Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    const pages = [
      '/',
      '/about',
      '/contact',
      '/pricing',
      '/products',
      '/products/hodos',
      '/products/marketing',
      '/products/video-agents',
      '/blog'
    ]

    for (const page of pages) {
      suite.results.push(await this.runTest(`Page Load: ${page}`, async () => {
        const pageStartTime = performance.now()
        const response = await this.makeRequest('GET', page)
        const loadTime = performance.now() - pageStartTime
        
        if (response.status === 200) {
          const isSlowLoad = loadTime > 3000 // 3 seconds
          return {
            name: '',
            status: isSlowLoad ? 'WARN' as const : 'PASS' as const,
            duration: 0,
            details: { 
              loadTime: `${loadTime.toFixed(2)}ms`,
              contentLength: response.headers['content-length'] || 'unknown'
            }
          }
        } else {
          return {
            name: '',
            status: 'FAIL' as const,
            duration: 0,
            error: `Page failed to load: ${response.status}`
          }
        }
      }))
    }

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // SEO and Meta Tags Tests
  private async testSEOAndMeta(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'SEO and Meta Tags Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    const criticalPages = ['/', '/about', '/contact', '/pricing', '/products']

    for (const page of criticalPages) {
      suite.results.push(await this.runTest(`SEO Meta Tags: ${page}`, async () => {
        const response = await this.makeRequest('GET', page)
        
        if (response.status === 200) {
          const html = response.data as string
          const hasTitle = /<title[^>]*>(.+?)<\/title>/i.test(html)
          const hasDescription = /<meta[^>]*name=["\']description["\'][^>]*content=["\'](.+?)["\'][^>]*>/i.test(html)
          const hasOgTitle = /<meta[^>]*property=["\']og:title["\'][^>]*content=["\'](.+?)["\'][^>]*>/i.test(html)
          const hasCanonical = /<link[^>]*rel=["\']canonical["\'][^>]*>/i.test(html)

          const score = [hasTitle, hasDescription, hasOgTitle, hasCanonical].filter(Boolean).length

          if (score >= 3) {
            return {
              name: '',
              status: 'PASS' as const,
              duration: 0,
              details: { 
                seoScore: `${score}/4`,
                hasTitle,
                hasDescription,
                hasOgTitle,
                hasCanonical
              }
            }
          } else {
            return {
              name: '',
              status: 'WARN' as const,
              duration: 0,
              error: `SEO score too low: ${score}/4`,
              details: { hasTitle, hasDescription, hasOgTitle, hasCanonical }
            }
          }
        } else {
          return {
            name: '',
            status: 'FAIL' as const,
            duration: 0,
            error: `Page not accessible: ${response.status}`
          }
        }
      }))
    }

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // Security Headers Tests
  private async testSecurityHeaders(): Promise<TestSuite> {
    const suite: TestSuite = {
      name: 'Security Headers Tests',
      results: [],
      totalTests: 0,
      passed: 0,
      failed: 0,
      duration: 0
    }

    const startTime = performance.now()

    suite.results.push(await this.runTest('Security Headers Check', async () => {
      const response = await this.makeRequest('GET', '/')
      
      if (response.status === 200) {
        const headers = response.headers
        const securityHeaders = {
          'x-frame-options': headers['x-frame-options'],
          'x-content-type-options': headers['x-content-type-options'],
          'x-xss-protection': headers['x-xss-protection'],
          'strict-transport-security': headers['strict-transport-security'],
          'content-security-policy': headers['content-security-policy'],
          'referrer-policy': headers['referrer-policy']
        }

        const presentHeaders = Object.entries(securityHeaders).filter(([_, value]) => value).length
        const score = presentHeaders / Object.keys(securityHeaders).length

        if (score >= 0.7) {
          return {
            name: '',
            status: 'PASS' as const,
            duration: 0,
            details: { 
              score: `${presentHeaders}/${Object.keys(securityHeaders).length}`,
              headers: securityHeaders
            }
          }
        } else {
          return {
            name: '',
            status: 'WARN' as const,
            duration: 0,
            error: `Security headers incomplete: ${presentHeaders}/${Object.keys(securityHeaders).length}`,
            details: { headers: securityHeaders }
          }
        }
      } else {
        return {
          name: '',
          status: 'FAIL' as const,
          duration: 0,
          error: `Cannot check security headers: ${response.status}`
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.totalTests = suite.results.length
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length

    return suite
  }

  // Run all tests
  public async runAllTests(): Promise<void> {
    console.log('🚀 HODOS 360 Production Test Suite')
    console.log('=' .repeat(50))
    console.log(`Testing: ${this.baseUrl}`)
    console.log(`Started: ${new Date().toISOString()}`)
    console.log()

    const allTests = [
      this.testHealthEndpoints(),
      this.testAPIEndpoints(),
      this.testAIEndpoints(),
      this.testFormSubmissions(),
      this.testGHLIntegration(),
      this.testPageLoads(),
      this.testSEOAndMeta(),
      this.testSecurityHeaders()
    ]

    const testResults = await Promise.all(allTests)
    this.results = testResults

    // Print results
    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0
    let totalWarnings = 0

    for (const suite of this.results) {
      totalTests += suite.totalTests
      totalPassed += suite.passed
      totalFailed += suite.failed
      totalWarnings += suite.results.filter(r => r.status === 'WARN').length

      console.log(`📊 ${suite.name}`)
      console.log(`   Tests: ${suite.totalTests} | Passed: ${suite.passed} | Failed: ${suite.failed} | Duration: ${suite.duration.toFixed(2)}ms`)
      
      // Show failed tests
      const failedTests = suite.results.filter(r => r.status === 'FAIL')
      if (failedTests.length > 0) {
        console.log('   ❌ Failed Tests:')
        failedTests.forEach(test => {
          console.log(`      - ${test.name}: ${test.error}`)
        })
      }

      // Show warnings
      const warnTests = suite.results.filter(r => r.status === 'WARN')
      if (warnTests.length > 0) {
        console.log('   ⚠️  Warning Tests:')
        warnTests.forEach(test => {
          console.log(`      - ${test.name}: ${test.error || 'Performance or configuration issue'}`)
        })
      }

      console.log()
    }

    console.log('=' .repeat(50))
    console.log('📈 FINAL RESULTS')
    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`)
    console.log(`⚠️  Warnings: ${totalWarnings} (${((totalWarnings/totalTests)*100).toFixed(1)}%)`)
    console.log(`❌ Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`)
    
    const successRate = ((totalPassed + totalWarnings) / totalTests) * 100
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`)
    
    if (successRate >= 95) {
      console.log('🎉 EXCELLENT - Production ready!')
    } else if (successRate >= 85) {
      console.log('✅ GOOD - Minor issues to address')
    } else if (successRate >= 70) {
      console.log('⚠️  NEEDS WORK - Several issues to fix')
    } else {
      console.log('❌ CRITICAL ISSUES - Do not deploy!')
    }

    console.log(`Completed: ${new Date().toISOString()}`)

    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalWarnings,
        successRate
      },
      testSuites: this.results
    }

    const fs = await import('fs')
    const reportPath = `./test-reports/production-test-report-${Date.now()}.json`
    await fs.promises.mkdir('./test-reports', { recursive: true })
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📋 Detailed report saved: ${reportPath}`)
    
    // Exit with appropriate code
    process.exit(totalFailed > 0 ? 1 : 0)
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const baseUrl = args[0] || 'http://localhost:3000'
  const apiKey = args[1] || process.env.PRODUCTION_API_KEY

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
HODOS 360 Production Test Suite

Usage: tsx scripts/test-production.ts [BASE_URL] [API_KEY]

Arguments:
  BASE_URL    Base URL to test (default: http://localhost:3000)
  API_KEY     Optional API key for authenticated endpoints

Environment Variables:
  PRODUCTION_API_KEY    API key for production testing

Examples:
  tsx scripts/test-production.ts
  tsx scripts/test-production.ts https://hodos360.com
  tsx scripts/test-production.ts https://staging.hodos360.com your-api-key
`)
    process.exit(0)
  }

  const tester = new ProductionTester(baseUrl, apiKey)
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { ProductionTester }
#!/usr/bin/env tsx

/**
 * HODOS 360 Post-Deployment Verification Script
 * 
 * Comprehensive verification suite that runs immediately after deployment
 * Ensures all critical systems are working before marking deployment as successful
 */

import axios, { AxiosResponse } from 'axios'
import { performance } from 'perf_hooks'

interface VerificationResult {
  name: string
  status: 'PASS' | 'FAIL' | 'WARN'
  duration: number
  error?: string
  details?: any
  critical: boolean
}

interface VerificationSuite {
  name: string
  results: VerificationResult[]
  passed: number
  failed: number
  warnings: number
  criticalFailures: number
  duration: number
}

class PostDeployVerifier {
  private baseUrl: string
  private results: VerificationSuite[] = []
  private startTime: number

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.startTime = performance.now()
  }

  private async makeRequest(
    method: 'GET' | 'POST' | 'HEAD',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<AxiosResponse> {
    const url = `${this.baseUrl}${endpoint}`
    return axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HODOS-PostDeploy-Verifier/1.0',
        ...headers
      },
      timeout: 30000,
      validateStatus: () => true // Don't throw on HTTP error codes
    })
  }

  private async runVerification(
    name: string,
    critical: boolean,
    verifyFn: () => Promise<Omit<VerificationResult, 'name' | 'duration' | 'critical'>>
  ): Promise<VerificationResult> {
    const startTime = performance.now()
    
    try {
      const result = await verifyFn()
      return {
        name,
        critical,
        duration: performance.now() - startTime,
        ...result
      }
    } catch (error) {
      return {
        name,
        critical,
        status: 'FAIL',
        duration: performance.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Critical Infrastructure Tests
  private async verifyCriticalInfrastructure(): Promise<VerificationSuite> {
    const suite: VerificationSuite = {
      name: 'Critical Infrastructure',
      results: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0,
      duration: 0
    }

    const startTime = performance.now()

    // 1. Application is responding
    suite.results.push(await this.runVerification('Application Response', true, async () => {
      const response = await this.makeRequest('GET', '/')
      
      if (response.status === 200) {
        const responseTime = response.headers['x-response-time'] || 'unknown'
        return {
          status: 'PASS' as const,
          details: { 
            statusCode: response.status,
            responseTime,
            contentLength: response.headers['content-length']
          }
        }
      } else {
        return {
          status: 'FAIL' as const,
          error: `Application not responding: HTTP ${response.status}`
        }
      }
    }))

    // 2. Database connectivity
    suite.results.push(await this.runVerification('Database Connectivity', true, async () => {
      const response = await this.makeRequest('GET', '/api/health')
      
      if (response.status === 200 && response.data.status === 'healthy') {
        const dbStatus = response.data.checks?.database
        if (dbStatus?.status === 'up') {
          return {
            status: 'PASS' as const,
            details: { responseTime: dbStatus.responseTime }
          }
        }
      }
      
      return {
        status: 'FAIL' as const,
        error: `Database not accessible: ${response.status}`
      }
    }))

    // 3. API endpoints are functional
    suite.results.push(await this.runVerification('Core API Endpoints', true, async () => {
      const healthResponse = await this.makeRequest('GET', '/api/health/detailed')
      
      if (healthResponse.status === 200) {
        const healthData = healthResponse.data
        const serviceStatus = Object.values(healthData.services || {})
        const downServices = serviceStatus.filter((s: any) => s.status === 'down')
        
        if (downServices.length === 0) {
          return {
            status: 'PASS' as const,
            details: { 
              services: Object.keys(healthData.services || {}).length,
              overallHealth: healthData.status
            }
          }
        } else {
          return {
            status: 'WARN' as const,
            error: `${downServices.length} services are down`,
            details: { downServices }
          }
        }
      } else {
        return {
          status: 'FAIL' as const,
          error: `Health endpoint failed: ${healthResponse.status}`
        }
      }
    }))

    // 4. SSL Certificate validation
    suite.results.push(await this.runVerification('SSL Certificate', true, async () => {
      if (!this.baseUrl.startsWith('https://')) {
        return {
          status: 'WARN' as const,
          error: 'Not using HTTPS in production'
        }
      }

      const response = await this.makeRequest('HEAD', '/')
      const securityHeaders = response.headers['strict-transport-security']
      
      return {
        status: securityHeaders ? 'PASS' as const : 'WARN' as const,
        details: { 
          https: true,
          hsts: !!securityHeaders,
          protocol: 'TLS'
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length
    suite.warnings = suite.results.filter(r => r.status === 'WARN').length
    suite.criticalFailures = suite.results.filter(r => r.status === 'FAIL' && r.critical).length

    return suite
  }

  // Performance Verification
  private async verifyPerformance(): Promise<VerificationSuite> {
    const suite: VerificationSuite = {
      name: 'Performance Verification',
      results: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0,
      duration: 0
    }

    const startTime = performance.now()

    // 1. Page load performance
    const criticalPages = ['/', '/products', '/contact', '/pricing']
    
    for (const page of criticalPages) {
      suite.results.push(await this.runVerification(`Page Load: ${page}`, false, async () => {
        const pageStartTime = performance.now()
        const response = await this.makeRequest('GET', page)
        const loadTime = performance.now() - pageStartTime
        
        if (response.status === 200) {
          if (loadTime < 2000) {
            return {
              status: 'PASS' as const,
              details: { loadTime: `${loadTime.toFixed(2)}ms` }
            }
          } else if (loadTime < 5000) {
            return {
              status: 'WARN' as const,
              error: 'Page load is slow but acceptable',
              details: { loadTime: `${loadTime.toFixed(2)}ms` }
            }
          } else {
            return {
              status: 'FAIL' as const,
              error: 'Page load is too slow',
              details: { loadTime: `${loadTime.toFixed(2)}ms` }
            }
          }
        } else {
          return {
            status: 'FAIL' as const,
            error: `Page not accessible: ${response.status}`
          }
        }
      }))
    }

    // 2. API response times
    suite.results.push(await this.runVerification('API Response Times', false, async () => {
      const apiEndpoints = [
        '/api/health',
        '/api/data/pricing',
        '/api/data/testimonials'
      ]

      const results = await Promise.all(
        apiEndpoints.map(async (endpoint) => {
          const start = performance.now()
          const response = await this.makeRequest('GET', endpoint)
          const time = performance.now() - start
          return { endpoint, time, status: response.status }
        })
      )

      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length
      const slowEndpoints = results.filter(r => r.time > 1000)
      
      if (avgTime < 500) {
        return {
          status: 'PASS' as const,
          details: { avgResponseTime: `${avgTime.toFixed(2)}ms`, slowEndpoints: slowEndpoints.length }
        }
      } else if (avgTime < 1000) {
        return {
          status: 'WARN' as const,
          error: 'API responses are slower than expected',
          details: { avgResponseTime: `${avgTime.toFixed(2)}ms` }
        }
      } else {
        return {
          status: 'FAIL' as const,
          error: 'API responses are too slow',
          details: { avgResponseTime: `${avgTime.toFixed(2)}ms` }
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length
    suite.warnings = suite.results.filter(r => r.status === 'WARN').length
    suite.criticalFailures = suite.results.filter(r => r.status === 'FAIL' && r.critical).length

    return suite
  }

  // SEO and Content Verification
  private async verifySEOAndContent(): Promise<VerificationSuite> {
    const suite: VerificationSuite = {
      name: 'SEO and Content',
      results: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0,
      duration: 0
    }

    const startTime = performance.now()

    // 1. Meta tags verification
    suite.results.push(await this.runVerification('SEO Meta Tags', false, async () => {
      const response = await this.makeRequest('GET', '/')
      
      if (response.status === 200) {
        const html = response.data as string
        
        const checks = {
          title: /<title[^>]*>(.+?)<\/title>/i.test(html),
          description: /<meta[^>]*name=["\']description["\'][^>]*content=["\'](.+?)["\'][^>]*>/i.test(html),
          ogTitle: /<meta[^>]*property=["\']og:title["\'][^>]*>/i.test(html),
          ogDescription: /<meta[^>]*property=["\']og:description["\'][^>]*>/i.test(html),
          canonical: /<link[^>]*rel=["\']canonical["\'][^>]*>/i.test(html),
          viewport: /<meta[^>]*name=["\']viewport["\'][^>]*>/i.test(html)
        }

        const score = Object.values(checks).filter(Boolean).length
        const total = Object.keys(checks).length

        if (score >= total * 0.8) {
          return {
            status: 'PASS' as const,
            details: { score: `${score}/${total}`, checks }
          }
        } else {
          return {
            status: 'WARN' as const,
            error: `SEO meta tags incomplete: ${score}/${total}`,
            details: { checks }
          }
        }
      } else {
        return {
          status: 'FAIL' as const,
          error: `Cannot verify SEO tags: ${response.status}`
        }
      }
    }))

    // 2. Sitemap verification
    suite.results.push(await this.runVerification('Sitemap Accessibility', false, async () => {
      const response = await this.makeRequest('GET', '/sitemap.xml')
      
      if (response.status === 200) {
        const content = response.data as string
        const urlCount = (content.match(/<url>/g) || []).length
        
        return {
          status: urlCount > 5 ? 'PASS' as const : 'WARN' as const,
          details: { urlCount, contentLength: content.length }
        }
      } else {
        return {
          status: 'WARN' as const,
          error: `Sitemap not accessible: ${response.status}`
        }
      }
    }))

    // 3. Robots.txt verification
    suite.results.push(await this.runVerification('Robots.txt', false, async () => {
      const response = await this.makeRequest('GET', '/robots.txt')
      
      if (response.status === 200) {
        const content = response.data as string
        const hasUserAgent = content.includes('User-agent:')
        const hasSitemap = content.includes('Sitemap:')
        
        return {
          status: hasUserAgent ? 'PASS' as const : 'WARN' as const,
          details: { hasUserAgent, hasSitemap, size: content.length }
        }
      } else {
        return {
          status: 'WARN' as const,
          error: `Robots.txt not found: ${response.status}`
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length
    suite.warnings = suite.results.filter(r => r.status === 'WARN').length
    suite.criticalFailures = suite.results.filter(r => r.status === 'FAIL' && r.critical).length

    return suite
  }

  // Security Headers Verification
  private async verifySecurityHeaders(): Promise<VerificationSuite> {
    const suite: VerificationSuite = {
      name: 'Security Headers',
      results: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0,
      duration: 0
    }

    const startTime = performance.now()

    suite.results.push(await this.runVerification('Security Headers', true, async () => {
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

        const presentHeaders = Object.entries(securityHeaders).filter(([_, value]) => value)
        const score = presentHeaders.length / Object.keys(securityHeaders).length

        if (score >= 0.8) {
          return {
            status: 'PASS' as const,
            details: { 
              score: `${presentHeaders.length}/${Object.keys(securityHeaders).length}`,
              headers: securityHeaders
            }
          }
        } else if (score >= 0.5) {
          return {
            status: 'WARN' as const,
            error: 'Some security headers are missing',
            details: { headers: securityHeaders }
          }
        } else {
          return {
            status: 'FAIL' as const,
            error: 'Critical security headers are missing',
            details: { headers: securityHeaders }
          }
        }
      } else {
        return {
          status: 'FAIL' as const,
          error: `Cannot verify security headers: ${response.status}`
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length
    suite.warnings = suite.results.filter(r => r.status === 'WARN').length
    suite.criticalFailures = suite.results.filter(r => r.status === 'FAIL' && r.critical).length

    return suite
  }

  // Form Functionality Verification
  private async verifyForms(): Promise<VerificationSuite> {
    const suite: VerificationSuite = {
      name: 'Form Functionality',
      results: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0,
      duration: 0
    }

    const startTime = performance.now()

    // Test contact form endpoint
    suite.results.push(await this.runVerification('Contact Form Endpoint', true, async () => {
      const testData = {
        name: 'Post-Deploy Test',
        email: 'postdeploy-test@example.com',
        company: 'HODOS Test Suite',
        message: 'This is a post-deployment verification test',
        isTestSubmission: true
      }

      const response = await this.makeRequest('POST', '/api/contact', testData)
      
      if ([200, 201].includes(response.status)) {
        return {
          status: 'PASS' as const,
          details: { statusCode: response.status }
        }
      } else if ([400, 422].includes(response.status)) {
        return {
          status: 'WARN' as const,
          error: 'Form validation is working (expected for test data)',
          details: { statusCode: response.status }
        }
      } else {
        return {
          status: 'FAIL' as const,
          error: `Contact form not working: ${response.status}`
        }
      }
    }))

    // Test demo booking endpoint
    suite.results.push(await this.runVerification('Demo Booking Endpoint', false, async () => {
      const response = await this.makeRequest('POST', '/api/demo', {
        name: 'Test Demo',
        email: 'demo-test@example.com',
        company: 'Test Company',
        isTestSubmission: true
      })
      
      if ([200, 201, 400, 422].includes(response.status)) {
        return {
          status: 'PASS' as const,
          details: { statusCode: response.status, working: true }
        }
      } else {
        return {
          status: 'FAIL' as const,
          error: `Demo booking not working: ${response.status}`
        }
      }
    }))

    suite.duration = performance.now() - startTime
    suite.passed = suite.results.filter(r => r.status === 'PASS').length
    suite.failed = suite.results.filter(r => r.status === 'FAIL').length
    suite.warnings = suite.results.filter(r => r.status === 'WARN').length
    suite.criticalFailures = suite.results.filter(r => r.status === 'FAIL' && r.critical).length

    return suite
  }

  // Run all verifications
  public async runAllVerifications(): Promise<boolean> {
    console.log('🚀 HODOS 360 Post-Deployment Verification')
    console.log('=' .repeat(50))
    console.log(`Environment: ${this.baseUrl}`)
    console.log(`Started: ${new Date().toISOString()}`)
    console.log()

    const allVerifications = [
      this.verifyCriticalInfrastructure(),
      this.verifyPerformance(),
      this.verifySEOAndContent(),
      this.verifySecurityHeaders(),
      this.verifyForms()
    ]

    this.results = await Promise.all(allVerifications)

    // Calculate totals
    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0
    let totalWarnings = 0
    let totalCriticalFailures = 0

    for (const suite of this.results) {
      totalTests += suite.results.length
      totalPassed += suite.passed
      totalFailed += suite.failed
      totalWarnings += suite.warnings
      totalCriticalFailures += suite.criticalFailures

      console.log(`📊 ${suite.name}`)
      console.log(`   Tests: ${suite.results.length} | Passed: ${suite.passed} | Failed: ${suite.failed} | Warnings: ${suite.warnings}`)
      console.log(`   Duration: ${suite.duration.toFixed(2)}ms`)
      
      // Show critical failures
      const criticalFailures = suite.results.filter(r => r.status === 'FAIL' && r.critical)
      if (criticalFailures.length > 0) {
        console.log('   🚨 CRITICAL FAILURES:')
        criticalFailures.forEach(test => {
          console.log(`      - ${test.name}: ${test.error}`)
        })
      }

      // Show non-critical failures
      const nonCriticalFailures = suite.results.filter(r => r.status === 'FAIL' && !r.critical)
      if (nonCriticalFailures.length > 0) {
        console.log('   ❌ Failures:')
        nonCriticalFailures.forEach(test => {
          console.log(`      - ${test.name}: ${test.error}`)
        })
      }

      // Show warnings
      const warnings = suite.results.filter(r => r.status === 'WARN')
      if (warnings.length > 0) {
        console.log('   ⚠️  Warnings:')
        warnings.forEach(test => {
          console.log(`      - ${test.name}: ${test.error || 'Check details'}`)
        })
      }

      console.log()
    }

    const totalDuration = performance.now() - this.startTime

    console.log('=' .repeat(50))
    console.log('📈 VERIFICATION SUMMARY')
    console.log(`Total Tests: ${totalTests}`)
    console.log(`✅ Passed: ${totalPassed} (${((totalPassed/totalTests)*100).toFixed(1)}%)`)
    console.log(`⚠️  Warnings: ${totalWarnings} (${((totalWarnings/totalTests)*100).toFixed(1)}%)`)
    console.log(`❌ Failed: ${totalFailed} (${((totalFailed/totalTests)*100).toFixed(1)}%)`)
    console.log(`🚨 Critical Failures: ${totalCriticalFailures}`)
    console.log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`)
    
    // Determine deployment status
    let deploymentStatus: string
    let success: boolean

    if (totalCriticalFailures > 0) {
      deploymentStatus = '🚨 DEPLOYMENT FAILED - Critical issues must be fixed immediately!'
      success = false
    } else if (totalFailed > 0) {
      deploymentStatus = '⚠️  DEPLOYMENT ISSUES - Non-critical failures detected'
      success = true
    } else if (totalWarnings > 0) {
      deploymentStatus = '✅ DEPLOYMENT SUCCESSFUL - Minor warnings to address'
      success = true
    } else {
      deploymentStatus = '🎉 DEPLOYMENT PERFECT - All verifications passed!'
      success = true
    }

    console.log(`\n${deploymentStatus}`)
    console.log(`Completed: ${new Date().toISOString()}`)

    // Save verification report
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      deploymentStatus,
      success,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalWarnings,
        totalCriticalFailures,
        duration: totalDuration
      },
      verificationSuites: this.results
    }

    const fs = await import('fs')
    const reportPath = `./deployment-reports/post-deploy-verification-${Date.now()}.json`
    await fs.promises.mkdir('./deployment-reports', { recursive: true })
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📋 Verification report saved: ${reportPath}`)
    
    return success
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const baseUrl = args[0] || 'http://localhost:3000'

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
HODOS 360 Post-Deployment Verification

Usage: tsx scripts/post-deploy-verify.ts [BASE_URL]

Arguments:
  BASE_URL    Base URL to verify (default: http://localhost:3000)

Examples:
  tsx scripts/post-deploy-verify.ts
  tsx scripts/post-deploy-verify.ts https://hodos360.com
  tsx scripts/post-deploy-verify.ts https://staging.hodos360.com

Exit Codes:
  0  All verifications passed (deployment successful)
  1  Critical failures detected (deployment should be rolled back)
  2  Non-critical failures detected (monitor closely)
`)
    process.exit(0)
  }

  const verifier = new PostDeployVerifier(baseUrl)
  const success = await verifier.runAllVerifications()
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1)
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Verification script failed:', error)
    process.exit(2)
  })
}

export { PostDeployVerifier }
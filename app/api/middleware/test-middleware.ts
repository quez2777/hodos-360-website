import { NextRequest } from 'next/server'
import { 
  MiddlewareOrchestrator, 
  createDefaultMiddleware,
  MiddlewareOrder 
} from './index'
import { rateLimitMiddleware } from './rate-limit'
import { apiKeyAuthMiddleware, ApiKeyManager } from './api-auth'
import { rbacMiddleware, RBACManager } from './rbac'
import { securityHeadersMiddleware, applySecurityHeaders } from './security'
import { auditMiddleware, AuditLogger } from './audit'
import { 
  MiddlewareContext,
  AuthenticatedUser,
  ApiKeyData 
} from './types'

// Test utilities
class MiddlewareTestUtils {
  static createMockRequest(
    method: string = 'GET',
    path: string = '/api/test',
    headers: Record<string, string> = {}
  ): NextRequest {
    const url = `http://localhost:3000${path}`
    return new NextRequest(url, {
      method,
      headers: new Headers(headers)
    })
  }

  static createMockContext(overrides: Partial<MiddlewareContext> = {}): MiddlewareContext {
    return {
      requestId: 'test-request-123',
      timestamp: Date.now(),
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      ...overrides
    }
  }

  static createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
    return {
      id: 'user_123',
      email: 'test@example.com',
      firmId: 'firm_123',
      roles: [
        {
          id: 'attorney',
          name: 'Attorney',
          description: 'Test attorney role',
          permissions: [
            { id: 'p1', resource: 'cases', action: 'read' },
            { id: 'p2', resource: 'cases', action: 'write' }
          ]
        }
      ],
      permissions: [],
      plan: 'professional',
      isActive: true,
      ...overrides
    }
  }

  static createMockApiKey(overrides: Partial<ApiKeyData> = {}): ApiKeyData {
    return {
      id: 'api_key_123',
      name: 'Test API Key',
      firmId: 'firm_123',
      permissions: [
        { id: 'p1', resource: 'cases', action: 'read' },
        { id: 'p2', resource: 'documents', action: 'write' }
      ],
      rateLimit: {
        windowMs: 60 * 1000,
        max: 100
      },
      createdAt: new Date(),
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  }
}

// Test cases
export class MiddlewareTestSuite {
  // Test rate limiting middleware
  static async testRateLimit(): Promise<boolean> {
    console.log('Testing Rate Limit Middleware...')
    
    try {
      const req = MiddlewareTestUtils.createMockRequest()
      const context = MiddlewareTestUtils.createMockContext()
      
      // Test successful request
      const result = await rateLimitMiddleware(req, context)
      
      if (!result.success) {
        console.error('Rate limit test failed:', result.error)
        return false
      }
      
      console.log('✅ Rate limit middleware test passed')
      return true
    } catch (error) {
      console.error('❌ Rate limit test error:', error)
      return false
    }
  }

  // Test API key authentication
  static async testApiKeyAuth(): Promise<boolean> {
    console.log('Testing API Key Authentication...')
    
    try {
      // Test without API key
      const req1 = MiddlewareTestUtils.createMockRequest()
      const context1 = MiddlewareTestUtils.createMockContext()
      
      const result1 = await apiKeyAuthMiddleware(req1, context1)
      
      if (!result1.success) {
        console.error('API key test (no key) failed:', result1.error)
        return false
      }
      
      // Test with invalid API key format
      const req2 = MiddlewareTestUtils.createMockRequest('GET', '/api/test', {
        'x-api-key': 'invalid-key-format'
      })
      const context2 = MiddlewareTestUtils.createMockContext()
      
      const result2 = await apiKeyAuthMiddleware(req2, context2)
      
      if (result2.success) {
        console.error('API key test should have failed with invalid format')
        return false
      }
      
      console.log('✅ API key authentication tests passed')
      return true
    } catch (error) {
      console.error('❌ API key authentication test error:', error)
      return false
    }
  }

  // Test RBAC middleware
  static async testRBAC(): Promise<boolean> {
    console.log('Testing RBAC Middleware...')
    
    try {
      const req = MiddlewareTestUtils.createMockRequest('GET', '/api/cases')
      const user = MiddlewareTestUtils.createMockUser()
      const context = MiddlewareTestUtils.createMockContext({ user })
      
      // Test with authorized user
      const result1 = await rbacMiddleware(req, context)
      
      if (!result1.success) {
        console.error('RBAC test (authorized) failed:', result1.error)
        return false
      }
      
      // Test permission check
      const hasPermission = RBACManager.hasPermission(user, 'cases', 'read')
      
      if (!hasPermission) {
        console.error('RBAC permission check failed')
        return false
      }
      
      console.log('✅ RBAC middleware tests passed')
      return true
    } catch (error) {
      console.error('❌ RBAC test error:', error)
      return false
    }
  }

  // Test security headers
  static async testSecurityHeaders(): Promise<boolean> {
    console.log('Testing Security Headers Middleware...')
    
    try {
      const req = MiddlewareTestUtils.createMockRequest()
      const context = MiddlewareTestUtils.createMockContext()
      
      const result = await securityHeadersMiddleware(req, context)
      
      if (!result.success) {
        console.error('Security headers test failed:', result.error)
        return false
      }
      
      // Test applying headers to response
      const mockResponse = new Response('OK', { status: 200 })
      const nextResponse = new (await import('next/server')).NextResponse(
        mockResponse.body,
        {
          status: mockResponse.status,
          headers: mockResponse.headers
        }
      )
      
      const responseWithHeaders = applySecurityHeaders(req, nextResponse)
      
      // Check that security headers were added
      const hasCSP = responseWithHeaders.headers.has('Content-Security-Policy')
      const hasCORS = responseWithHeaders.headers.has('Access-Control-Allow-Origin') ||
                     req.headers.get('origin') === null // CORS only set if origin present
      
      if (!hasCSP) {
        console.error('CSP header not found')
        return false
      }
      
      console.log('✅ Security headers middleware tests passed')
      return true
    } catch (error) {
      console.error('❌ Security headers test error:', error)
      return false
    }
  }

  // Test audit logging
  static async testAuditLogging(): Promise<boolean> {
    console.log('Testing Audit Logging Middleware...')
    
    try {
      const req = MiddlewareTestUtils.createMockRequest('POST', '/api/cases')
      const user = MiddlewareTestUtils.createMockUser()
      const context = MiddlewareTestUtils.createMockContext({ user })
      
      const mockResponse = new (await import('next/server')).NextResponse('OK')
      const startTime = Date.now()
      
      const result = await auditMiddleware(req, context, mockResponse, startTime)
      
      if (!result.success) {
        console.error('Audit logging test failed:', result.error)
        return false
      }
      
      console.log('✅ Audit logging middleware tests passed')
      return true
    } catch (error) {
      console.error('❌ Audit logging test error:', error)
      return false
    }
  }

  // Test full middleware orchestration
  static async testMiddlewareOrchestration(): Promise<boolean> {
    console.log('Testing Middleware Orchestration...')
    
    try {
      const middleware = createDefaultMiddleware()
      
      // Test successful request
      const req1 = MiddlewareTestUtils.createMockRequest('GET', '/api/health')
      const response1 = await middleware.execute(req1)
      
      if (!response1) {
        console.error('Middleware orchestration failed - no response')
        return false
      }
      
      // Test excluded path (should pass through)
      const req2 = MiddlewareTestUtils.createMockRequest('GET', '/_next/static/test.js')
      const response2 = await middleware.execute(req2)
      
      if (!response2) {
        console.error('Middleware orchestration failed for excluded path')
        return false
      }
      
      console.log('✅ Middleware orchestration tests passed')
      return true
    } catch (error) {
      console.error('❌ Middleware orchestration test error:', error)
      return false
    }
  }

  // Test API key generation and validation
  static async testApiKeyGeneration(): Promise<boolean> {
    console.log('Testing API Key Generation...')
    
    try {
      const manager = new ApiKeyManager()
      
      // Generate API key
      const { keyId, secretKey } = manager.generateApiKey('firm_123', 'Test Key')
      
      if (!keyId.startsWith('hodos_') || !secretKey || secretKey.length !== 64) {
        console.error('API key generation failed - invalid format')
        return false
      }
      
      console.log('✅ API key generation tests passed')
      return true
    } catch (error) {
      console.error('❌ API key generation test error:', error)
      return false
    }
  }

  // Performance test
  static async testPerformance(): Promise<boolean> {
    console.log('Testing Middleware Performance...')
    
    try {
      const middleware = new MiddlewareOrchestrator([
        MiddlewareOrder.SECURITY_HEADERS,
        MiddlewareOrder.RATE_LIMIT,
        MiddlewareOrder.AUDIT_END
      ])
      
      const startTime = Date.now()
      const iterations = 100
      
      for (let i = 0; i < iterations; i++) {
        const req = MiddlewareTestUtils.createMockRequest('GET', `/api/test/${i}`)
        await middleware.execute(req)
      }
      
      const endTime = Date.now()
      const avgTime = (endTime - startTime) / iterations
      
      console.log(`Average middleware execution time: ${avgTime.toFixed(2)}ms`)
      
      if (avgTime > 100) { // Threshold: 100ms per request
        console.warn('⚠️  Middleware performance may be slow')
        return false
      }
      
      console.log('✅ Performance tests passed')
      return true
    } catch (error) {
      console.error('❌ Performance test error:', error)
      return false
    }
  }

  // Run all tests
  static async runAllTests(): Promise<void> {
    console.log('🧪 Starting Middleware Test Suite...\n')
    
    const tests = [
      { name: 'Rate Limiting', fn: this.testRateLimit },
      { name: 'API Key Authentication', fn: this.testApiKeyAuth },
      { name: 'RBAC', fn: this.testRBAC },
      { name: 'Security Headers', fn: this.testSecurityHeaders },
      { name: 'Audit Logging', fn: this.testAuditLogging },
      { name: 'API Key Generation', fn: this.testApiKeyGeneration },
      { name: 'Middleware Orchestration', fn: this.testMiddlewareOrchestration },
      { name: 'Performance', fn: this.testPerformance }
    ]
    
    const results: { name: string; passed: boolean }[] = []
    
    for (const test of tests) {
      try {
        const passed = await test.fn()
        results.push({ name: test.name, passed })
      } catch (error) {
        console.error(`Test ${test.name} threw an error:`, error)
        results.push({ name: test.name, passed: false })
      }
      console.log('') // Empty line for readability
    }
    
    // Summary
    console.log('📊 Test Results Summary:')
    console.log('========================')
    
    const passed = results.filter(r => r.passed).length
    const total = results.length
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.name}`)
    })
    
    console.log(`\nOverall: ${passed}/${total} tests passed`)
    
    if (passed === total) {
      console.log('🎉 All middleware tests passed successfully!')
    } else {
      console.log('⚠️  Some tests failed. Please review the middleware implementation.')
    }
  }
}

// Export for use in testing
export { MiddlewareTestUtils }

// Run tests if this file is executed directly
if (require.main === module) {
  MiddlewareTestSuite.runAllTests().catch(console.error)
}
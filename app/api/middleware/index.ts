import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  MiddlewareContext,
  MiddlewareResponse,
  MiddlewareError,
  AuthenticatedUser,
  ApiKeyData
} from './types'
import { rateLimitMiddleware, addRateLimitHeaders } from './rate-limit'
import { apiKeyAuthMiddleware, validateApiKeyPermissions } from './api-auth'
import { rbacMiddleware } from './rbac'
import { securityHeadersMiddleware, applySecurityHeaders, handlePreflight } from './security'
import { auditMiddleware } from './audit'

// Middleware execution order
export enum MiddlewareOrder {
  SECURITY_HEADERS = 1,
  PREFLIGHT = 2,
  AUDIT_START = 3,
  RATE_LIMIT = 4,
  API_KEY_AUTH = 5,
  USER_AUTH = 6, // This would integrate with NextAuth or your auth system
  RBAC = 7,
  AUDIT_END = 8
}

// Main middleware orchestrator
export class MiddlewareOrchestrator {
  private enabledMiddleware: Set<MiddlewareOrder>
  private excludePaths: Set<string>
  private includePaths: Set<string>

  constructor(
    enabledMiddleware: MiddlewareOrder[] = Object.values(MiddlewareOrder).filter(v => typeof v === 'number') as MiddlewareOrder[],
    excludePaths: string[] = [],
    includePaths: string[] = ['/api/']
  ) {
    this.enabledMiddleware = new Set(enabledMiddleware)
    this.excludePaths = new Set(excludePaths)
    this.includePaths = new Set(includePaths)
  }

  // Check if path should be processed by middleware
  private shouldProcessPath(pathname: string): boolean {
    // Check include paths first
    const shouldInclude = this.includePaths.size === 0 || 
      Array.from(this.includePaths).some(path => pathname.startsWith(path))
    
    if (!shouldInclude) return false

    // Check exclude paths
    const shouldExclude = Array.from(this.excludePaths).some(path => 
      pathname.startsWith(path)
    )
    
    return !shouldExclude
  }

  // Create middleware context
  private createContext(req: NextRequest): MiddlewareContext {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown'

    return {
      requestId: uuidv4(),
      timestamp: Date.now(),
      ip,
      userAgent: req.headers.get('user-agent') || 'unknown'
    }
  }

  // Get authenticated user (mock implementation - replace with your auth system)
  private async getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | undefined> {
    // This is a mock implementation. In a real app, you'd integrate with NextAuth
    // or your authentication system to get the current user
    
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return undefined
    }

    // Mock user data - replace with actual user lookup
    return {
      id: 'user_123',
      email: 'attorney@lawfirm.com',
      firmId: 'firm_123',
      roles: [
        {
          id: 'attorney',
          name: 'Attorney',
          description: 'Licensed attorney',
          permissions: [
            { id: 'p1', resource: 'cases', action: 'write' },
            { id: 'p2', resource: 'clients', action: 'write' }
          ]
        }
      ],
      permissions: [],
      plan: 'professional',
      isActive: true
    }
  }

  // Main middleware execution method
  async execute(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const pathname = req.nextUrl.pathname

    // Check if this path should be processed
    if (!this.shouldProcessPath(pathname)) {
      return NextResponse.next()
    }

    // Handle preflight requests early
    if (this.enabledMiddleware.has(MiddlewareOrder.PREFLIGHT)) {
      const preflightResponse = handlePreflight(req)
      if (preflightResponse) {
        return preflightResponse
      }
    }

    // Create middleware context
    const context = this.createContext(req)
    let response = NextResponse.next()
    let error: string | undefined

    try {
      // Execute middleware in order
      const middlewareResults: Record<MiddlewareOrder, MiddlewareResponse> = {} as any

      // 1. Security Headers (setup)
      if (this.enabledMiddleware.has(MiddlewareOrder.SECURITY_HEADERS)) {
        middlewareResults[MiddlewareOrder.SECURITY_HEADERS] = await securityHeadersMiddleware(req, context)
      }

      // 2. Rate Limiting
      if (this.enabledMiddleware.has(MiddlewareOrder.RATE_LIMIT)) {
        middlewareResults[MiddlewareOrder.RATE_LIMIT] = await rateLimitMiddleware(req, context)
        
        if (!middlewareResults[MiddlewareOrder.RATE_LIMIT].success) {
          const rateLimitResponse = new NextResponse(
            JSON.stringify({
              error: middlewareResults[MiddlewareOrder.RATE_LIMIT].error,
              retryAfter: middlewareResults[MiddlewareOrder.RATE_LIMIT].data?.retryAfter
            }),
            { 
              status: middlewareResults[MiddlewareOrder.RATE_LIMIT].statusCode || 429,
              headers: { 'Content-Type': 'application/json' }
            }
          )
          
          return applySecurityHeaders(req, rateLimitResponse)
        }

        // Add rate limit headers to response
        if (middlewareResults[MiddlewareOrder.RATE_LIMIT].data?.rateLimitInfo) {
          response = addRateLimitHeaders(response, middlewareResults[MiddlewareOrder.RATE_LIMIT].data.rateLimitInfo)
        }
      }

      // 3. API Key Authentication
      if (this.enabledMiddleware.has(MiddlewareOrder.API_KEY_AUTH)) {
        middlewareResults[MiddlewareOrder.API_KEY_AUTH] = await apiKeyAuthMiddleware(req, context)
        
        if (!middlewareResults[MiddlewareOrder.API_KEY_AUTH].success) {
          const authResponse = new NextResponse(
            JSON.stringify({ error: middlewareResults[MiddlewareOrder.API_KEY_AUTH].error }),
            { 
              status: middlewareResults[MiddlewareOrder.API_KEY_AUTH].statusCode || 401,
              headers: { 'Content-Type': 'application/json' }
            }
          )
          
          return applySecurityHeaders(req, authResponse)
        }
      }

      // 4. User Authentication (integrate with your auth system)
      if (this.enabledMiddleware.has(MiddlewareOrder.USER_AUTH)) {
        context.user = await this.getAuthenticatedUser(req)
      }

      // 5. API Key Permissions (if API key was provided)
      if (context.apiKey) {
        const permissionResult = validateApiKeyPermissions(req, context)
        if (!permissionResult.success) {
          const permResponse = new NextResponse(
            JSON.stringify({ error: permissionResult.error }),
            { 
              status: permissionResult.statusCode || 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
          
          return applySecurityHeaders(req, permResponse)
        }
      }

      // 6. RBAC (Role-Based Access Control)
      if (this.enabledMiddleware.has(MiddlewareOrder.RBAC)) {
        middlewareResults[MiddlewareOrder.RBAC] = await rbacMiddleware(req, context)
        
        if (!middlewareResults[MiddlewareOrder.RBAC].success) {
          const rbacResponse = new NextResponse(
            JSON.stringify({ error: middlewareResults[MiddlewareOrder.RBAC].error }),
            { 
              status: middlewareResults[MiddlewareOrder.RBAC].statusCode || 403,
              headers: { 'Content-Type': 'application/json' }
            }
          )
          
          return applySecurityHeaders(req, rbacResponse)
        }
      }

    } catch (middlewareError) {
      error = middlewareError instanceof Error ? middlewareError.message : 'Middleware execution failed'
      console.error('Middleware execution error:', middlewareError)
      
      response = new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Apply security headers to final response
    response = applySecurityHeaders(req, response)

    // Audit logging (should be last, doesn't block response)
    if (this.enabledMiddleware.has(MiddlewareOrder.AUDIT_END)) {
      // Fire and forget audit logging
      auditMiddleware(req, context, response, startTime, error).catch(auditError => {
        console.error('Audit logging failed:', auditError)
      })
    }

    return response
  }
}

// Default middleware configuration
export const createDefaultMiddleware = () => {
  return new MiddlewareOrchestrator(
    [
      MiddlewareOrder.SECURITY_HEADERS,
      MiddlewareOrder.PREFLIGHT,
      MiddlewareOrder.RATE_LIMIT,
      MiddlewareOrder.API_KEY_AUTH,
      MiddlewareOrder.USER_AUTH,
      MiddlewareOrder.RBAC,
      MiddlewareOrder.AUDIT_END
    ],
    [
      '/api/health',
      '/api/ping',
      '/_next/',
      '/static/'
    ],
    ['/api/']
  )
}

// Environment-specific configurations
export const MIDDLEWARE_CONFIGS = {
  development: () => new MiddlewareOrchestrator(
    [
      MiddlewareOrder.SECURITY_HEADERS,
      MiddlewareOrder.PREFLIGHT,
      MiddlewareOrder.AUDIT_END
    ],
    ['/api/health', '/api/test', '/_next/', '/static/'],
    ['/api/']
  ),

  production: () => new MiddlewareOrchestrator(
    [
      MiddlewareOrder.SECURITY_HEADERS,
      MiddlewareOrder.PREFLIGHT,
      MiddlewareOrder.RATE_LIMIT,
      MiddlewareOrder.API_KEY_AUTH,
      MiddlewareOrder.USER_AUTH,
      MiddlewareOrder.RBAC,
      MiddlewareOrder.AUDIT_END
    ],
    ['/api/health', '/_next/', '/static/'],
    ['/api/']
  ),

  testing: () => new MiddlewareOrchestrator(
    [MiddlewareOrder.SECURITY_HEADERS],
    [],
    ['/api/']
  )
}

// Utility function to get middleware for current environment
export const getMiddleware = () => {
  const env = process.env.NODE_ENV as keyof typeof MIDDLEWARE_CONFIGS
  const configFn = MIDDLEWARE_CONFIGS[env] || createDefaultMiddleware
  return configFn()
}

// Export individual middleware for direct use
export {
  rateLimitMiddleware,
  apiKeyAuthMiddleware,
  rbacMiddleware,
  securityHeadersMiddleware,
  auditMiddleware
}

// Export utilities
export { addRateLimitHeaders, applySecurityHeaders, handlePreflight }

// Export types
export * from './types'

// Main middleware function for Next.js
export async function middleware(req: NextRequest): Promise<NextResponse> {
  const middlewareOrchestrator = getMiddleware()
  return middlewareOrchestrator.execute(req)
}
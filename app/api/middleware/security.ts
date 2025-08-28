import { NextRequest, NextResponse } from 'next/server'
import { 
  SecurityHeadersConfig,
  CorsConfig,
  ContentSecurityPolicyConfig,
  HstsConfig,
  MiddlewareContext,
  MiddlewareResponse 
} from './types'

// Default security configuration
const DEFAULT_SECURITY_CONFIG: SecurityHeadersConfig = {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGINS || 'https://hodos360.com').split(',')
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-Requested-With',
      'X-Request-ID',
      'X-Firm-ID',
      'Accept',
      'Origin',
      'User-Agent'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
  },
  
  csp: {
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // For development - remove in production
        "'unsafe-eval'", // For development - remove in production
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
        'https://www.googletagmanager.com',
        'https://www.google-analytics.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https:',
        'https://www.google-analytics.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ],
      'connect-src': [
        "'self'",
        'https://api.openai.com',
        'https://api.anthropic.com',
        'https://www.google-analytics.com',
        process.env.SUPABASE_URL || '',
        process.env.NODE_ENV === 'development' ? 'ws://localhost:3000' : ''
      ].filter(Boolean),
      'frame-src': [
        "'self'",
        'https://www.youtube.com',
        'https://player.vimeo.com'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"], // Prevent clickjacking
      ...(process.env.NODE_ENV === 'production' ? { 'upgrade-insecure-requests': ["'upgrade-insecure-requests'"] } : {})
    },
    reportOnly: process.env.NODE_ENV === 'development',
    reportUri: process.env.CSP_REPORT_URI
  },
  
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  xss: true,
  nosniff: true,
  frameOptions: 'DENY'
}

// Environment-specific configurations
const ENVIRONMENT_CONFIGS = {
  development: {
    ...DEFAULT_SECURITY_CONFIG,
    csp: {
      ...DEFAULT_SECURITY_CONFIG.csp,
      directives: {
        ...DEFAULT_SECURITY_CONFIG.csp.directives,
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'", // Needed for development
          'https://cdn.jsdelivr.net'
        ],
        'connect-src': [
          "'self'",
          'ws://localhost:*', // WebSocket for hot reload
          'http://localhost:*',
          'https://api.openai.com',
          'https://api.anthropic.com'
        ]
      },
      reportOnly: true
    }
  },
  
  production: {
    ...DEFAULT_SECURITY_CONFIG,
    csp: {
      ...DEFAULT_SECURITY_CONFIG.csp,
      directives: {
        ...DEFAULT_SECURITY_CONFIG.csp.directives,
        'script-src': [
          "'self'",
          'https://cdn.jsdelivr.net',
          'https://www.googletagmanager.com'
        ] // Remove unsafe-inline and unsafe-eval
      },
      reportOnly: false
    }
  }
}

// CORS handler
class CorsHandler {
  private config: CorsConfig

  constructor(config: CorsConfig) {
    this.config = config
  }

  // Check if origin is allowed
  private isOriginAllowed(origin: string | null): boolean {
    if (!origin) return false
    
    if (this.config.origin === true) return true
    if (this.config.origin === false) return false
    
    if (typeof this.config.origin === 'string') {
      return this.config.origin === origin
    }
    
    if (Array.isArray(this.config.origin)) {
      return this.config.origin.some(allowedOrigin => {
        if (allowedOrigin === '*') return true
        if (allowedOrigin === origin) return true
        
        // Support wildcards like *.hodos360.com
        if (allowedOrigin.includes('*')) {
          const pattern = allowedOrigin.replace(/\*/g, '.*')
          const regex = new RegExp(`^${pattern}$`)
          return regex.test(origin)
        }
        
        return false
      })
    }
    
    return false
  }

  // Handle CORS headers
  handleCors(req: NextRequest, response: NextResponse): NextResponse {
    const origin = req.headers.get('origin')
    
    // Set CORS headers
    if (this.isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin!)
    }
    
    if (this.config.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      response.headers.set(
        'Access-Control-Allow-Methods',
        this.config.methods.join(', ')
      )
      
      response.headers.set(
        'Access-Control-Allow-Headers',
        this.config.allowedHeaders.join(', ')
      )
      
      if (this.config.maxAge) {
        response.headers.set('Access-Control-Max-Age', this.config.maxAge.toString())
      }
    }
    
    return response
  }
}

// CSP builder
class CSPBuilder {
  private config: ContentSecurityPolicyConfig

  constructor(config: ContentSecurityPolicyConfig) {
    this.config = config
  }

  // Build CSP header value
  buildCSP(): string {
    const directives: string[] = []
    
    for (const [directive, sources] of Object.entries(this.config.directives)) {
      if (sources === undefined) continue
      
      if (Array.isArray(sources) && sources.length > 0) {
        directives.push(`${directive} ${sources.join(' ')}`)
      } else if (typeof sources === 'string') {
        directives.push(`${directive} ${sources}`)
      }
    }
    
    return directives.join('; ')
  }

  // Add CSP headers to response
  addCSPHeaders(response: NextResponse): NextResponse {
    const cspValue = this.buildCSP()
    
    if (this.config.reportOnly) {
      response.headers.set('Content-Security-Policy-Report-Only', cspValue)
    } else {
      response.headers.set('Content-Security-Policy', cspValue)
    }
    
    // Add report URI if specified
    if (this.config.reportUri) {
      const reportDirective = `report-uri ${this.config.reportUri}`
      const currentCSP = response.headers.get(
        this.config.reportOnly 
          ? 'Content-Security-Policy-Report-Only'
          : 'Content-Security-Policy'
      )
      
      if (currentCSP) {
        response.headers.set(
          this.config.reportOnly 
            ? 'Content-Security-Policy-Report-Only'
            : 'Content-Security-Policy',
          `${currentCSP}; ${reportDirective}`
        )
      }
    }
    
    return response
  }
}

// Main security headers middleware
export async function securityHeadersMiddleware(
  req: NextRequest,
  context: MiddlewareContext
): Promise<MiddlewareResponse> {
  try {
    const env = process.env.NODE_ENV as 'development' | 'production'
    const config = ENVIRONMENT_CONFIGS[env] || DEFAULT_SECURITY_CONFIG
    
    return {
      success: true,
      data: { securityConfig: config }
    }
    
  } catch (error) {
    console.error('Security headers middleware error:', error)
    return {
      success: false,
      error: 'Failed to apply security headers',
      statusCode: 500
    }
  }
}

// Apply all security headers to response
export function applySecurityHeaders(
  req: NextRequest,
  response: NextResponse,
  config?: SecurityHeadersConfig
): NextResponse {
  const env = process.env.NODE_ENV as 'development' | 'production'
  const securityConfig = config || ENVIRONMENT_CONFIGS[env] || DEFAULT_SECURITY_CONFIG
  
  // Apply CORS headers
  const corsHandler = new CorsHandler(securityConfig.cors)
  response = corsHandler.handleCors(req, response)
  
  // Apply Content Security Policy
  const cspBuilder = new CSPBuilder(securityConfig.csp)
  response = cspBuilder.addCSPHeaders(response)
  
  // Apply HSTS (only in production and over HTTPS)
  if (env === 'production' || req.nextUrl.protocol === 'https:') {
    let hstsValue = `max-age=${securityConfig.hsts.maxAge}`
    
    if (securityConfig.hsts.includeSubDomains) {
      hstsValue += '; includeSubDomains'
    }
    
    if (securityConfig.hsts.preload) {
      hstsValue += '; preload'
    }
    
    response.headers.set('Strict-Transport-Security', hstsValue)
  }
  
  // Apply X-XSS-Protection
  if (securityConfig.xss) {
    response.headers.set('X-XSS-Protection', '1; mode=block')
  }
  
  // Apply X-Content-Type-Options
  if (securityConfig.nosniff) {
    response.headers.set('X-Content-Type-Options', 'nosniff')
  }
  
  // Apply X-Frame-Options
  response.headers.set('X-Frame-Options', securityConfig.frameOptions)
  
  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'off')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )
  
  // Add security-focused cache headers for sensitive endpoints
  if (req.nextUrl.pathname.includes('/api/auth') || 
      req.nextUrl.pathname.includes('/api/admin')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }
  
  return response
}

// Handle preflight OPTIONS requests
export function handlePreflight(req: NextRequest): NextResponse | null {
  if (req.method !== 'OPTIONS') return null
  
  const response = new NextResponse(null, { status: 204 })
  
  // Apply CORS to preflight response
  const env = process.env.NODE_ENV as 'development' | 'production'
  const config = ENVIRONMENT_CONFIGS[env] || DEFAULT_SECURITY_CONFIG
  
  return applySecurityHeaders(req, response, config)
}

// CSP violation reporting endpoint helper
export function createCSPReportHandler() {
  return async (req: NextRequest) => {
    try {
      const report = await req.json()
      
      // Log CSP violations
      console.warn('CSP Violation:', {
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent'),
        ip: req.ip,
        report
      })
      
      // In production, you might want to send this to a logging service
      if (process.env.NODE_ENV === 'production') {
        // Send to logging service like Sentry, LogRocket, etc.
      }
      
      return new NextResponse('OK', { status: 204 })
    } catch (error) {
      console.error('CSP report handler error:', error)
      return new NextResponse('Error', { status: 400 })
    }
  }
}

// Security configuration validator
export function validateSecurityConfig(config: SecurityHeadersConfig): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate CORS configuration
  if (!config.cors.origin) {
    errors.push('CORS origin must be configured')
  }
  
  if (config.cors.origin === true && process.env.NODE_ENV === 'production') {
    warnings.push('CORS origin set to allow all origins in production')
  }
  
  // Validate CSP configuration
  if (!config.csp.directives['default-src']) {
    warnings.push('CSP default-src directive not set')
  }
  
  if (config.csp.directives['script-src']?.includes("'unsafe-inline'") && 
      process.env.NODE_ENV === 'production') {
    warnings.push('CSP allows unsafe-inline scripts in production')
  }
  
  // Validate HSTS configuration
  if (config.hsts.maxAge < 86400) {
    warnings.push('HSTS max-age is less than 24 hours')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

// Export configuration presets
export const SECURITY_PRESETS = {
  STRICT: {
    ...DEFAULT_SECURITY_CONFIG,
    csp: {
      ...DEFAULT_SECURITY_CONFIG.csp,
      directives: {
        ...DEFAULT_SECURITY_CONFIG.csp.directives,
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'connect-src': ["'self'"]
      }
    }
  },
  
  RELAXED: {
    ...DEFAULT_SECURITY_CONFIG,
    csp: {
      ...DEFAULT_SECURITY_CONFIG.csp,
      directives: {
        ...DEFAULT_SECURITY_CONFIG.csp.directives,
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:']
      }
    }
  }
}

export { CorsHandler, CSPBuilder, DEFAULT_SECURITY_CONFIG }

// Alias for backward compatibility
export const securityMiddleware = securityHeadersMiddleware
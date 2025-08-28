import { NextRequest, NextResponse } from 'next/server'
import { 
  RateLimitConfig, 
  RateLimitInfo, 
  RateLimitStore, 
  RateLimitError, 
  MiddlewareContext,
  MiddlewareResponse 
} from './types'

// In-memory store for development/testing
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<number> {
    const entry = this.store.get(key)
    if (!entry) return 0
    
    // Clean expired entries
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return 0
    }
    
    return entry.count
  }

  async increment(key: string, windowMs: number): Promise<number> {
    const now = Date.now()
    const entry = this.store.get(key)
    
    if (!entry || now > entry.resetTime) {
      const newEntry = { count: 1, resetTime: now + windowMs }
      this.store.set(key, newEntry)
      return 1
    }
    
    entry.count++
    this.store.set(key, entry)
    return entry.count
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Redis store for production
class RedisRateLimitStore implements RateLimitStore {
  private redisUrl: string

  constructor(redisUrl: string) {
    this.redisUrl = redisUrl
  }

  async get(key: string): Promise<number> {
    try {
      // In a real implementation, use a Redis client like ioredis
      // For now, this is a placeholder structure
      const response = await fetch(`${this.redisUrl}/get/${key}`)
      if (!response.ok) return 0
      const data = await response.json()
      return data.count || 0
    } catch (error) {
      console.error('Redis GET error:', error)
      return 0
    }
  }

  async increment(key: string, windowMs: number): Promise<number> {
    try {
      const response = await fetch(`${this.redisUrl}/incr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, windowMs })
      })
      
      if (!response.ok) throw new Error('Redis increment failed')
      const data = await response.json()
      return data.count
    } catch (error) {
      console.error('Redis INCREMENT error:', error)
      throw error
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await fetch(`${this.redisUrl}/del/${key}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Redis DELETE error:', error)
    }
  }
}

// Default rate limit configurations for different endpoints
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints
  '/api/auth': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  
  // AI endpoints (more expensive)
  '/api/ai': {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    skipSuccessfulRequests: false
  },
  
  // General API endpoints
  '/api': {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    skipSuccessfulRequests: true
  },
  
  // Public endpoints
  '/api/public': {
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute
    skipSuccessfulRequests: true
  },
  
  // Admin endpoints (stricter)
  '/api/admin': {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    skipSuccessfulRequests: false
  }
}

// Rate limit store singleton
let storeInstance: RateLimitStore | null = null

function getRateLimitStore(): RateLimitStore {
  if (!storeInstance) {
    const redisUrl = process.env.RATE_LIMIT_REDIS_URL
    
    if (redisUrl && process.env.NODE_ENV === 'production') {
      storeInstance = new RedisRateLimitStore(redisUrl)
    } else {
      storeInstance = new MemoryRateLimitStore()
      
      // Cleanup memory store every 5 minutes
      if (storeInstance instanceof MemoryRateLimitStore) {
        setInterval(() => {
          (storeInstance as MemoryRateLimitStore).cleanup()
        }, 5 * 60 * 1000)
      }
    }
  }
  
  return storeInstance
}

// Generate rate limit key
function generateRateLimitKey(
  req: NextRequest, 
  context: MiddlewareContext,
  config: RateLimitConfig
): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req)
  }
  
  // Priority: User ID > API Key > IP Address
  if (context.user?.id) {
    return `user:${context.user.id}:${req.nextUrl.pathname}`
  }
  
  if (context.apiKey?.id) {
    return `apikey:${context.apiKey.id}:${req.nextUrl.pathname}`
  }
  
  return `ip:${context.ip}:${req.nextUrl.pathname}`
}

// Get rate limit config for endpoint
function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Find the most specific matching configuration
  const sortedPaths = Object.keys(DEFAULT_RATE_LIMITS)
    .filter(path => pathname.startsWith(path))
    .sort((a, b) => b.length - a.length)
  
  const matchingPath = sortedPaths[0]
  return matchingPath ? DEFAULT_RATE_LIMITS[matchingPath] : DEFAULT_RATE_LIMITS['/api']
}

// Apply user/plan-specific rate limit adjustments
function adjustRateLimitForUser(
  config: RateLimitConfig, 
  context: MiddlewareContext
): RateLimitConfig {
  if (!context.user) return config
  
  // Adjust limits based on subscription plan
  const multipliers = {
    trial: 0.5,      // 50% of base limit
    starter: 1,      // 100% of base limit
    professional: 2, // 200% of base limit
    enterprise: 5    // 500% of base limit
  }
  
  const multiplier = multipliers[context.user.plan] || 1
  
  return {
    ...config,
    max: Math.floor(config.max * multiplier)
  }
}

// Main rate limiting middleware
export async function rateLimitMiddleware(
  req: NextRequest,
  context: MiddlewareContext
): Promise<MiddlewareResponse> {
  try {
    const store = getRateLimitStore()
    const pathname = req.nextUrl.pathname
    
    // Get and adjust rate limit configuration
    let config = getRateLimitConfig(pathname)
    config = adjustRateLimitForUser(config, context)
    
    // Generate rate limit key
    const key = generateRateLimitKey(req, context, config)
    
    // Get current count and increment
    const count = await store.increment(key, config.windowMs)
    
    // Check if limit exceeded
    if (count > config.max) {
      const resetTime = Math.ceil(Date.now() / config.windowMs) * config.windowMs
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
      
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      )
    }
    
    // Calculate rate limit info
    const resetTime = Math.ceil(Date.now() / config.windowMs) * config.windowMs
    const rateLimitInfo: RateLimitInfo = {
      limit: config.max,
      remaining: Math.max(0, config.max - count),
      reset: Math.floor(resetTime / 1000)
    }
    
    return {
      success: true,
      data: { rateLimitInfo }
    }
    
  } catch (error) {
    if (error instanceof RateLimitError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode,
        data: { retryAfter: error.retryAfter }
      }
    }
    
    // Log error but don't block request on rate limit system failure
    console.error('Rate limit middleware error:', error)
    return {
      success: true,
      data: { rateLimitInfo: null }
    }
  }
}

// Helper function to add rate limit headers to response
export function addRateLimitHeaders(
  response: NextResponse, 
  rateLimitInfo: RateLimitInfo | null
): NextResponse {
  if (!rateLimitInfo) return response
  
  response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString())
  response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString())
  response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toString())
  
  if (rateLimitInfo.retryAfter) {
    response.headers.set('Retry-After', rateLimitInfo.retryAfter.toString())
  }
  
  return response
}

// Custom rate limit decorator for specific endpoints
export function withRateLimit(config: Partial<RateLimitConfig>) {
  return function<T extends Function>(target: T): T {
    const originalFunction = target as any
    
    return function(this: any, ...args: any[]) {
      // This would be used in API route handlers
      // Implementation would depend on how routes are structured
      return originalFunction.apply(this, args)
    } as any
  }
}

// Rate limit bypass for internal requests
export function bypassRateLimit(req: NextRequest): boolean {
  // Internal service-to-service requests
  const internalToken = req.headers.get('x-internal-token')
  if (internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
    return true
  }
  
  // Localhost in development
  if (process.env.NODE_ENV === 'development') {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.ip
    if (ip === '127.0.0.1' || ip === '::1') {
      return true
    }
  }
  
  return false
}

export { DEFAULT_RATE_LIMITS, getRateLimitStore }
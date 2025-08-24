/**
 * Edge Caching Utilities
 * Provides utilities for edge caching with CDN support
 */

import { NextRequest, NextResponse } from 'next/server'

export interface CacheConfig {
  maxAge?: number
  sMaxAge?: number
  staleWhileRevalidate?: number
  staleIfError?: number
  private?: boolean
  immutable?: boolean
  mustRevalidate?: boolean
  tags?: string[]
}

export interface CacheOptions extends CacheConfig {
  revalidate?: number | false
  force?: boolean
}

/**
 * Default cache configurations for different content types
 */
export const CACHE_PRESETS = {
  // Static assets - cache for 1 year
  STATIC: {
    maxAge: 31536000,
    immutable: true,
    sMaxAge: 31536000,
  },
  
  // Images - cache for 1 month with revalidation
  IMAGE: {
    maxAge: 86400, // 1 day
    sMaxAge: 2592000, // 30 days
    staleWhileRevalidate: 604800, // 7 days
  },
  
  // API responses - short cache with background refresh
  API: {
    maxAge: 60, // 1 minute
    sMaxAge: 300, // 5 minutes
    staleWhileRevalidate: 3600, // 1 hour
    staleIfError: 86400, // 1 day
  },
  
  // HTML pages - balanced caching
  PAGE: {
    maxAge: 0,
    sMaxAge: 3600, // 1 hour
    staleWhileRevalidate: 86400, // 1 day
    staleIfError: 604800, // 7 days
  },
  
  // Dynamic content - minimal caching
  DYNAMIC: {
    maxAge: 0,
    sMaxAge: 60, // 1 minute
    staleWhileRevalidate: 300, // 5 minutes
  },
  
  // User-specific content - no public caching
  PRIVATE: {
    private: true,
    maxAge: 0,
    mustRevalidate: true,
  },
} as const

/**
 * Generate Cache-Control header value
 */
export function generateCacheControl(config: CacheConfig): string {
  const directives: string[] = []
  
  if (config.private) {
    directives.push('private')
  } else {
    directives.push('public')
  }
  
  if (config.maxAge !== undefined) {
    directives.push(`max-age=${config.maxAge}`)
  }
  
  if (config.sMaxAge !== undefined) {
    directives.push(`s-maxage=${config.sMaxAge}`)
  }
  
  if (config.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${config.staleWhileRevalidate}`)
  }
  
  if (config.staleIfError !== undefined) {
    directives.push(`stale-if-error=${config.staleIfError}`)
  }
  
  if (config.immutable) {
    directives.push('immutable')
  }
  
  if (config.mustRevalidate) {
    directives.push('must-revalidate')
  }
  
  return directives.join(', ')
}

/**
 * Set cache headers on response
 */
export function setCacheHeaders(
  response: NextResponse,
  config: CacheConfig
): NextResponse {
  const cacheControl = generateCacheControl(config)
  response.headers.set('Cache-Control', cacheControl)
  
  // Add CDN cache tags for targeted purging
  if (config.tags && config.tags.length > 0) {
    response.headers.set('Cache-Tag', config.tags.join(', '))
    response.headers.set('Cloudflare-Cache-Tag', config.tags.join(','))
    response.headers.set('Fastly-Surrogate-Key', config.tags.join(' '))
  }
  
  // Add cache status header for debugging
  response.headers.set('X-Cache-Status', 'MISS')
  
  return response
}

/**
 * Generate ETag for content
 */
export function generateETag(content: string | Buffer): string {
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256')
  hash.update(content)
  return `"${hash.digest('hex').substring(0, 16)}"`
}

/**
 * Check if request matches ETag
 */
export function checkETag(request: NextRequest, etag: string): boolean {
  const ifNoneMatch = request.headers.get('if-none-match')
  return ifNoneMatch === etag
}

/**
 * Create cached response with proper headers
 */
export function createCachedResponse(
  content: string | ReadableStream | null,
  options: {
    status?: number
    headers?: HeadersInit
    cacheConfig?: CacheConfig
    etag?: string
  } = {}
): NextResponse {
  const {
    status = 200,
    headers = {},
    cacheConfig = CACHE_PRESETS.PAGE,
    etag,
  } = options
  
  const response = new NextResponse(content, {
    status,
    headers: {
      ...headers,
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
  
  // Set cache headers
  setCacheHeaders(response, cacheConfig)
  
  // Set ETag if provided
  if (etag) {
    response.headers.set('ETag', etag)
  }
  
  // Add timing headers for performance monitoring
  response.headers.set('X-Response-Time', Date.now().toString())
  response.headers.set('X-Edge-Location', process.env.VERCEL_REGION || 'unknown')
  
  return response
}

/**
 * Vary header management for content negotiation
 */
export function setVaryHeaders(
  response: NextResponse,
  varies: string[]
): NextResponse {
  const existingVary = response.headers.get('Vary') || ''
  const varySet = new Set(
    existingVary
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  )
  
  varies.forEach((v) => varySet.add(v))
  
  response.headers.set('Vary', Array.from(varySet).join(', '))
  
  return response
}

/**
 * Get cache key for request
 */
export function getCacheKey(request: NextRequest): string {
  const url = new URL(request.url)
  const accept = request.headers.get('accept') || ''
  const isWebP = accept.includes('image/webp')
  const isAvif = accept.includes('image/avif')
  
  // Include important variations in cache key
  const variations = [
    url.pathname,
    url.search,
    isWebP ? 'webp' : '',
    isAvif ? 'avif' : '',
  ].filter(Boolean)
  
  return variations.join(':')
}

/**
 * Purge cache by tags (for CDN cache invalidation)
 */
export async function purgeCacheByTags(tags: string[]): Promise<void> {
  // Cloudflare purge
  if (process.env.CLOUDFLARE_ZONE_ID && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tags,
          }),
        }
      )
    } catch (error) {
      console.error('Cloudflare cache purge failed:', error)
    }
  }
  
  // Add other CDN purge logic here (Fastly, AWS CloudFront, etc.)
}

/**
 * Cache warmup utility for critical paths
 */
export async function warmupCache(urls: string[]): Promise<void> {
  const warmupPromises = urls.map(async (url) => {
    try {
      await fetch(url, {
        method: 'HEAD',
        headers: {
          'X-Warmup-Request': 'true',
        },
      })
    } catch (error) {
      console.error(`Cache warmup failed for ${url}:`, error)
    }
  })
  
  await Promise.allSettled(warmupPromises)
}

/**
 * Edge function cache wrapper
 */
export function withEdgeCache<T extends (...args: any[]) => any>(
  fn: T,
  config: CacheConfig = CACHE_PRESETS.API
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest
    
    // Generate cache key
    const cacheKey = getCacheKey(request)
    
    // Check if we have a cached response
    // This would integrate with your edge cache provider
    
    // Execute function
    const result = await fn(...args)
    
    // Cache the result if it's a successful response
    if (result instanceof NextResponse && result.status === 200) {
      setCacheHeaders(result, config)
    }
    
    return result
  }) as T
}
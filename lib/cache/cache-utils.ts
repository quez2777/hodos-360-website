/**
 * Cache Utilities and Helpers
 * Common utilities for cache management across the application
 */

import { headers } from 'next/headers'
import { CACHE_PRESETS } from './edge-cache'

/**
 * Get cache configuration based on request type
 */
export function getCacheConfig(pathname: string): typeof CACHE_PRESETS[keyof typeof CACHE_PRESETS] {
  // API routes
  if (pathname.startsWith('/api/')) {
    if (pathname.includes('/auth') || pathname.includes('/user')) {
      return CACHE_PRESETS.PRIVATE
    }
    return CACHE_PRESETS.API
  }
  
  // Static assets
  if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i)) {
    return CACHE_PRESETS.IMAGE
  }
  
  if (pathname.match(/\.(woff|woff2|ttf|otf|eot|js|css)$/i)) {
    return CACHE_PRESETS.STATIC
  }
  
  // Pages
  if (pathname === '/' || pathname.match(/^\/(?:products|about|contact|blog)/)) {
    return CACHE_PRESETS.PAGE
  }
  
  // Default to dynamic
  return CACHE_PRESETS.DYNAMIC
}

/**
 * Generate cache tags for a resource
 */
export function generateCacheTags(
  type: 'page' | 'api' | 'product' | 'blog' | 'user',
  id?: string
): string[] {
  const tags = [type]
  
  if (id) {
    tags.push(`${type}:${id}`)
  }
  
  // Add timestamp tag for time-based invalidation
  const dateTag = new Date().toISOString().split('T')[0]
  tags.push(`date:${dateTag}`)
  
  return tags
}

/**
 * Check if request is from a bot/crawler
 */
export function isCrawler(userAgent: string): boolean {
  const crawlerPatterns = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /slack/i,
  ]
  
  return crawlerPatterns.some((pattern) => pattern.test(userAgent))
}

/**
 * Get optimal cache duration based on content freshness
 */
export function getOptimalCacheDuration(
  lastModified: Date,
  contentType: 'static' | 'dynamic' | 'user'
): number {
  const age = Date.now() - lastModified.getTime()
  const hour = 3600000
  const day = hour * 24
  const week = day * 7
  
  if (contentType === 'static') {
    return week * 52 // 1 year for truly static content
  }
  
  if (contentType === 'user') {
    return 0 // No public caching for user content
  }
  
  // Dynamic content - cache based on age
  if (age < hour) {
    return 60000 // 1 minute for very fresh content
  } else if (age < day) {
    return hour // 1 hour for daily content
  } else if (age < week) {
    return day // 1 day for weekly content
  } else {
    return week // 1 week for older content
  }
}

/**
 * Parse cache control header
 */
export function parseCacheControl(header: string): Record<string, string | boolean> {
  const directives: Record<string, string | boolean> = {}
  
  header.split(',').forEach((directive) => {
    const [key, value] = directive.trim().split('=')
    directives[key] = value || true
  })
  
  return directives
}

/**
 * Check if response is cacheable
 */
export function isCacheable(
  status: number,
  method: string,
  cacheControl?: string
): boolean {
  // Only cache successful GET requests
  if (method !== 'GET' || status !== 200) {
    return false
  }
  
  // Check cache control directives
  if (cacheControl) {
    const directives = parseCacheControl(cacheControl)
    if (directives['no-store'] || directives['private']) {
      return false
    }
  }
  
  return true
}

/**
 * Format cache size for display
 */
export function formatCacheSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * Calculate cache hit rate
 */
export function calculateHitRate(hits: number, misses: number): string {
  const total = hits + misses
  if (total === 0) return '0%'
  
  const rate = (hits / total) * 100
  return `${rate.toFixed(2)}%`
}

/**
 * Get cache performance metrics
 */
export interface CacheMetrics {
  hitRate: string
  totalRequests: number
  cacheSize: string
  avgResponseTime: number
  lastUpdated: Date
}

export function getCacheMetrics(
  hits: number,
  misses: number,
  size: number,
  responseTimes: number[]
): CacheMetrics {
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
    : 0
  
  return {
    hitRate: calculateHitRate(hits, misses),
    totalRequests: hits + misses,
    cacheSize: formatCacheSize(size),
    avgResponseTime: Math.round(avgResponseTime),
    lastUpdated: new Date(),
  }
}

/**
 * Create cache key from multiple parts
 */
export function createCacheKey(...parts: (string | number | undefined)[]): string {
  return parts
    .filter((part) => part !== undefined)
    .map((part) => String(part))
    .join(':')
}

/**
 * Extract cache status from response headers
 */
export function getCacheStatus(response: Response): 'HIT' | 'MISS' | 'STALE' | 'BYPASS' {
  const cacheStatus = response.headers.get('X-Cache-Status')
  const cfCacheStatus = response.headers.get('CF-Cache-Status')
  const age = response.headers.get('Age')
  
  // Check custom cache status first
  if (cacheStatus) {
    return cacheStatus as any
  }
  
  // Check Cloudflare cache status
  if (cfCacheStatus) {
    if (cfCacheStatus === 'HIT') return 'HIT'
    if (cfCacheStatus === 'MISS') return 'MISS'
    if (cfCacheStatus === 'EXPIRED' || cfCacheStatus === 'STALE') return 'STALE'
    if (cfCacheStatus === 'BYPASS') return 'BYPASS'
  }
  
  // Check age header
  if (age && parseInt(age) > 0) {
    return 'HIT'
  }
  
  return 'MISS'
}

/**
 * Revalidate cache on-demand
 */
export async function revalidateCache(
  tags?: string[],
  paths?: string[]
): Promise<void> {
  try {
    // Revalidate by tags
    if (tags && tags.length > 0) {
      const { revalidateTag } = await import('next/cache')
      for (const tag of tags) {
        revalidateTag(tag)
      }
    }
    
    // Revalidate by paths
    if (paths && paths.length > 0) {
      const { revalidatePath } = await import('next/cache')
      for (const path of paths) {
        revalidatePath(path)
      }
    }
  } catch (error) {
    console.error('Cache revalidation failed:', error)
  }
}
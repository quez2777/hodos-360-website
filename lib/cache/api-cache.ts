/**
 * API Response Caching Utilities
 * Provides in-memory and distributed caching for API responses
 */

import { LRUCache } from 'lru-cache'
import { unstable_cache } from 'next/cache'

export interface CachedResponse<T = any> {
  data: T
  timestamp: number
  etag?: string
  headers?: Record<string, string>
}

export interface CacheEntry<T = any> {
  key: string
  value: CachedResponse<T>
  ttl: number
  tags?: string[]
}

/**
 * In-memory LRU cache for API responses
 */
class ApiCache {
  private cache: LRUCache<string, CachedResponse>
  
  constructor() {
    this.cache = new LRUCache<string, CachedResponse>({
      max: 500, // Maximum number of items
      maxSize: 50 * 1024 * 1024, // 50MB max size
      sizeCalculation: (value) => {
        return JSON.stringify(value).length
      },
      ttl: 1000 * 60 * 5, // 5 minutes default TTL
      updateAgeOnGet: true,
      updateAgeOnHas: false,
    })
  }
  
  /**
   * Get cached response
   */
  get<T = any>(key: string): CachedResponse<T> | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    // Check if cache is stale
    const age = Date.now() - cached.timestamp
    const maxAge = this.cache.getRemainingTTL(key)
    
    if (maxAge && age > maxAge) {
      this.cache.delete(key)
      return null
    }
    
    return cached as CachedResponse<T>
  }
  
  /**
   * Set cached response
   */
  set<T = any>(
    key: string,
    data: T,
    options: {
      ttl?: number
      etag?: string
      headers?: Record<string, string>
    } = {}
  ): void {
    const { ttl, etag, headers } = options
    
    const cachedResponse: CachedResponse<T> = {
      data,
      timestamp: Date.now(),
      etag,
      headers,
    }
    
    this.cache.set(key, cachedResponse, { ttl })
  }
  
  /**
   * Delete cached response
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  /**
   * Clear all cached responses
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      calculatedSize: this.cache.calculatedSize,
      hits: (this.cache as any).hits || 0,
      misses: (this.cache as any).misses || 0,
    }
  }
}

// Global cache instance
export const apiCache = new ApiCache()

/**
 * Cache key generator for API requests
 */
export function generateApiCacheKey(
  endpoint: string,
  params?: Record<string, any>,
  userId?: string
): string {
  const sortedParams = params
    ? Object.keys(params)
        .sort()
        .reduce((acc, key) => {
          acc[key] = params[key]
          return acc
        }, {} as Record<string, any>)
    : {}
  
  const parts = [
    'api',
    endpoint,
    JSON.stringify(sortedParams),
    userId || 'anonymous',
  ]
  
  return parts.join(':')
}

/**
 * Stale-while-revalidate cache wrapper
 */
export async function withSWR<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number
    swr?: number
    onError?: (error: Error) => void
    tags?: string[]
  } = {}
): Promise<T> {
  const { ttl = 60000, swr = 3600000, onError } = options
  
  // Check cache first
  const cached = apiCache.get<T>(key)
  
  if (cached) {
    const age = Date.now() - cached.timestamp
    
    // Return cached data if fresh
    if (age < ttl) {
      return cached.data
    }
    
    // Return stale data and revalidate in background
    if (age < ttl + swr) {
      // Revalidate in background
      fetcher()
        .then((data) => {
          apiCache.set(key, data, { ttl })
        })
        .catch((error) => {
          console.error('Background revalidation failed:', error)
          onError?.(error)
        })
      
      return cached.data
    }
  }
  
  // Fetch fresh data
  try {
    const data = await fetcher()
    apiCache.set(key, data, { ttl })
    return data
  } catch (error) {
    // Return stale data on error if available
    if (cached) {
      console.error('Fetch failed, returning stale data:', error)
      return cached.data
    }
    throw error
  }
}

/**
 * Next.js unstable_cache wrapper with better typing
 */
export function cachedFetch<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: {
    revalidate?: number | false
    tags?: string[]
  } = {}
): () => Promise<T> {
  return unstable_cache(fn, keyParts, {
    revalidate: options.revalidate ?? 3600, // 1 hour default
    tags: options.tags,
  })
}

/**
 * Batch cache operations
 */
export class BatchCache {
  private pending = new Map<string, Promise<any>>()
  
  /**
   * Deduplicate concurrent requests for the same key
   */
  async dedupe<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    // Check if there's a pending request
    const pending = this.pending.get(key)
    if (pending) {
      return pending
    }
    
    // Create new request
    const promise = fetcher()
      .finally(() => {
        this.pending.delete(key)
      })
    
    this.pending.set(key, promise)
    return promise
  }
  
  /**
   * Batch multiple cache operations
   */
  async batch<T>(
    operations: Array<{
      key: string
      fetcher: () => Promise<T>
    }>
  ): Promise<T[]> {
    const results = await Promise.allSettled(
      operations.map((op) => this.dedupe(op.key, op.fetcher))
    )
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(
          `Batch operation failed for key ${operations[index].key}:`,
          result.reason
        )
        throw result.reason
      }
    })
  }
}

export const batchCache = new BatchCache()

/**
 * Cache invalidation utilities
 */
export const cacheInvalidation = {
  /**
   * Invalidate by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0
    const keys = Array.from((apiCache as any).cache.keys())
    
    for (const key of keys) {
      if (typeof key !== 'string') continue
      if (pattern.test(key)) {
        apiCache.delete(key)
        invalidated++
      }
    }
    
    return invalidated
  },
  
  /**
   * Invalidate by prefix
   */
  invalidatePrefix(prefix: string): number {
    const pattern = new RegExp(`^${prefix}`)
    return this.invalidatePattern(pattern)
  },
  
  /**
   * Invalidate by tags (requires external tag tracking)
   */
  async invalidateTags(tags: string[]): Promise<void> {
    // This would integrate with your tag tracking system
    // For now, we'll invalidate common patterns
    for (const tag of tags) {
      this.invalidatePrefix(`api:${tag}`)
    }
  },
}

/**
 * Response caching middleware
 */
export function createCacheMiddleware(config: {
  ttl?: number
  keyGenerator?: (req: Request) => string
  shouldCache?: (req: Request, res: Response) => boolean
}) {
  const {
    ttl = 60000,
    keyGenerator = (req) => req.url,
    shouldCache = (req, res) => res.ok && req.method === 'GET',
  } = config
  
  return async function cacheMiddleware(
    req: Request,
    handler: (req: Request) => Promise<Response>
  ): Promise<Response> {
    const key = keyGenerator(req)
    
    // Check cache
    const cached = apiCache.get<Response>(key)
    if (cached) {
      return new Response(cached.data.body, {
        status: cached.data.status,
        headers: {
          ...cached.headers,
          'X-Cache': 'HIT',
        },
      })
    }
    
    // Execute handler
    const response = await handler(req)
    
    // Cache if appropriate
    if (shouldCache(req, response)) {
      const clonedResponse = response.clone()
      const body = await clonedResponse.text()
      
      apiCache.set(
        key,
        {
          body,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        },
        { ttl }
      )
    }
    
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-Cache': 'MISS',
      },
    })
  }
}

/**
 * Preload cache for critical data
 */
export async function preloadCache(
  entries: Array<{
    key: string
    fetcher: () => Promise<any>
    ttl?: number
  }>
): Promise<void> {
  const promises = entries.map(async ({ key, fetcher, ttl }) => {
    try {
      const data = await fetcher()
      apiCache.set(key, data, { ttl })
    } catch (error) {
      console.error(`Failed to preload cache for key ${key}:`, error)
    }
  })
  
  await Promise.allSettled(promises)
}
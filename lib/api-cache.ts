// API caching utilities for client-side and server-side caching

interface CacheOptions {
  ttl?: number // Time to live in seconds
  swr?: number // Stale-while-revalidate time in seconds
  key?: string // Custom cache key
}

// In-memory cache for client-side
const memoryCache = new Map<string, { data: any; timestamp: number; ttl: number }>()

// Client-side caching wrapper
export async function cachedFetch<T>(
  url: string,
  options?: any
): Promise<T> {
  const cacheKey = options?.cache?.key || url
  const ttl = (options?.cache?.ttl || 300) * 1000 // Convert to milliseconds
  
  // Check memory cache first
  const cached = memoryCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Cache-Control': `max-age=${options?.cache?.ttl || 300}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Store in memory cache
    memoryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    })
    
    // Clean up old cache entries
    if (memoryCache.size > 100) {
      const entries = Array.from(memoryCache.entries())
      const oldestKey = entries.reduce((oldest, [key, value]) => {
        return value.timestamp < memoryCache.get(oldest)!.timestamp ? key : oldest
      }, entries[0][0])
      memoryCache.delete(oldestKey)
    }
    
    return data
  } catch (error) {
    // Return cached data if available, even if stale
    if (cached) {
      console.warn('Using stale cache due to fetch error:', error)
      return cached.data
    }
    throw error
  }
}

// Server-side cache headers helper
export function generateCacheHeaders(options: CacheOptions = {}) {
  const maxAge = options.ttl || 300
  const swr = options.swr || 60
  
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
    'CDN-Cache-Control': `max-age=${maxAge}`,
    'Vercel-CDN-Cache-Control': `max-age=${maxAge}`,
  }
}

// React Query-like hook for client-side caching (if using React Query)
export function getCacheConfig(key: string, ttl: number = 300) {
  return {
    staleTime: ttl * 1000,
    cacheTime: ttl * 2 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  }
}

// Prefetch utility for critical data
export async function prefetchData(urls: string[]) {
  if (typeof window === 'undefined') return
  
  // Use requestIdleCallback if available
  const prefetch = () => {
    urls.forEach(url => {
      cachedFetch(url, { cache: { ttl: 3600 } }).catch(() => {
        // Silently fail prefetch
      })
    })
  }
  
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetch)
  } else {
    setTimeout(prefetch, 1000)
  }
}

// Clear cache utility
export function clearApiCache(key?: string) {
  if (key) {
    memoryCache.delete(key)
  } else {
    memoryCache.clear()
  }
}
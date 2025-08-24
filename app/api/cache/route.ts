/**
 * Cache Management API
 * Provides endpoints for cache monitoring and management
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiCache, cacheInvalidation } from '@/lib/cache/api-cache'
import { purgeCacheByTags } from '@/lib/cache/edge-cache'
import { getCacheMetrics, revalidateCache } from '@/lib/cache/cache-utils'

// GET /api/cache - Get cache statistics
export async function GET(request: NextRequest) {
  try {
    const stats = apiCache.getStats()
    
    // Mock response times for demo (in production, track actual times)
    const mockResponseTimes = Array(100).fill(0).map(() => 
      Math.random() * 100 + 20
    )
    
    const metrics = getCacheMetrics(
      stats.hits || 0,
      stats.misses || 0,
      stats.calculatedSize || 0,
      mockResponseTimes
    )
    
    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        entries: stats.size,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get cache statistics' 
      },
      { status: 500 }
    )
  }
}

// POST /api/cache/purge - Purge cache by tags or patterns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tags, patterns, prefix } = body
    
    let purged = 0
    
    // Purge by tags (CDN level)
    if (tags && Array.isArray(tags)) {
      await purgeCacheByTags(tags)
      // Also invalidate Next.js cache
      await revalidateCache(tags)
      purged += tags.length
    }
    
    // Purge by patterns (local cache)
    if (patterns && Array.isArray(patterns)) {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern)
        purged += cacheInvalidation.invalidatePattern(regex)
      }
    }
    
    // Purge by prefix (local cache)
    if (prefix) {
      purged += cacheInvalidation.invalidatePrefix(prefix)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        purged,
        message: `Successfully purged ${purged} cache entries`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to purge cache' 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/cache - Clear all cache
export async function DELETE(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CACHE_ADMIN_TOKEN}`) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized' 
        },
        { status: 401 }
      )
    }
    
    // Clear local cache
    apiCache.clear()
    
    // Revalidate all paths (use with caution)
    await revalidateCache(undefined, ['/'])
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'All cache cleared successfully',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear cache' 
      },
      { status: 500 }
    )
  }
}
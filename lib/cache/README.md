# HODOS 360 Caching Strategy

## Overview

This directory contains comprehensive caching utilities for the HODOS 360 website, implementing multiple layers of caching for optimal performance.

## Cache Layers

### 1. Edge Caching (CDN Level)
- **File**: `edge-cache.ts`
- **Purpose**: Global edge caching with CDN support
- **Features**:
  - Predefined cache presets for different content types
  - Cache-Control header generation
  - ETag support
  - Cache tag management for targeted purging
  - Integration with Cloudflare, Fastly, and other CDNs

### 2. API Response Caching
- **File**: `api-cache.ts`
- **Purpose**: In-memory caching for API responses
- **Features**:
  - LRU cache with size limits
  - Stale-while-revalidate pattern
  - Request deduplication
  - Batch operations
  - Pattern-based invalidation

### 3. Middleware Integration
- **File**: Updated `middleware.ts`
- **Purpose**: Apply cache headers at the edge
- **Features**:
  - Content-type based caching rules
  - Security headers
  - Performance monitoring
  - Preload headers for critical resources

## Cache Presets

```typescript
// Static assets - 1 year cache
STATIC: { maxAge: 31536000, immutable: true }

// Images - 30 days with revalidation
IMAGE: { maxAge: 86400, sMaxAge: 2592000, staleWhileRevalidate: 604800 }

// API responses - Short cache with background refresh
API: { maxAge: 60, sMaxAge: 300, staleWhileRevalidate: 3600 }

// HTML pages - Balanced caching
PAGE: { maxAge: 0, sMaxAge: 3600, staleWhileRevalidate: 86400 }

// Dynamic content - Minimal caching
DYNAMIC: { maxAge: 0, sMaxAge: 60, staleWhileRevalidate: 300 }

// Private content - No public caching
PRIVATE: { private: true, maxAge: 0, mustRevalidate: true }
```

## Usage Examples

### Edge Caching
```typescript
import { setCacheHeaders, CACHE_PRESETS } from '@/lib/cache/edge-cache'

// In your API route or page
const response = new NextResponse(data)
setCacheHeaders(response, CACHE_PRESETS.API)
```

### API Caching with SWR
```typescript
import { withSWR } from '@/lib/cache/api-cache'

const data = await withSWR(
  'api:products:list',
  async () => fetchProducts(),
  { 
    ttl: 60000, // 1 minute
    swr: 3600000 // 1 hour stale window
  }
)
```

### Cache Invalidation
```typescript
import { cacheInvalidation } from '@/lib/cache/api-cache'
import { purgeCacheByTags } from '@/lib/cache/edge-cache'

// Invalidate by prefix
cacheInvalidation.invalidatePrefix('api:products')

// Purge CDN cache by tags
await purgeCacheByTags(['products', 'homepage'])
```

### Batch Operations
```typescript
import { batchCache } from '@/lib/cache/api-cache'

const results = await batchCache.batch([
  { key: 'user:1', fetcher: () => fetchUser(1) },
  { key: 'user:2', fetcher: () => fetchUser(2) },
])
```

## Cache Management API

### Get Cache Statistics
```bash
GET /api/cache
```

### Purge Cache
```bash
POST /api/cache/purge
{
  "tags": ["products", "homepage"],
  "patterns": ["api:user:.*"],
  "prefix": "api:search"
}
```

### Clear All Cache (Admin Only)
```bash
DELETE /api/cache
Authorization: Bearer YOUR_ADMIN_TOKEN
```

## Performance Best Practices

1. **Use appropriate cache presets** for different content types
2. **Implement cache tags** for targeted invalidation
3. **Monitor cache hit rates** using the cache API
4. **Warm up critical paths** after deployments
5. **Use stale-while-revalidate** for better UX
6. **Deduplicate concurrent requests** to reduce load

## Environment Variables

```env
# CDN Configuration
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_API_TOKEN=your_api_token

# Cache Admin
CACHE_ADMIN_TOKEN=your_admin_token

# Edge Region
VERCEL_REGION=auto
```

## Monitoring

The caching system provides several headers for monitoring:
- `X-Cache-Status`: HIT/MISS/STALE/BYPASS
- `X-Cache-Key`: The cache key used
- `X-Edge-Region`: Which edge location served the request
- `Server-Timing`: Performance metrics
- `Cache-Tag`: Tags for cache invalidation

## Cache Invalidation Strategies

1. **Time-based**: Automatic expiration using TTL
2. **Tag-based**: Invalidate related content using tags
3. **Pattern-based**: Invalidate using regex patterns
4. **Manual**: Direct invalidation via API

## Integration with Next.js

The caching utilities integrate seamlessly with Next.js:
- `unstable_cache` for data fetching
- `revalidateTag` for tag-based invalidation
- `revalidatePath` for path-based invalidation
- ISR (Incremental Static Regeneration) support
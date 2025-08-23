import { NextRequest, NextResponse } from 'next/server'

// Edge runtime for optimal performance
export const runtime = 'edge'

// Cache storage using Edge Runtime KV (would use Vercel KV or similar in production)
const cache = new Map<string, { data: any; expires: number }>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  
  if (!key) {
    return NextResponse.json({ error: 'Cache key required' }, { status: 400 })
  }
  
  // Check cache
  const cached = cache.get(key)
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.data, {
      headers: {
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=60',
      },
    })
  }
  
  // Cache miss - in production, this would fetch from origin
  return NextResponse.json(
    { message: 'Cache miss', key },
    {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'no-cache',
      },
    }
  )
}

export async function POST(request: NextRequest) {
  try {
    const { key, data, ttl = 300 } = await request.json()
    
    if (!key || !data) {
      return NextResponse.json(
        { error: 'Key and data required' },
        { status: 400 }
      )
    }
    
    // Store in cache
    cache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    })
    
    // Clean up expired entries
    if (cache.size > 1000) {
      const now = Date.now()
      for (const [k, v] of cache.entries()) {
        if (v.expires < now) {
          cache.delete(k)
        }
      }
    }
    
    return NextResponse.json({ success: true, key })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  
  if (key) {
    cache.delete(key)
  } else {
    // Clear all cache
    cache.clear()
  }
  
  return NextResponse.json({ success: true })
}
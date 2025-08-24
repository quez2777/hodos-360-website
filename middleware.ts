import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { 
  CACHE_PRESETS, 
  setCacheHeaders, 
  setVaryHeaders,
  generateETag,
  checkETag,
  getCacheKey 
} from '@/lib/cache/edge-cache'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const url = request.nextUrl
  const pathname = url.pathname
  
  // Store request time for performance monitoring
  request.headers.set('x-middleware-request-time', Date.now().toString())
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.google-analytics.com *.googletagmanager.com; " +
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
    "font-src 'self' fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' *.google-analytics.com *.googletagmanager.com vitals.vercel-insights.com; " +
    "media-src 'self' blob:; " +
    "object-src 'none'; " +
    "frame-ancestors 'none';"
  )
  
  // Apply cache headers based on content type
  if (pathname.startsWith('/_next/static/')) {
    // Next.js static assets
    setCacheHeaders(response, CACHE_PRESETS.STATIC)
  } else if (pathname.startsWith('/api/')) {
    // API routes with different cache strategies
    if (pathname.includes('/search') || pathname.includes('/suggestions')) {
      // Search endpoints - short cache
      setCacheHeaders(response, {
        maxAge: 30,
        sMaxAge: 60,
        staleWhileRevalidate: 300,
      })
    } else if (pathname.includes('/data') || pathname.includes('/list')) {
      // Data fetching - standard API cache
      setCacheHeaders(response, CACHE_PRESETS.API)
    } else if (pathname.includes('/auth') || pathname.includes('/user')) {
      // User-specific endpoints - private cache only
      setCacheHeaders(response, CACHE_PRESETS.PRIVATE)
    } else {
      // Mutations and forms - no cache
      setCacheHeaders(response, {
        private: true,
        maxAge: 0,
        mustRevalidate: true,
      })
    }
  } else if (pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i)) {
    // Images with modern format support
    setCacheHeaders(response, CACHE_PRESETS.IMAGE)
    setVaryHeaders(response, ['Accept'])
  } else if (pathname.match(/\.(woff|woff2|ttf|otf|eot)$/i)) {
    // Fonts - immutable
    setCacheHeaders(response, CACHE_PRESETS.STATIC)
  } else if (pathname.match(/\.(js|css|map)$/i)) {
    // JavaScript and CSS files
    setCacheHeaders(response, {
      maxAge: 86400, // 1 day
      sMaxAge: 2592000, // 30 days
      staleWhileRevalidate: 604800, // 7 days
      immutable: pathname.includes('.min.') || pathname.includes('[hash]'),
    })
  } else if (pathname.match(/\.(json|xml|txt|webmanifest)$/i)) {
    // Data files
    setCacheHeaders(response, {
      maxAge: 3600, // 1 hour
      sMaxAge: 86400, // 1 day
      staleWhileRevalidate: 604800, // 7 days
    })
  } else if (pathname === '/' || pathname.match(/^\/(?:products|about|contact|blog)/)) {
    // HTML pages
    setCacheHeaders(response, CACHE_PRESETS.PAGE)
    setVaryHeaders(response, ['Accept-Encoding', 'Accept'])
    
    // Add cache tags for targeted invalidation
    const tags = ['page']
    if (pathname === '/') {
      tags.push('homepage')
    } else {
      tags.push(pathname.slice(1).split('/')[0])
    }
    response.headers.set('Cache-Tag', tags.join(', '))
  }
  
  // Add performance and debugging headers
  response.headers.set('X-Cache-Key', getCacheKey(request))
  response.headers.set('X-Edge-Region', process.env.VERCEL_REGION || 'unknown')
  response.headers.set('X-Request-Id', crypto.randomUUID())
  
  // Server timing
  const duration = Date.now() - parseInt(request.headers.get('x-middleware-request-time') || '0')
  response.headers.set('Server-Timing', `middleware;dur=${duration}`)
  
  // Add Link preload headers for critical resources
  if (pathname === '/') {
    response.headers.append(
      'Link',
      '</fonts/inter-var.woff2>; rel=preload; as=font; type=font/woff2; crossorigin'
    )
    response.headers.append(
      'Link',
      '</_next/static/css/app.css>; rel=preload; as=style'
    )
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
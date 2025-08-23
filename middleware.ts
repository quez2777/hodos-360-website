import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const url = request.nextUrl
  
  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Add cache headers based on path
  if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache for 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  } else if (url.pathname.startsWith('/api/')) {
    // API routes - use stale-while-revalidate
    const isDataFetch = url.pathname.includes('/data') || url.pathname.includes('/list')
    if (isDataFetch) {
      response.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=60')
    } else {
      // Form submissions and mutations - no cache
      response.headers.set('Cache-Control', 'no-store, max-age=0')
    }
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    // Images - cache for 30 days
    response.headers.set('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400')
  } else if (url.pathname.match(/\.(woff|woff2|ttf|otf)$/i)) {
    // Fonts - cache for 1 year
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // Add timing headers for performance monitoring
  response.headers.set('Server-Timing', `middleware;dur=${Date.now() - request.headers.get('x-middleware-request-time') || Date.now()}`)
  
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
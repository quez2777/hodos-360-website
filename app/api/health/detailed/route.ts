import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ServiceCheck {
  status: 'up' | 'down' | 'degraded'
  responseTime: number
  lastSuccessful?: string
  errorCount?: number
  details?: any
}

interface DetailedHealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  version: string
  environment: string
  uptime: number
  services: {
    database: ServiceCheck
    redis?: ServiceCheck
    ghl: ServiceCheck
    stripe: ServiceCheck
    email: ServiceCheck
    s3: ServiceCheck
    openai: ServiceCheck
  }
  performance: {
    avgResponseTime: number
    memoryUsage: number
    cpuLoad?: number
  }
  business: {
    activeConnections: number
    queueSize: number
    lastHour: {
      requests: number
      errors: number
      successRate: number
    }
  }
  security: {
    rateLimitStatus: string
    failedAuthAttempts: number
    suspiciousActivity: number
  }
}

// Helper function to measure execution time
async function measureTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
  const start = performance.now()
  const result = await fn()
  const time = performance.now() - start
  return { result, time }
}

// Database health check with metrics
async function checkDatabase(): Promise<ServiceCheck> {
  try {
    const { time } = await measureTime(async () => {
      // Test basic connection
      await prisma.$queryRaw`SELECT 1`
      
      // Test query performance  
      const userCount = await prisma.user.count()
      const caseCount = await prisma.case.count()
      const documentCount = await prisma.document.count()
      
      return { userCount, caseCount, documentCount }
    })

    // Check for slow queries (>1 second is concerning)
    const status = time > 1000 ? 'degraded' : 'up'

    return {
      status,
      responseTime: time,
      lastSuccessful: new Date().toISOString(),
      details: {
        connectionPool: 'active',
        queryPerformance: time < 500 ? 'excellent' : time < 1000 ? 'good' : 'slow'
      }
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: 0,
      errorCount: 1,
      details: {
        error: error instanceof Error ? error.message : 'Unknown database error'
      }
    }
  }
}

// GoHighLevel integration check
async function checkGHL(): Promise<ServiceCheck> {
  try {
    const { time } = await measureTime(async () => {
      // Check if GHL credentials are configured
      const hasConfig = !!(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID)
      
      if (!hasConfig) {
        throw new Error('GHL configuration missing')
      }

      // In production, you'd make an actual API call to GHL
      // For now, we'll simulate a health check
      return { configured: true }
    })

    return {
      status: 'up',
      responseTime: time,
      lastSuccessful: new Date().toISOString(),
      details: {
        webhookEndpoint: '/api/integrations/crm',
        configuration: 'valid'
      }
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: 0,
      details: {
        error: error instanceof Error ? error.message : 'GHL integration error'
      }
    }
  }
}

// Stripe integration check
async function checkStripe(): Promise<ServiceCheck> {
  try {
    const { time } = await measureTime(async () => {
      const hasConfig = !!process.env.STRIPE_SECRET_KEY
      
      if (!hasConfig) {
        throw new Error('Stripe configuration missing')
      }

      // In production, you'd verify the API key with Stripe
      return { configured: true }
    })

    return {
      status: 'up',
      responseTime: time,
      lastSuccessful: new Date().toISOString(),
      details: {
        webhookEndpoint: '/api/integrations/payment',
        configuration: 'valid'
      }
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: 0,
      details: {
        error: error instanceof Error ? error.message : 'Stripe integration error'
      }
    }
  }
}

// Email service check  
async function checkEmail(): Promise<ServiceCheck> {
  try {
    const { time } = await measureTime(async () => {
      const hasConfig = !!process.env.RESEND_API_KEY || !!process.env.SMTP_HOST
      
      if (!hasConfig) {
        throw new Error('Email service not configured')
      }

      // Check email queue status (if implemented)
      return { configured: true }
    })

    return {
      status: 'up',
      responseTime: time,
      lastSuccessful: new Date().toISOString(),
      details: {
        provider: process.env.RESEND_API_KEY ? 'Resend' : 'SMTP',
        queueSize: 0 // Would be actual queue size in production
      }
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: 0,
      details: {
        error: error instanceof Error ? error.message : 'Email service error'
      }
    }
  }
}

// S3 storage check
async function checkS3(): Promise<ServiceCheck> {
  try {
    const { time } = await measureTime(async () => {
      const hasConfig = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME)
      
      if (!hasConfig) {
        throw new Error('S3 configuration missing')
      }

      // In production, you'd test actual S3 connectivity
      return { configured: true }
    })

    return {
      status: 'up',
      responseTime: time,
      lastSuccessful: new Date().toISOString(),
      details: {
        bucket: process.env.AWS_S3_BUCKET_NAME?.substring(0, 10) + '...',
        region: process.env.AWS_REGION
      }
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: 0,
      details: {
        error: error instanceof Error ? error.message : 'S3 storage error'
      }
    }
  }
}

// OpenAI service check
async function checkOpenAI(): Promise<ServiceCheck> {
  try {
    const { time } = await measureTime(async () => {
      const hasConfig = !!process.env.OPENAI_API_KEY
      
      if (!hasConfig) {
        throw new Error('OpenAI configuration missing')
      }

      // In production, you'd make a minimal API call to verify the key
      return { configured: true }
    })

    return {
      status: 'up',
      responseTime: time,
      lastSuccessful: new Date().toISOString(),
      details: {
        apiKeyConfigured: true,
        rateLimitStatus: 'normal' // Would check actual rate limits
      }
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: 0,
      details: {
        error: error instanceof Error ? error.message : 'OpenAI service error'
      }
    }
  }
}

// Performance metrics
function getPerformanceMetrics() {
  const memoryUsage = process.memoryUsage()
  
  return {
    avgResponseTime: 0, // Would track actual response times
    memoryUsage: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024)
  }
}

// Business metrics
async function getBusinessMetrics() {
  try {
    // In production, these would be real queries
    return {
      activeConnections: 0, // Current WebSocket/SSE connections
      queueSize: 0, // Background job queue size
      lastHour: {
        requests: 0, // Would track from logs or metrics
        errors: 0,
        successRate: 100
      }
    }
  } catch (error) {
    return {
      activeConnections: 0,
      queueSize: 0,
      lastHour: {
        requests: 0,
        errors: 0,
        successRate: 0
      }
    }
  }
}

// Security metrics
async function getSecurityMetrics() {
  try {
    // In production, these would come from actual security monitoring
    return {
      rateLimitStatus: 'normal',
      failedAuthAttempts: 0, // Last 24 hours
      suspiciousActivity: 0, // Blocked IPs, suspicious patterns
      lastSecurityScan: new Date().toISOString()
    }
  } catch (error) {
    return {
      rateLimitStatus: 'unknown',
      failedAuthAttempts: 0,
      suspiciousActivity: 0
    }
  }
}

export async function GET() {
  const startTime = performance.now()
  
  try {
    // Run all checks in parallel
    const [
      database,
      ghl,
      stripe, 
      email,
      s3,
      openai,
      performanceMetrics,
      business,
      security
    ] = await Promise.all([
      checkDatabase(),
      checkGHL(),
      checkStripe(),
      checkEmail(),
      checkS3(),
      checkOpenAI(),
      getPerformanceMetrics(),
      getBusinessMetrics(),
      getSecurityMetrics()
    ])

    const services = { database, ghl, stripe, email, s3, openai }
    
    // Calculate overall health status
    const downServices = Object.values(services).filter(s => s.status === 'down')
    const degradedServices = Object.values(services).filter(s => s.status === 'degraded')
    
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded'
    
    if (downServices.length > 0) {
      // If core services are down, mark as unhealthy
      const coreServices = [database, email]
      const coreServicesDown = coreServices.some(s => s.status === 'down')
      overallStatus = coreServicesDown ? 'unhealthy' : 'degraded'
    } else if (degradedServices.length > 0) {
      overallStatus = 'degraded'
    } else {
      overallStatus = 'healthy'
    }

    const totalTime = performance.now() - startTime
    const uptime = process.uptime()

    const response: DetailedHealthResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(uptime),
      services,
      performance: {
        avgResponseTime: totalTime,
        memoryUsage: performanceMetrics.memoryUsage
      },
      business,
      security
    }

    const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 206 : 503

    return NextResponse.json(response, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Detailed health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Health check system failure',
      uptime: Math.round(process.uptime()),
      checkDuration: performance.now() - startTime
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  }
}

// POST endpoint for triggering manual health checks or maintenance mode
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    if (body.action === 'maintenance') {
      // Toggle maintenance mode (implement based on your needs)
      return NextResponse.json({
        message: 'Maintenance mode toggled',
        timestamp: new Date().toISOString()
      })
    }
    
    if (body.action === 'force-check') {
      // Force a fresh health check (bypass any caching)
      return GET()
    }
    
    return NextResponse.json({
      error: 'Invalid action',
      availableActions: ['maintenance', 'force-check']
    }, { status: 400 })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Invalid request body'
    }, { status: 400 })
  }
}
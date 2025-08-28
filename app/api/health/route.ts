import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Health check endpoints
export async function GET() {
  const startTime = Date.now()

  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'up',
          responseTime: `${responseTime}ms`
        },
        api: {
          status: 'up',
          responseTime: `${responseTime}ms`
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'down',
          error: 'Database connection failed'
        },
        api: {
          status: 'up',
          responseTime: `${Date.now() - startTime}ms`
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }, { status: 503 })
  }
}

// Detailed health check
export async function POST() {
  const startTime = Date.now()

  try {
    // Test database with a more complex query
    const userCount = await prisma.user.count()
    const caseCount = await prisma.case.count()
    const documentCount = await prisma.document.count()

    const responseTime = Date.now() - startTime

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      detailed: true,
      checks: {
        database: {
          status: 'up',
          responseTime: `${responseTime}ms`,
          metrics: {
            users: userCount,
            cases: caseCount,
            documents: documentCount
          }
        },
        api: {
          status: 'up',
          responseTime: `${responseTime}ms`
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })

  } catch (error) {
    console.error('Detailed health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      detailed: true,
      checks: {
        database: {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown database error'
        },
        api: {
          status: 'up',
          responseTime: `${Date.now() - startTime}ms`
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }, { status: 503 })
  }
}
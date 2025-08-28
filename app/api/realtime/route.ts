import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Simple realtime endpoint for deployment
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Return a simple SSE stream for realtime updates
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'connected',
            timestamp: new Date().toISOString(),
            message: 'Realtime connection established'
          })}\n\n`)
        )

        // Send periodic heartbeat
        const interval = setInterval(() => {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`)
            )
          } catch (error) {
            clearInterval(interval)
          }
        }, 30000) // Every 30 seconds

        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })

  } catch (error) {
    console.error('Realtime connection error:', error)
    return NextResponse.json(
      { error: 'Realtime service temporarily unavailable' },
      { status: 500 }
    )
  }
}

// POST endpoint for publishing events (disabled for deployment)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Log the event (in production, you'd typically use a message queue)
    console.log('Realtime event received:', body)

    return NextResponse.json({
      success: true,
      message: 'Event received (realtime publishing temporarily disabled for deployment)',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Realtime event error:', error)
    return NextResponse.json(
      { error: 'Realtime event service temporarily unavailable' },
      { status: 500 }
    )
  }
}
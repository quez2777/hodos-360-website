import { NextRequest, NextResponse } from 'next/server'
import { ChatSessionManager, chatService } from '@/lib/ai/chat-service'
import { AIError } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string().optional(),
  context: z.enum(['general', 'legal', 'marketing', 'video']).optional(),
  stream: z.boolean().optional(),
})

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// Main chat endpoint
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request
    const body = await req.json()
    const validatedData = chatRequestSchema.parse(body)
    
    const { message, sessionId, context = 'general', stream = false } = validatedData

    // Get or create session
    let session = sessionId ? ChatSessionManager.getSession(sessionId) : null
    
    if (!session) {
      // Create new session with context-specific system prompt
      const systemPrompt = getSystemPrompt(context)
      session = chatService.createSession({ systemPrompt })
    }

    // Handle streaming response
    if (stream) {
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Send initial message
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
            )

            // Stream the response
            let fullResponse = ''
            for await (const chunk of session.streamMessage(message)) {
              fullResponse += chunk
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'content', content: chunk })}\n\n`)
              )
            }

            // Send completion message
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
            )
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            // Send error message
            const errorMessage = error instanceof AIError 
              ? error.message 
              : 'An error occurred while processing your request'
            
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
            )
            controller.close()
          }
        },
      })

      return new Response(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Handle non-streaming response
    const response = await session.sendMessage(message)
    
    // Clean up old sessions periodically
    if (Math.random() < 0.1) {
      ChatSessionManager.clearInactiveSessions()
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          message: response.content,
          sessionId: session.getMessages()[0]?.id.split('_')[1] || 'new',
          timestamp: response.timestamp,
          metadata: response.metadata,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Chat API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400, headers: corsHeaders }
      )
    }

    if (error instanceof AIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.statusCode, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Context-specific system prompts
function getSystemPrompt(context: string): string {
  switch (context) {
    case 'legal':
      return `You are HODOS Legal AI, an advanced legal assistant specializing in:
- Case law research and analysis
- Contract review and drafting
- Legal document preparation
- Litigation strategy
- Compliance guidance

You provide accurate, professional legal technology assistance while maintaining strict confidentiality.
Always clarify that you provide legal technology tools, not legal advice, and users should consult with licensed attorneys.`

    case 'marketing':
      return `You are HODOS Marketing AI, specializing in law firm marketing:
- SEO optimization for legal websites
- Content marketing strategies
- PPC campaign management
- Social media for law firms
- Lead generation tactics
- Brand positioning

You help law firms attract and convert more clients through data-driven marketing strategies.`

    case 'video':
      return `You are HODOS Video AI, specializing in video communication for law firms:
- Video content strategy
- Client testimonial production
- Educational video scripts
- Virtual consultation setup
- Video SEO optimization
- Live streaming for legal events

You help law firms leverage video to build trust and engage with clients.`

    default:
      return `You are HODOS AI, an intelligent assistant powered by HODOS 360's suite of legal technology solutions.
You help law firms with:
- AI-powered practice management
- Marketing and client acquisition
- Document automation
- Video communication
- Process optimization

You're professional, helpful, and focused on delivering value through innovative legal technology.`
  }
}

// Additional specialized endpoints

// Legal document analysis endpoint
export async function POST_document(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const analysisType = formData.get('type') as string || 'full'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400, headers: corsHeaders }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Use the legal chat service for document analysis
    const analysis = await chatService.legal.analyzeLegalDocument(
      buffer.toString('utf-8')
    )

    return NextResponse.json(
      {
        success: true,
        data: analysis,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze document',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Legal research endpoint
export async function POST_research(req: NextRequest) {
  try {
    const { query, jurisdiction } = await req.json()

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'No query provided' },
        { status: 400, headers: corsHeaders }
      )
    }

    const research = await chatService.legal.performLegalResearch(query, jurisdiction)

    return NextResponse.json(
      {
        success: true,
        data: research,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Legal research error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform legal research',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Brief generation endpoint
export async function POST_brief(req: NextRequest) {
  try {
    const caseDetails = await req.json()

    const brief = await chatService.legal.generateLegalBrief(caseDetails)

    return NextResponse.json(
      {
        success: true,
        data: {
          content: brief,
          format: 'markdown',
          timestamp: new Date(),
        },
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Brief generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate brief',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
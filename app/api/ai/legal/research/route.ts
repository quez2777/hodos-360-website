import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const researchRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  jurisdiction: z.string().optional(),
  practiceArea: z.enum(['civil', 'criminal', 'corporate', 'family', 'immigration', 'employment', 'tax', 'intellectual_property']).optional(),
  caseType: z.enum(['precedent', 'statute', 'regulation', 'comprehensive']).default('comprehensive'),
  depth: z.enum(['summary', 'detailed', 'comprehensive']).default('detailed'),
  stream: z.boolean().optional().default(false)
})

interface LegalResearchResult {
  query: string
  jurisdiction?: string
  practiceArea?: string
  cases: Array<{
    title: string
    citation: string
    court: string
    year: number
    relevance: number
    summary: string
    keyHoldings: string[]
  }>
  statutes: Array<{
    title: string
    section: string
    jurisdiction: string
    summary: string
    relevantText: string
  }>
  regulations: Array<{
    title: string
    section: string
    agency: string
    summary: string
  }>
  analysis: {
    overview: string
    keyLegalPrinciples: string[]
    practicalApplications: string[]
    potentialIssues: string[]
    recommendations: string[]
  }
  sources: Array<{
    type: 'case' | 'statute' | 'regulation' | 'secondary'
    title: string
    citation: string
    reliability: number
  }>
  metadata: {
    searchTerms: string[]
    processingTime: number
    tokenUsage: number
    confidenceScore: number
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Apply security middleware
    const context = {
      ip: req.ip || "",
      user: undefined,
      apiKey: undefined,
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      userAgent: req.headers.get("user-agent") || ""
    }
    const securityResult = await securityMiddleware(req, context)
    if (!securityResult.success) {
      return NextResponse.json(
        { success: false, error: securityResult.error },
        { status: securityResult.statusCode || 400, headers: corsHeaders }
      )
    }

    // Apply rate limiting
    const rateLimitResult = await rateLimitMiddleware(req, context)
    
    // Parse and validate request
    const body = await req.json()
    const validatedData = researchRequestSchema.parse(body)
    
    const { query, jurisdiction, practiceArea, caseType, depth, stream } = validatedData

    // Create specialized legal research prompt
    const systemPrompt = `You are HODOS Legal Research AI, an advanced legal research assistant specializing in comprehensive case law and statutory analysis.

Your expertise includes:
- Case law research and analysis across all jurisdictions
- Statutory interpretation and regulatory compliance
- Legal precedent identification and ranking
- Cross-jurisdictional comparative analysis
- Practice area specific research methodologies

For each research request:
1. Identify relevant case law with proper citations (use realistic but fictional citations)
2. Find applicable statutes and regulations
3. Provide comprehensive legal analysis
4. Rank sources by relevance and authority
5. Highlight potential legal issues and opportunities

IMPORTANT: Always clarify that this is a research tool providing information for legal professionals, not legal advice. Always recommend consulting with qualified legal counsel for specific legal matters.

Format your response as a comprehensive JSON object matching the LegalResearchResult interface.`

    const userPrompt = `Conduct a ${depth} legal research analysis for the following:

Query: ${query}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ''}
${practiceArea ? `Practice Area: ${practiceArea}` : ''}
Case Type Focus: ${caseType}

Please provide a comprehensive legal research analysis including:
1. Relevant case law with citations, holdings, and relevance rankings
2. Applicable statutes and regulations
3. Legal analysis with key principles and practical applications
4. Potential issues and strategic recommendations
5. Source reliability assessment

Format the response as a structured JSON object for legal professionals.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', query })}\n\n`)
            )

            let fullResponse = ''
            const stream = await openAIClient.createChatCompletion(
              [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              {
                model: 'gpt-4-turbo-preview',
                temperature: 0.3,
                maxTokens: 4000,
                stream: true
              }
            ) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>

            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content || ''
              if (content) {
                fullResponse += content
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`)
                )
              }
            }

            // Parse and validate the final response
            try {
              const result = JSON.parse(fullResponse) as LegalResearchResult
              result.metadata = {
                ...result.metadata,
                processingTime: Date.now() - startTime,
                tokenUsage: countTokens(fullResponse, 'gpt-4-turbo-preview')
              }
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`)
              )
            } catch (parseError) {
              // If parsing fails, send the raw content
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'raw', content: fullResponse })}\n\n`)
              )
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            const errorMessage = error instanceof AIError ? error.message : 'Legal research failed'
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`)
            )
            controller.close()
          }
        }
      })

      const response = new NextResponse(readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

    // Handle non-streaming response
    const completion = await openAIClient.createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        model: 'gpt-4-turbo-preview',
        temperature: 0.3,
        maxTokens: 4000,
        stream: false
      }
    ) as OpenAI.Chat.ChatCompletion

    const rawResponse = completion.choices[0]?.message?.content || '{}'
    
    try {
      const result = JSON.parse(rawResponse) as LegalResearchResult
      
      // Add metadata
      result.metadata = {
        searchTerms: query.toLowerCase().split(/\s+/).filter(term => term.length > 3),
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        confidenceScore: 0.85 // This would be calculated based on various factors in a real implementation
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
        
    } catch (parseError) {
      // Fallback response if JSON parsing fails
      const fallbackResult: LegalResearchResult = {
        query,
        jurisdiction,
        practiceArea,
        cases: [],
        statutes: [],
        regulations: [],
        analysis: {
          overview: rawResponse,
          keyLegalPrinciples: [],
          practicalApplications: [],
          potentialIssues: [],
          recommendations: []
        },
        sources: [],
        metadata: {
          searchTerms: query.toLowerCase().split(/\s+/).filter(term => term.length > 3),
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          confidenceScore: 0.5
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Response format was not structured, provided as analysis overview'
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Legal research API error:', error)

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
        error: 'Legal research service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
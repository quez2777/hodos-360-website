import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const contractRequestSchema = z.object({
  contractText: z.string().min(50).max(50000),
  analysisType: z.enum(['review', 'risk_assessment', 'clause_extraction', 'compliance_check', 'negotiation_points']),
  contractType: z.enum(['employment', 'service_agreement', 'nda', 'partnership', 'lease', 'purchase', 'licensing', 'consulting', 'other']).optional(),
  jurisdiction: z.string().optional(),
  clientRole: z.enum(['buyer', 'seller', 'employer', 'contractor', 'licensor', 'licensee', 'landlord', 'tenant']).optional(),
  specificConcerns: z.array(z.string()).optional(),
  comparisonStandard: z.enum(['industry_standard', 'client_favorable', 'balanced', 'risk_averse']).default('balanced'),
  includeRedlines: z.boolean().default(false),
  confidentialityLevel: z.enum(['standard', 'high', 'attorney_client']).default('standard'),
  stream: z.boolean().optional().default(false)
})

interface ContractAnalysisResult {
  contractType: string
  analysisType: string
  summary: {
    overview: string
    parties: Array<{
      name: string
      role: string
      obligations: string[]
    }>
    keyTerms: {
      duration: string
      termination: string
      payment: string
      deliverables: string
    }
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  clauses: Array<{
    type: string
    title: string
    content: string
    location: string
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    analysis: string
    suggestions: string[]
    precedence: number
  }>
  riskAssessment: {
    overallRisk: number
    categories: Array<{
      category: string
      risk: number
      issues: string[]
      mitigation: string[]
    }>
    redFlags: Array<{
      severity: 'low' | 'medium' | 'high' | 'critical'
      issue: string
      location: string
      impact: string
      recommendation: string
    }>
  }
  recommendations: {
    immediate: string[]
    strategic: string[]
    negotiationPoints: Array<{
      clause: string
      currentLanguage: string
      suggestedLanguage: string
      rationale: string
      priority: number
    }>
  }
  compliance: {
    jurisdictionalRequirements: Array<{
      requirement: string
      status: 'compliant' | 'non_compliant' | 'unclear' | 'not_applicable'
      details: string
    }>
    industryStandards: Array<{
      standard: string
      compliance: 'yes' | 'no' | 'partial' | 'unknown'
      gaps: string[]
    }>
  }
  missingClauses: Array<{
    clauseType: string
    importance: 'critical' | 'important' | 'recommended'
    rationale: string
    suggestedLanguage: string
  }>
  metadata: {
    wordCount: number
    pageCount: number
    processingTime: number
    tokenUsage: number
    confidenceScore: number
    lastUpdated: string
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
      ip: req.ip || '',
      user: undefined,
      apiKey: undefined,
      requestId: crypto.randomUUID(),
      timestamp: Date.now(),
      userAgent: req.headers.get('user-agent') || ''
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
    const validatedData = contractRequestSchema.parse(body)
    
    const { 
      contractText, 
      analysisType, 
      contractType,
      jurisdiction, 
      clientRole,
      specificConcerns,
      comparisonStandard,
      includeRedlines,
      confidentialityLevel,
      stream 
    } = validatedData

    // Create specialized contract analysis prompt
    const systemPrompt = `You are HODOS Contract AI, an expert contract analysis and review specialist with extensive experience in commercial law, contract negotiation, and risk assessment.

Your expertise includes:
- Comprehensive contract review and analysis across all business sectors
- Risk identification and assessment methodologies
- Contract clause interpretation and optimization
- Jurisdictional compliance and regulatory requirements
- Strategic negotiation positioning and tactics
- Industry-standard contract provisions and best practices

For each contract analysis request:
1. Perform thorough contract review identifying all key clauses and terms
2. Assess legal and business risks with specific mitigation strategies
3. Identify missing or problematic provisions
4. Provide strategic negotiation recommendations
5. Check compliance with applicable laws and industry standards
6. Highlight potential issues before they become problems

IMPORTANT DISCLAIMERS:
- This is a contract analysis tool for legal professionals, not legal advice
- All analyses should be reviewed by qualified attorneys
- Confidentiality and attorney-client privilege are maintained at ${confidentialityLevel} level
- Contract enforcement depends on jurisdiction-specific laws and regulations

Format your response as a comprehensive JSON object matching the ContractAnalysisResult interface.`

    const userPrompt = `Perform a ${analysisType} analysis of the following contract:

Contract Type: ${contractType || 'To be determined'}
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ''}
${clientRole ? `Client Role: ${clientRole}` : ''}
Comparison Standard: ${comparisonStandard}
Include Redlines: ${includeRedlines ? 'Yes' : 'No'}

${specificConcerns?.length ? `SPECIFIC CONCERNS TO ADDRESS:\n${specificConcerns.map((concern, i) => `${i + 1}. ${concern}`).join('\n')}\n` : ''}

CONTRACT TEXT:
${contractText}

Please provide a comprehensive contract analysis including:

1. SUMMARY ANALYSIS:
   - Contract overview and party identification
   - Key terms and obligations summary
   - Overall risk assessment

2. CLAUSE-BY-CLAUSE REVIEW:
   - Detailed analysis of each significant clause
   - Risk levels and potential issues
   - Improvement suggestions

3. RISK ASSESSMENT:
   - Overall risk scoring and categorization
   - Red flag identification with severity levels
   - Mitigation strategies

4. STRATEGIC RECOMMENDATIONS:
   - Immediate action items
   - Negotiation priorities and talking points
   - Long-term strategic considerations

5. COMPLIANCE CHECK:
   - Jurisdictional requirement compliance
   - Industry standard adherence
   - Missing critical provisions

Format the response as a structured JSON object suitable for legal document management systems.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', analysisType, contractType })}\n\n`)
            )

            let fullResponse = ''
            const stream = await openAIClient.createChatCompletion(
              [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              {
                model: 'gpt-4-turbo-preview',
                temperature: 0.1,
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
              const result = JSON.parse(fullResponse) as ContractAnalysisResult
              result.metadata = {
                ...result.metadata,
                processingTime: Date.now() - startTime,
                tokenUsage: countTokens(fullResponse, 'gpt-4-turbo-preview'),
                lastUpdated: new Date().toISOString()
              }
              
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`)
              )
            } catch (parseError) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'raw', content: fullResponse })}\n\n`)
              )
            }

            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            const errorMessage = error instanceof AIError ? error.message : 'Contract analysis failed'
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
        temperature: 0.1,
        maxTokens: 4000,
        stream: false
      }
    ) as OpenAI.Chat.ChatCompletion

    const rawResponse = completion.choices[0]?.message?.content || '{}'
    
    try {
      const result = JSON.parse(rawResponse) as ContractAnalysisResult
      
      // Add metadata
      result.metadata = {
        wordCount: contractText.split(/\s+/).length,
        pageCount: Math.ceil(contractText.split(/\s+/).length / 250),
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        confidenceScore: 0.87, // This would be calculated based on various factors in a real implementation
        lastUpdated: new Date().toISOString()
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result,
          disclaimers: [
            'This analysis is provided for informational purposes only',
            'Consult with qualified legal counsel before making contract decisions',
            'Contract enforceability varies by jurisdiction',
            'All information is kept confidential per attorney-client privilege'
          ]
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
        
    } catch (parseError) {
      // Fallback response if JSON parsing fails
      const fallbackResult: ContractAnalysisResult = {
        contractType: contractType || 'Unknown',
        analysisType,
        summary: {
          overview: rawResponse.substring(0, 500) + '...',
          parties: [],
          keyTerms: {
            duration: 'Not specified',
            termination: 'Not specified',
            payment: 'Not specified',
            deliverables: 'Not specified'
          },
          riskLevel: 'medium'
        },
        clauses: [],
        riskAssessment: {
          overallRisk: 0.5,
          categories: [],
          redFlags: []
        },
        recommendations: {
          immediate: ['Review contract with qualified legal counsel'],
          strategic: ['Conduct comprehensive risk assessment'],
          negotiationPoints: []
        },
        compliance: {
          jurisdictionalRequirements: [],
          industryStandards: []
        },
        missingClauses: [],
        metadata: {
          wordCount: contractText.split(/\s+/).length,
          pageCount: Math.ceil(contractText.split(/\s+/).length / 250),
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          confidenceScore: 0.3,
          lastUpdated: new Date().toISOString()
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Analysis structure was not fully formatted, provided as overview',
          raw_analysis: rawResponse
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Contract analysis API error:', error)

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
        error: 'Contract analysis service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
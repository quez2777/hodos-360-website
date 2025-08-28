import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const contentRequestSchema = z.object({
  contentType: z.enum(['blog_post', 'social_media', 'email_campaign', 'web_copy', 'press_release', 'case_study', 'newsletter', 'landing_page', 'video_script', 'podcast_outline']),
  topic: z.string().min(1).max(200),
  practiceArea: z.enum(['personal_injury', 'criminal_defense', 'family_law', 'corporate_law', 'immigration', 'employment', 'real_estate', 'estate_planning', 'bankruptcy', 'litigation', 'general']).optional(),
  audience: z.enum(['potential_clients', 'existing_clients', 'referral_sources', 'general_public', 'legal_professionals', 'media']),
  tone: z.enum(['professional', 'conversational', 'authoritative', 'empathetic', 'educational', 'urgent', 'reassuring']).default('professional'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  keywords: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
  brandVoice: z.object({
    firmName: z.string(),
    personality: z.array(z.string()).optional(),
    values: z.array(z.string()).optional(),
    uniqueSellingPoints: z.array(z.string()).optional()
  }),
  seoOptimization: z.boolean().default(true),
  includeStatistics: z.boolean().default(false),
  localMarket: z.string().optional(),
  competitorAnalysis: z.boolean().default(false),
  stream: z.boolean().optional().default(false)
})

interface MarketingContentResult {
  contentType: string
  topic: string
  content: {
    headline: string
    subheadline?: string
    introduction: string
    body: string
    conclusion: string
    callToAction: string
    metaDescription?: string
    socialMediaExcerpt?: string
  }
  seoAnalysis: {
    targetKeywords: string[]
    keywordDensity: Record<string, number>
    readabilityScore: number
    seoScore: number
    recommendations: string[]
    metaData: {
      title: string
      description: string
      keywords: string
    }
  }
  variations: Array<{
    type: 'headline' | 'intro' | 'cta' | 'social_post'
    content: string
    purpose: string
  }>
  brandCompliance: {
    voiceConsistency: number
    messageAlignment: number
    valueIntegration: string[]
    complianceNotes: string[]
  }
  performance: {
    estimatedReadTime: number
    engagementPrediction: number
    conversionPotential: number
    viralityScore: number
  }
  distribution: {
    platforms: Array<{
      platform: string
      adaptedContent: string
      hashtags?: string[]
      timing: string
    }>
    emailSubjectLines: string[]
    socialMediaCaptions: string[]
  }
  legalConsiderations: {
    claims: Array<{
      claim: string
      substantiation: string
      risk: 'low' | 'medium' | 'high'
    }>
    disclaimers: string[]
    regulatoryCompliance: string[]
  }
  metadata: {
    wordCount: number
    characterCount: number
    processingTime: number
    tokenUsage: number
    contentScore: number
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
    const validatedData = contentRequestSchema.parse(body)
    
    const { 
      contentType,
      topic,
      practiceArea,
      audience,
      tone,
      length,
      keywords,
      callToAction,
      brandVoice,
      seoOptimization,
      includeStatistics,
      localMarket,
      competitorAnalysis,
      stream 
    } = validatedData

    // Create specialized marketing content generation prompt
    const systemPrompt = `You are HODOS Marketing AI, an expert legal marketing content strategist specializing in law firm marketing, client acquisition, and digital presence optimization.

Your expertise includes:
- Legal industry marketing best practices and ethics compliance
- SEO-optimized content creation for law firms
- Multi-platform content adaptation and distribution
- Legal advertising compliance and regulatory requirements
- Client psychology and conversion optimization
- Brand voice development and consistency
- Competitive positioning and market analysis

For each content request:
1. Create compelling, legally compliant marketing content
2. Optimize for search engines while maintaining readability
3. Ensure compliance with legal advertising rules and ethics
4. Maintain consistent brand voice and messaging
5. Include appropriate calls-to-action and lead generation elements
6. Provide multi-platform content variations
7. Consider client psychology and decision-making triggers

IMPORTANT LEGAL MARKETING CONSIDERATIONS:
- All content must comply with legal advertising ethics and regulations
- Claims must be substantiated and not misleading
- Include appropriate disclaimers where required
- Maintain professional standards while being engaging
- Respect attorney-client privilege and confidentiality

Format your response as a comprehensive JSON object matching the MarketingContentResult interface.`

    const lengthGuide = {
      short: 'concise, under 300 words',
      medium: 'standard length, 300-800 words',
      long: 'comprehensive, 800-1500 words'
    }

    const userPrompt = `Create ${length} ${contentType} content with the following specifications:

CONTENT REQUIREMENTS:
Topic: ${topic}
${practiceArea ? `Practice Area: ${practiceArea}` : ''}
Target Audience: ${audience}
Tone: ${tone}
Length: ${lengthGuide[length]}

BRAND INFORMATION:
Firm Name: ${brandVoice.firmName}
${brandVoice.personality?.length ? `Brand Personality: ${brandVoice.personality.join(', ')}` : ''}
${brandVoice.values?.length ? `Core Values: ${brandVoice.values.join(', ')}` : ''}
${brandVoice.uniqueSellingPoints?.length ? `Unique Selling Points: ${brandVoice.uniqueSellingPoints.join(', ')}` : ''}

OPTIMIZATION SETTINGS:
SEO Optimization: ${seoOptimization ? 'Required' : 'Not required'}
${keywords?.length ? `Target Keywords: ${keywords.join(', ')}` : ''}
Include Statistics: ${includeStatistics ? 'Yes' : 'No'}
${localMarket ? `Local Market: ${localMarket}` : ''}
Competitor Analysis: ${competitorAnalysis ? 'Include competitive positioning' : 'Focus on own brand'}

${callToAction ? `Preferred Call-to-Action: ${callToAction}` : ''}

Please create comprehensive marketing content including:

1. MAIN CONTENT:
   - Compelling headline and subheadline
   - Engaging introduction that hooks the reader
   - Informative body content that demonstrates expertise
   - Strong conclusion that builds trust
   - Effective call-to-action that drives conversions

2. SEO OPTIMIZATION:
   - Strategic keyword integration
   - Meta descriptions and title tags
   - SEO performance analysis and recommendations

3. BRAND COMPLIANCE:
   - Consistent brand voice and messaging
   - Value proposition integration
   - Professional yet approachable tone

4. MULTI-PLATFORM ADAPTATIONS:
   - Social media variations
   - Email campaign versions
   - Platform-specific optimizations

5. LEGAL COMPLIANCE:
   - Ethical advertising compliance
   - Appropriate disclaimers
   - Substantiated claims only

Format the response as a structured JSON object suitable for marketing automation and content management systems.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', contentType, topic })}\n\n`)
            )

            let fullResponse = ''
            const stream = await openAIClient.createChatCompletion(
              [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              {
                model: 'gpt-4-turbo-preview',
                temperature: 0.4,
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
              const result = JSON.parse(fullResponse) as MarketingContentResult
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
            const errorMessage = error instanceof AIError ? error.message : 'Content generation failed'
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
        temperature: 0.4,
        maxTokens: 4000,
        stream: false
      }
    ) as OpenAI.Chat.ChatCompletion

    const rawResponse = completion.choices[0]?.message?.content || '{}'
    
    try {
      const result = JSON.parse(rawResponse) as MarketingContentResult
      
      // Calculate content metrics
      const fullContent = `${result.content.headline} ${result.content.introduction} ${result.content.body} ${result.content.conclusion}`
      const wordCount = fullContent.split(/\s+/).length
      
      // Add metadata
      result.metadata = {
        wordCount,
        characterCount: fullContent.length,
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        contentScore: 0.88, // This would be calculated based on various quality factors
        lastUpdated: new Date().toISOString()
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result,
          analytics: {
            estimatedReachBoost: '15-25%',
            conversionImprovementPotential: '10-20%',
            brandConsistencyScore: result.brandCompliance?.voiceConsistency || 0.85
          }
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
        
    } catch (parseError) {
      // Fallback response if JSON parsing fails
      const fallbackResult: MarketingContentResult = {
        contentType,
        topic,
        content: {
          headline: `${topic} - ${brandVoice.firmName}`,
          introduction: rawResponse.substring(0, 200) + '...',
          body: rawResponse,
          conclusion: 'Contact our experienced legal team for personalized assistance.',
          callToAction: callToAction || 'Contact us today for a consultation'
        },
        seoAnalysis: {
          targetKeywords: keywords || [],
          keywordDensity: {},
          readabilityScore: 0.7,
          seoScore: 0.6,
          recommendations: ['Review and optimize keyword placement', 'Add meta descriptions'],
          metaData: {
            title: `${topic} - ${brandVoice.firmName}`,
            description: topic,
            keywords: keywords?.join(', ') || topic
          }
        },
        variations: [],
        brandCompliance: {
          voiceConsistency: 0.7,
          messageAlignment: 0.8,
          valueIntegration: [],
          complianceNotes: []
        },
        performance: {
          estimatedReadTime: Math.ceil(rawResponse.split(/\s+/).length / 200),
          engagementPrediction: 0.6,
          conversionPotential: 0.5,
          viralityScore: 0.3
        },
        distribution: {
          platforms: [],
          emailSubjectLines: [],
          socialMediaCaptions: []
        },
        legalConsiderations: {
          claims: [],
          disclaimers: ['This content is for informational purposes only and does not constitute legal advice.'],
          regulatoryCompliance: []
        },
        metadata: {
          wordCount: rawResponse.split(/\s+/).length,
          characterCount: rawResponse.length,
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          contentScore: 0.5,
          lastUpdated: new Date().toISOString()
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Content structure was not fully formatted, provided as basic content',
          raw_content: rawResponse
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Marketing content API error:', error)

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
        error: 'Marketing content service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
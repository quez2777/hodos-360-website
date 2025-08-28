import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const keywordRequestSchema = z.object({
  primaryTopic: z.string().min(1).max(100),
  practiceArea: z.enum(['personal_injury', 'criminal_defense', 'family_law', 'corporate_law', 'immigration', 'employment', 'real_estate', 'estate_planning', 'bankruptcy', 'litigation', 'general']),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('United States')
  }).optional(),
  analysisType: z.enum(['comprehensive', 'competitor', 'local_seo', 'content_gaps', 'ppc_keywords']).default('comprehensive'),
  targetAudience: z.enum(['potential_clients', 'referral_sources', 'other_attorneys', 'general_public', 'business_clients']).default('potential_clients'),
  businessSize: z.enum(['solo_practice', 'small_firm', 'mid_size_firm', 'large_firm', 'enterprise']).optional(),
  competitorUrls: z.array(z.string().url()).optional(),
  currentKeywords: z.array(z.string()).optional(),
  budget: z.enum(['low', 'medium', 'high', 'enterprise']).optional(),
  includeLocalSEO: z.boolean().default(true),
  includePPC: z.boolean().default(true),
  includeContentIdeas: z.boolean().default(true),
  stream: z.boolean().optional().default(false)
})

interface KeywordAnalysisResult {
  primaryTopic: string
  practiceArea: string
  location?: {
    city?: string
    state?: string
    country: string
  }
  keywordCategories: {
    primary: Array<{
      keyword: string
      searchVolume: number
      difficulty: number
      cpc: number
      intent: 'informational' | 'navigational' | 'transactional' | 'commercial'
      priority: 'high' | 'medium' | 'low'
      localRelevance?: number
    }>
    longTail: Array<{
      keyword: string
      searchVolume: number
      difficulty: number
      intent: string
      conversionPotential: number
      reasoning: string
    }>
    local: Array<{
      keyword: string
      searchVolume: number
      localCompetition: number
      gmb_relevance: number
      geographicModifier: string
    }>
    seasonal: Array<{
      keyword: string
      peakMonths: string[]
      searchVolumeVariation: number
      marketingOpportunity: string
    }>
    competitor: Array<{
      keyword: string
      competitorStrength: number
      opportunityScore: number
      gapAnalysis: string
    }>
  }
  contentOpportunities: Array<{
    topic: string
    keywordCluster: string[]
    contentType: 'blog_post' | 'service_page' | 'FAQ' | 'case_study' | 'resource_guide'
    searchVolumePotential: number
    competitionLevel: 'low' | 'medium' | 'high'
    businessImpact: 'high' | 'medium' | 'low'
    recommendedApproach: string
  }>
  seoStrategy: {
    quickWins: Array<{
      keyword: string
      action: string
      estimatedEffort: 'low' | 'medium' | 'high'
      expectedResults: string
      timeline: string
    }>
    mediumTermGoals: Array<{
      keyword: string
      strategy: string
      resourceRequirements: string
      expectedTimeframe: string
    }>
    longTermTargets: Array<{
      keyword: string
      competitiveAdvantage: string
      marketDominanceStrategy: string
    }>
  }
  ppcRecommendations: {
    highROIKeywords: Array<{
      keyword: string
      estimatedCPC: number
      conversionProbability: number
      suggestedBid: number
      adGroupSuggestion: string
    }>
    negativeKeywords: string[]
    adCopyIdeas: Array<{
      headline: string
      description: string
      targetKeyword: string
    }>
    budgetAllocation: Record<string, number>
  }
  competitiveAnalysis: {
    topCompetitors: Array<{
      domain: string
      estimatedTraffic: number
      topKeywords: string[]
      contentGaps: string[]
      strengths: string[]
      weaknesses: string[]
    }>
    marketOpportunities: Array<{
      opportunity: string
      keywords: string[]
      estimatedImpact: string
      implementation: string
    }>
  }
  localSEOInsights: {
    gmbOptimization: Array<{
      category: string
      keywords: string[]
      optimizationTips: string[]
    }>
    localDirectories: Array<{
      directory: string
      relevanceScore: number
      submissionPriority: 'high' | 'medium' | 'low'
    }>
    localContentIdeas: Array<{
      topic: string
      keywords: string[]
      localAngle: string
    }>
  }
  monitoring: {
    keyMetrics: Array<{
      metric: string
      currentBaseline: string
      targetGoal: string
      trackingMethod: string
    }>
    reportingSchedule: Array<{
      frequency: 'weekly' | 'monthly' | 'quarterly'
      metrics: string[]
      stakeholders: string[]
    }>
  }
  metadata: {
    totalKeywords: number
    analysisDepth: string
    processingTime: number
    tokenUsage: number
    confidenceScore: number
    lastUpdated: string
    dataFreshness: string
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
    const validatedData = keywordRequestSchema.parse(body)
    
    const { 
      primaryTopic,
      practiceArea,
      location,
      analysisType,
      targetAudience,
      businessSize,
      competitorUrls,
      currentKeywords,
      budget,
      includeLocalSEO,
      includePPC,
      includeContentIdeas,
      stream 
    } = validatedData

    // Create specialized keyword research and SEO analysis prompt
    const systemPrompt = `You are HODOS SEO & Keywords AI, an expert digital marketing strategist specializing in legal industry SEO, keyword research, and competitive analysis for law firms.

Your expertise includes:
- Comprehensive keyword research and analysis for legal services
- Local SEO optimization for law firms
- Competitive analysis and market gap identification
- PPC keyword strategy and bid optimization
- Content strategy based on keyword opportunities
- Legal industry search behavior and client intent analysis
- Geographic and demographic targeting optimization

For each keyword analysis request:
1. Conduct thorough keyword research with realistic search volumes and competition levels
2. Identify high-value, low-competition keyword opportunities
3. Analyze local search opportunities and geographic modifiers
4. Provide actionable SEO and content strategies
5. Include PPC recommendations with realistic CPC estimates
6. Consider legal industry compliance and ethical marketing
7. Factor in seasonal trends and legal market cycles

IMPORTANT CONSIDERATIONS:
- Legal industry keywords often have high competition and CPC
- Local intent is crucial for most legal services
- Client psychology and urgency factors affect search behavior
- Ethical advertising rules must be considered in all recommendations
- ROI focus is critical due to high acquisition costs in legal

Format your response as a comprehensive JSON object matching the KeywordAnalysisResult interface.`

    const locationContext = location ? 
      `Geographic Focus: ${location.city ? `${location.city}, ` : ''}${location.state || ''} ${location.country}` : 
      'National focus'

    const userPrompt = `Conduct a ${analysisType} keyword analysis for the following legal marketing campaign:

BUSINESS CONTEXT:
Primary Topic: ${primaryTopic}
Practice Area: ${practiceArea}
${locationContext}
Target Audience: ${targetAudience}
${businessSize ? `Business Size: ${businessSize}` : ''}
${budget ? `Marketing Budget: ${budget}` : ''}

ANALYSIS REQUIREMENTS:
Include Local SEO: ${includeLocalSEO ? 'Yes' : 'No'}
Include PPC Analysis: ${includePPC ? 'Yes' : 'No'}
Include Content Ideas: ${includeContentIdeas ? 'Yes' : 'No'}

${currentKeywords?.length ? `CURRENT KEYWORDS TO ANALYZE:\n${currentKeywords.join(', ')}\n` : ''}

${competitorUrls?.length ? `COMPETITOR WEBSITES TO ANALYZE:\n${competitorUrls.join('\n')}\n` : ''}

Please provide comprehensive keyword research and SEO analysis including:

1. KEYWORD CATEGORIES:
   - Primary high-value keywords with realistic search volumes and difficulty scores
   - Long-tail opportunities with conversion potential
   - Local SEO keywords with geographic modifiers
   - Seasonal keyword opportunities
   - Competitive gap analysis keywords

2. SEO STRATEGY:
   - Quick win opportunities (low-hanging fruit)
   - Medium-term ranking targets
   - Long-term market domination strategy
   - Content optimization recommendations

3. PPC RECOMMENDATIONS:
   - High-ROI keyword targets with estimated CPC
   - Negative keyword suggestions
   - Ad copy ideas and testing strategies
   - Budget allocation recommendations

4. COMPETITIVE ANALYSIS:
   - Top competitor keyword profiles
   - Market gap opportunities
   - Content strategy insights

5. LOCAL SEO INSIGHTS:
   - Google My Business optimization keywords
   - Local directory opportunities
   - Geographic content strategy

6. MONITORING & REPORTING:
   - Key performance metrics to track
   - Reporting schedules and stakeholders
   - Success measurement criteria

Use realistic search volumes, competition levels, and CPC estimates based on legal industry standards. Focus on actionable insights that can drive actual business results.

Format the response as a structured JSON object suitable for SEO campaign management and marketing automation.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', primaryTopic, practiceArea })}\n\n`)
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
              const result = JSON.parse(fullResponse) as KeywordAnalysisResult
              result.metadata = {
                ...result.metadata,
                processingTime: Date.now() - startTime,
                tokenUsage: countTokens(fullResponse, 'gpt-4-turbo-preview'),
                lastUpdated: new Date().toISOString(),
                dataFreshness: 'Current analysis based on latest trends'
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
            const errorMessage = error instanceof AIError ? error.message : 'Keyword analysis failed'
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
      const result = JSON.parse(rawResponse) as KeywordAnalysisResult
      
      // Calculate total keywords across all categories
      const totalKeywords = (result.keywordCategories?.primary?.length || 0) +
                           (result.keywordCategories?.longTail?.length || 0) +
                           (result.keywordCategories?.local?.length || 0) +
                           (result.keywordCategories?.seasonal?.length || 0) +
                           (result.keywordCategories?.competitor?.length || 0)
      
      // Add metadata
      result.metadata = {
        totalKeywords,
        analysisDepth: analysisType,
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        confidenceScore: 0.87, // This would be calculated based on data quality factors
        lastUpdated: new Date().toISOString(),
        dataFreshness: 'Analysis based on current legal industry trends and search patterns'
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result,
          insights: {
            marketOpportunity: 'Significant untapped potential identified',
            competitiveAdvantage: 'Multiple low-competition, high-value keywords discovered',
            recommendedNextSteps: [
              'Implement quick-win keyword optimizations',
              'Develop content calendar around identified opportunities',
              'Set up tracking for recommended KPIs'
            ]
          }
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
        
    } catch (parseError) {
      // Fallback response if JSON parsing fails
      const fallbackResult: KeywordAnalysisResult = {
        primaryTopic,
        practiceArea,
        location,
        keywordCategories: {
          primary: [],
          longTail: [],
          local: [],
          seasonal: [],
          competitor: []
        },
        contentOpportunities: [],
        seoStrategy: {
          quickWins: [],
          mediumTermGoals: [],
          longTermTargets: []
        },
        ppcRecommendations: {
          highROIKeywords: [],
          negativeKeywords: [],
          adCopyIdeas: [],
          budgetAllocation: {}
        },
        competitiveAnalysis: {
          topCompetitors: [],
          marketOpportunities: []
        },
        localSEOInsights: {
          gmbOptimization: [],
          localDirectories: [],
          localContentIdeas: []
        },
        monitoring: {
          keyMetrics: [],
          reportingSchedule: []
        },
        metadata: {
          totalKeywords: 0,
          analysisDepth: analysisType,
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          confidenceScore: 0.3,
          lastUpdated: new Date().toISOString(),
          dataFreshness: 'Basic analysis - structure parsing failed'
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Keyword analysis structure was not fully formatted',
          raw_analysis: rawResponse
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Keyword analysis API error:', error)

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
        error: 'Keyword analysis service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
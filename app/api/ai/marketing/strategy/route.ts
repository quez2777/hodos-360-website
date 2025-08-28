import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const strategyRequestSchema = z.object({
  firmProfile: z.object({
    name: z.string().min(1).max(100),
    size: z.enum(['solo', 'small_2_10', 'medium_11_50', 'large_51_plus', 'enterprise']),
    practiceAreas: z.array(z.enum(['personal_injury', 'criminal_defense', 'family_law', 'corporate_law', 'immigration', 'employment', 'real_estate', 'estate_planning', 'bankruptcy', 'litigation', 'intellectual_property', 'tax_law'])).min(1),
    yearsInBusiness: z.number().min(0).max(100),
    currentRevenue: z.enum(['under_500k', '500k_1m', '1m_5m', '5m_10m', '10m_plus', 'prefer_not_to_say']).optional(),
    targetRevenue: z.enum(['maintain', 'grow_25', 'grow_50', 'grow_100', 'grow_200_plus']).default('grow_50')
  }),
  marketContext: z.object({
    primaryLocation: z.object({
      city: z.string().min(1),
      state: z.string().min(1),
      metropolitan: z.boolean().default(true)
    }),
    serviceArea: z.enum(['local_city', 'regional_state', 'national', 'international']).default('local_city'),
    competitionLevel: z.enum(['low', 'medium', 'high', 'saturated']).optional(),
    marketPosition: z.enum(['new_entrant', 'established', 'market_leader', 'niche_specialist']).optional()
  }),
  businessGoals: z.object({
    primaryObjective: z.enum(['increase_leads', 'improve_conversion', 'brand_awareness', 'market_expansion', 'referral_growth', 'digital_transformation']),
    timeframe: z.enum(['quarter', 'year', 'two_years', 'five_years']).default('year'),
    budget: z.enum(['under_5k', '5k_15k', '15k_50k', '50k_100k', '100k_plus', 'not_determined']).optional(),
    specificMetrics: z.array(z.string()).optional()
  }),
  currentMarketing: z.object({
    hasWebsite: z.boolean().default(true),
    websiteAge: z.enum(['new', 'under_2_years', '2_5_years', 'over_5_years']).optional(),
    currentChannels: z.array(z.enum(['seo', 'ppc', 'social_media', 'email', 'referrals', 'print', 'radio', 'tv', 'content_marketing', 'networking'])).default([]),
    monthlyLeads: z.number().min(0).optional(),
    conversionRate: z.number().min(0).max(100).optional(),
    averageCaseValue: z.number().min(0).optional()
  }),
  targetAudience: z.object({
    demographics: z.array(z.enum(['young_adults', 'middle_aged', 'seniors', 'families', 'businesses', 'entrepreneurs'])).default(['middle_aged']),
    income: z.array(z.enum(['low', 'middle', 'upper_middle', 'high', 'ultra_high'])).default(['middle', 'upper_middle']),
    urgency: z.enum(['immediate', 'researching', 'planning', 'ongoing']).default('immediate'),
    decisionFactors: z.array(z.enum(['price', 'reputation', 'convenience', 'expertise', 'communication', 'results'])).default(['reputation', 'expertise'])
  }),
  challenges: z.array(z.string()).optional(),
  opportunities: z.array(z.string()).optional(),
  includeImplementation: z.boolean().default(true),
  includeBudgetBreakdown: z.boolean().default(true),
  includeTimeline: z.boolean().default(true),
  stream: z.boolean().optional().default(false)
})

interface MarketingStrategyResult {
  firmProfile: {
    name: string
    strengths: string[]
    marketPosition: string
    competitiveAdvantages: string[]
    growthPotential: string
  }
  marketAnalysis: {
    marketSize: string
    competitionLevel: string
    marketTrends: string[]
    opportunities: Array<{
      opportunity: string
      impact: 'high' | 'medium' | 'low'
      difficulty: 'low' | 'medium' | 'high'
      timeframe: string
    }>
    threats: Array<{
      threat: string
      severity: 'high' | 'medium' | 'low'
      mitigation: string
    }>
  }
  strategicRecommendations: {
    primaryStrategy: string
    coreChannels: Array<{
      channel: string
      priority: 'high' | 'medium' | 'low'
      rationale: string
      expectedROI: string
      implementation: string
    }>
    contentStrategy: {
      themes: string[]
      contentTypes: string[]
      frequency: string
      distribution: string[]
    }
    brandPositioning: {
      valueProposition: string
      differentiators: string[]
      messagingPillars: string[]
      targetSegments: string[]
    }
  }
  tacticalPlan: {
    phase1_immediate: Array<{
      tactic: string
      description: string
      timeframe: string
      budget: string
      expectedOutcome: string
      kpis: string[]
    }>
    phase2_shortTerm: Array<{
      tactic: string
      description: string
      timeframe: string
      budget: string
      expectedOutcome: string
    }>
    phase3_longTerm: Array<{
      tactic: string
      description: string
      timeframe: string
      investment: string
      projectedReturn: string
    }>
  }
  budgetAllocation: {
    totalRecommendedBudget: string
    allocation: Record<string, {
      percentage: number
      amount: string
      justification: string
    }>
    roiProjections: Record<string, {
      investment: string
      projectedReturn: string
      timeframe: string
    }>
  }
  implementationRoadmap: {
    timeline: Array<{
      month: number
      milestones: string[]
      deliverables: string[]
      budget: string
    }>
    resourceRequirements: {
      internal: string[]
      external: string[]
      tools: string[]
      training: string[]
    }
    riskMitigation: Array<{
      risk: string
      probability: 'high' | 'medium' | 'low'
      impact: 'high' | 'medium' | 'low'
      mitigation: string
    }>
  }
  metrics: {
    kpis: Array<{
      metric: string
      baseline: string
      target: string
      trackingMethod: string
      reportingFrequency: string
    }>
    attribution: {
      model: string
      tools: string[]
      methodology: string
    }
    reporting: {
      dashboards: string[]
      stakeholders: string[]
      frequency: string
    }
  }
  competitiveStrategy: {
    positioning: string
    differentiationStrategy: string
    competitiveAdvantages: string[]
    marketingMix: {
      product: string
      price: string
      place: string
      promotion: string
    }
  }
  legalConsiderations: {
    complianceRequirements: string[]
    ethicalGuidelines: string[]
    disclaimers: string[]
    regulatoryUpdates: string[]
  }
  metadata: {
    analysisDate: string
    strategyHorizon: string
    confidenceLevel: number
    processingTime: number
    tokenUsage: number
    nextReviewDate: string
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
    const validatedData = strategyRequestSchema.parse(body)
    
    const { 
      firmProfile,
      marketContext,
      businessGoals,
      currentMarketing,
      targetAudience,
      challenges,
      opportunities,
      includeImplementation,
      includeBudgetBreakdown,
      includeTimeline,
      stream 
    } = validatedData

    // Create specialized marketing strategy development prompt
    const systemPrompt = `You are HODOS Marketing Strategy AI, a senior marketing strategist specializing in comprehensive marketing strategy development for law firms across all practice areas and market sizes.

Your expertise includes:
- Strategic marketing planning and business growth for legal services
- Market analysis and competitive positioning for law firms
- Multi-channel marketing integration and optimization
- Legal industry compliance and ethical marketing standards
- ROI-focused budget allocation and performance measurement
- Digital transformation and technology adoption for legal practices
- Client acquisition funnel optimization and conversion strategy

For each marketing strategy request:
1. Conduct comprehensive market and competitive analysis
2. Develop integrated, multi-channel marketing strategies
3. Create detailed implementation roadmaps with clear timelines
4. Provide realistic budget allocations and ROI projections
5. Include legal industry compliance and ethical considerations
6. Focus on measurable outcomes and performance tracking
7. Consider firm size, resources, and growth stage in recommendations

IMPORTANT STRATEGIC CONSIDERATIONS:
- Legal marketing must comply with bar association rules and ethics
- Client acquisition costs in legal are typically high but lifetime value is significant  
- Referral marketing and reputation management are crucial in legal
- Local market dominance often matters more than national presence
- Trust and credibility are the primary conversion factors
- Legal buying cycles can be long and relationship-based

Format your response as a comprehensive JSON object matching the MarketingStrategyResult interface.`

    const userPrompt = `Develop a comprehensive marketing strategy for the following law firm:

FIRM PROFILE:
Name: ${firmProfile.name}
Size: ${firmProfile.size}
Practice Areas: ${firmProfile.practiceAreas.join(', ')}
Years in Business: ${firmProfile.yearsInBusiness}
Current Revenue: ${firmProfile.currentRevenue || 'Not disclosed'}
Revenue Target: ${firmProfile.targetRevenue}

MARKET CONTEXT:
Location: ${marketContext.primaryLocation.city}, ${marketContext.primaryLocation.state}
Service Area: ${marketContext.serviceArea}
Market Type: ${marketContext.primaryLocation.metropolitan ? 'Metropolitan' : 'Non-metropolitan'}
${marketContext.competitionLevel ? `Competition Level: ${marketContext.competitionLevel}` : ''}
${marketContext.marketPosition ? `Current Position: ${marketContext.marketPosition}` : ''}

BUSINESS GOALS:
Primary Objective: ${businessGoals.primaryObjective}
Timeframe: ${businessGoals.timeframe}
${businessGoals.budget ? `Budget Range: ${businessGoals.budget}` : ''}
${businessGoals.specificMetrics?.length ? `Target Metrics: ${businessGoals.specificMetrics.join(', ')}` : ''}

CURRENT MARKETING:
Website: ${currentMarketing.hasWebsite ? 'Yes' : 'No'}
${currentMarketing.websiteAge ? `Website Age: ${currentMarketing.websiteAge}` : ''}
Current Channels: ${currentMarketing.currentChannels.join(', ') || 'None specified'}
${currentMarketing.monthlyLeads ? `Monthly Leads: ${currentMarketing.monthlyLeads}` : ''}
${currentMarketing.conversionRate ? `Conversion Rate: ${currentMarketing.conversionRate}%` : ''}
${currentMarketing.averageCaseValue ? `Average Case Value: $${currentMarketing.averageCaseValue}` : ''}

TARGET AUDIENCE:
Demographics: ${targetAudience.demographics.join(', ')}
Income Levels: ${targetAudience.income.join(', ')}
Urgency: ${targetAudience.urgency}
Decision Factors: ${targetAudience.decisionFactors.join(', ')}

${challenges?.length ? `CURRENT CHALLENGES:\n${challenges.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n` : ''}
${opportunities?.length ? `IDENTIFIED OPPORTUNITIES:\n${opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n` : ''}

DELIVERABLES REQUESTED:
Implementation Plan: ${includeImplementation ? 'Yes' : 'No'}
Budget Breakdown: ${includeBudgetBreakdown ? 'Yes' : 'No'}
Timeline: ${includeTimeline ? 'Yes' : 'No'}

Please develop a comprehensive marketing strategy including:

1. MARKET ANALYSIS:
   - Market size and opportunity assessment
   - Competitive landscape analysis
   - Market trends and future outlook

2. STRATEGIC RECOMMENDATIONS:
   - Primary marketing strategy and positioning
   - Channel prioritization and integration
   - Content and messaging strategy
   - Brand differentiation approach

3. TACTICAL EXECUTION PLAN:
   - Phase-by-phase implementation approach
   - Specific tactics and campaigns
   - Resource requirements and timelines

4. BUDGET AND ROI:
   - Realistic budget allocation across channels
   - Expected return on investment projections
   - Performance measurement framework

5. IMPLEMENTATION ROADMAP:
   - Detailed timeline with milestones
   - Risk assessment and mitigation
   - Success metrics and KPIs

6. LEGAL COMPLIANCE:
   - Ethical marketing considerations
   - Regulatory compliance requirements
   - Professional standards adherence

Focus on actionable insights that can drive measurable business growth while maintaining ethical standards and professional integrity.

Format the response as a structured JSON object suitable for strategic planning and execution management.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', firmName: firmProfile.name, objective: businessGoals.primaryObjective })}\n\n`)
            )

            let fullResponse = ''
            const stream = await openAIClient.createChatCompletion(
              [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              {
                model: 'gpt-4-turbo-preview',
                temperature: 0.2,
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
              const result = JSON.parse(fullResponse) as MarketingStrategyResult
              result.metadata = {
                ...result.metadata,
                processingTime: Date.now() - startTime,
                tokenUsage: countTokens(fullResponse, 'gpt-4-turbo-preview'),
                analysisDate: new Date().toISOString(),
                nextReviewDate: new Date(Date.now() + (businessGoals.timeframe === 'quarter' ? 90 : 365) * 24 * 60 * 60 * 1000).toISOString()
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
            const errorMessage = error instanceof AIError ? error.message : 'Marketing strategy development failed'
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
        temperature: 0.2,
        maxTokens: 4000,
        stream: false
      }
    ) as OpenAI.Chat.ChatCompletion

    const rawResponse = completion.choices[0]?.message?.content || '{}'
    
    try {
      const result = JSON.parse(rawResponse) as MarketingStrategyResult
      
      // Add metadata
      const nextReviewDate = new Date()
      nextReviewDate.setMonth(nextReviewDate.getMonth() + (businessGoals.timeframe === 'quarter' ? 3 : 12))
      
      result.metadata = {
        analysisDate: new Date().toISOString(),
        strategyHorizon: businessGoals.timeframe,
        confidenceLevel: 0.88, // Based on data quality and market analysis depth
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        nextReviewDate: nextReviewDate.toISOString()
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result,
          executiveSummary: {
            primaryRecommendation: `Focus on ${businessGoals.primaryObjective} through integrated digital marketing approach`,
            expectedOutcome: `Projected ${firmProfile.targetRevenue} revenue growth within ${businessGoals.timeframe}`,
            keySuccessFactors: [
              'Consistent brand messaging across all channels',
              'Data-driven optimization and measurement',
              'Strong local market presence and reputation',
              'Compliance with legal advertising ethics'
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
      const fallbackResult: MarketingStrategyResult = {
        firmProfile: {
          name: firmProfile.name,
          strengths: [],
          marketPosition: marketContext.marketPosition || 'To be determined',
          competitiveAdvantages: [],
          growthPotential: 'Analysis pending'
        },
        marketAnalysis: {
          marketSize: 'Analysis required',
          competitionLevel: marketContext.competitionLevel || 'Unknown',
          marketTrends: [],
          opportunities: [],
          threats: []
        },
        strategicRecommendations: {
          primaryStrategy: rawResponse.substring(0, 200) + '...',
          coreChannels: [],
          contentStrategy: {
            themes: [],
            contentTypes: [],
            frequency: 'To be determined',
            distribution: []
          },
          brandPositioning: {
            valueProposition: 'To be developed',
            differentiators: [],
            messagingPillars: [],
            targetSegments: []
          }
        },
        tacticalPlan: {
          phase1_immediate: [],
          phase2_shortTerm: [],
          phase3_longTerm: []
        },
        budgetAllocation: {
          totalRecommendedBudget: 'To be determined',
          allocation: {},
          roiProjections: {}
        },
        implementationRoadmap: {
          timeline: [],
          resourceRequirements: {
            internal: [],
            external: [],
            tools: [],
            training: []
          },
          riskMitigation: []
        },
        metrics: {
          kpis: [],
          attribution: {
            model: 'Multi-touch attribution',
            tools: [],
            methodology: 'To be defined'
          },
          reporting: {
            dashboards: [],
            stakeholders: [],
            frequency: 'Monthly'
          }
        },
        competitiveStrategy: {
          positioning: 'Analysis required',
          differentiationStrategy: 'To be developed',
          competitiveAdvantages: [],
          marketingMix: {
            product: 'Legal services',
            price: 'Competitive positioning',
            place: marketContext.serviceArea,
            promotion: 'Multi-channel approach'
          }
        },
        legalConsiderations: {
          complianceRequirements: ['Bar association advertising rules', 'State-specific legal advertising regulations'],
          ethicalGuidelines: ['Professional responsibility standards', 'Client confidentiality'],
          disclaimers: ['Attorney advertising disclaimer', 'No guarantee of results'],
          regulatoryUpdates: ['Monitor regulatory changes']
        },
        metadata: {
          analysisDate: new Date().toISOString(),
          strategyHorizon: businessGoals.timeframe,
          confidenceLevel: 0.3,
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Strategy structure was not fully formatted, provided as basic framework',
          raw_strategy: rawResponse
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Marketing strategy API error:', error)

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
        error: 'Marketing strategy service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
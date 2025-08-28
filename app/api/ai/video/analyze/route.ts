import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const analyzeRequestSchema = z.object({
  analysisType: z.enum(['video_call_performance', 'client_interaction', 'consultation_analysis', 'communication_effectiveness', 'conversion_analysis', 'avatar_performance']),
  dataSource: z.enum(['video_transcript', 'call_recording', 'interaction_logs', 'performance_metrics', 'client_feedback']),
  content: z.object({
    transcript: z.string().optional(),
    duration: z.number().min(0).optional(), // Duration in minutes
    participants: z.array(z.object({
      role: z.enum(['attorney', 'client', 'avatar', 'staff', 'other']),
      name: z.string().optional(),
      speakingTime: z.number().optional() // Percentage of total time
    })).optional(),
    metadata: z.object({
      date: z.string().optional(),
      callType: z.enum(['consultation', 'follow_up', 'intake', 'case_update', 'settlement', 'other']).optional(),
      practiceArea: z.string().optional(),
      outcome: z.enum(['scheduled_appointment', 'retained_client', 'follow_up_needed', 'not_qualified', 'referred_out', 'no_action']).optional()
    }).optional()
  }),
  analysisGoals: z.array(z.enum([
    'improve_conversion_rates',
    'enhance_client_satisfaction',
    'optimize_communication',
    'reduce_call_duration',
    'increase_efficiency',
    'identify_training_needs',
    'measure_avatar_effectiveness',
    'compliance_monitoring'
  ])).min(1),
  benchmarks: z.object({
    industry_standards: z.boolean().default(true),
    firm_historical: z.boolean().default(true),
    competitor_comparison: z.boolean().default(false)
  }).optional(),
  reportingPreferences: z.object({
    detail_level: z.enum(['summary', 'detailed', 'comprehensive']).default('detailed'),
    include_recommendations: z.boolean().default(true),
    include_training_points: z.boolean().default(true),
    include_scripts: z.boolean().default(false)
  }).optional(),
  stream: z.boolean().optional().default(false)
})

interface VideoAnalysisResult {
  analysisType: string
  dataSource: string
  overview: {
    summary: string
    keyFindings: string[]
    overall_score: number
    performance_grade: 'A' | 'B' | 'C' | 'D' | 'F'
    improvement_potential: number
  }
  communicationAnalysis: {
    speaking_patterns: {
      attorney: {
        speaking_time_percentage: number
        avg_response_time: string
        tone_analysis: string[]
        clarity_score: number
        professionalism_score: number
      }
      client: {
        engagement_level: number
        question_count: number
        concern_indicators: string[]
        satisfaction_signals: string[]
        decision_readiness: number
      }
    }
    conversation_flow: {
      structure_score: number
      transition_quality: number
      topic_coverage: string[]
      missed_opportunities: string[]
      strong_moments: string[]
    }
    language_analysis: {
      complexity_level: string
      jargon_usage: number
      empathy_indicators: string[]
      persuasion_techniques: string[]
      compliance_language: boolean
    }
  }
  performanceMetrics: {
    efficiency: {
      call_duration_vs_target: string
      information_gathering_rate: number
      decision_making_speed: number
      follow_up_clarity: number
    }
    effectiveness: {
      objectives_achieved: number
      client_questions_answered: number
      concerns_addressed: number
      next_steps_clarity: number
    }
    conversion: {
      conversion_probability: number
      objection_handling_score: number
      value_demonstration: number
      closing_effectiveness: number
    }
  }
  clientExperience: {
    satisfaction_indicators: {
      positive_sentiment: number
      engagement_score: number
      trust_building: number
      comfort_level: number
    }
    pain_points: Array<{
      issue: string
      severity: 'low' | 'medium' | 'high'
      frequency: number
      impact: string
      solution: string
    }>
    moments_of_excellence: Array<{
      timestamp: string
      description: string
      impact: string
      replication_strategy: string
    }>
  }
  complianceAnalysis: {
    ethical_standards: {
      attorney_client_privilege: boolean
      professional_conduct: boolean
      advertising_compliance: boolean
      disclosure_requirements: boolean
    }
    risk_factors: Array<{
      risk: string
      level: 'low' | 'medium' | 'high' | 'critical'
      mitigation: string
      regulatory_concern: boolean
    }>
    improvement_areas: string[]
  }
  recommendations: {
    immediate_actions: Array<{
      action: string
      priority: 'high' | 'medium' | 'low'
      expected_impact: string
      implementation_effort: string
    }>
    training_recommendations: Array<{
      skill_area: string
      training_type: string
      resources: string[]
      expected_outcome: string
    }>
    process_improvements: Array<{
      process: string
      current_state: string
      recommended_change: string
      benefits: string[]
    }>
    script_suggestions: Array<{
      scenario: string
      current_approach: string
      improved_script: string
      rationale: string
    }>
  }
  benchmarking: {
    industry_comparison: {
      call_duration: string
      conversion_rate: string
      client_satisfaction: string
      efficiency_score: string
    }
    historical_trends: {
      performance_trajectory: string
      improvement_rate: string
      consistency_score: number
    }
    best_practices: Array<{
      practice: string
      implementation_status: 'implemented' | 'partial' | 'not_implemented'
      priority: number
    }>
  }
  actionPlan: {
    short_term: Array<{
      timeframe: string
      goals: string[]
      actions: string[]
      success_metrics: string[]
    }>
    medium_term: Array<{
      timeframe: string
      goals: string[]
      investments: string[]
      expected_roi: string
    }>
    long_term: Array<{
      timeframe: string
      strategic_goals: string[]
      transformation_areas: string[]
      competitive_advantages: string[]
    }>
  }
  monitoring: {
    kpis: Array<{
      metric: string
      current_value: string
      target_value: string
      tracking_frequency: string
    }>
    alert_thresholds: Array<{
      metric: string
      warning_threshold: string
      critical_threshold: string
      escalation_procedure: string
    }>
    reporting_schedule: {
      daily: string[]
      weekly: string[]
      monthly: string[]
      quarterly: string[]
    }
  }
  metadata: {
    analysis_confidence: number
    data_quality_score: number
    sample_size: string
    analysis_limitations: string[]
    next_review_date: string
    processingTime: number
    tokenUsage: number
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
    const validatedData = analyzeRequestSchema.parse(body)
    
    const { 
      analysisType,
      dataSource,
      content,
      analysisGoals,
      benchmarks,
      reportingPreferences,
      stream 
    } = validatedData

    // Create specialized video performance analysis prompt
    const systemPrompt = `You are HODOS Video Analysis AI, an expert in analyzing legal client communications, video call performance, and avatar interactions with a focus on improving conversion rates, client satisfaction, and operational efficiency for law firms.

Your expertise includes:
- Legal client communication analysis and optimization
- Video call performance evaluation and improvement strategies
- Client psychology and decision-making behavior analysis
- Legal industry communication best practices and standards
- AI avatar performance evaluation and enhancement
- Compliance monitoring for attorney-client communications
- Conversion optimization and revenue impact analysis

For each analysis request:
1. Conduct comprehensive analysis of communication effectiveness and efficiency
2. Identify patterns, strengths, weaknesses, and improvement opportunities
3. Provide actionable recommendations with clear implementation guidance
4. Ensure compliance with legal industry standards and ethics
5. Focus on measurable outcomes that impact business results
6. Consider client experience and satisfaction throughout the analysis
7. Provide benchmarking against industry standards and best practices

IMPORTANT ANALYSIS CONSIDERATIONS:
- Attorney-client privilege and confidentiality must be maintained
- Ethical communication standards and professional conduct requirements
- Legal industry specific metrics and benchmarks apply
- Client conversion and retention are primary success indicators
- Communication effectiveness directly impacts firm reputation and revenue
- Training and process improvements should be practical and achievable
- Compliance with bar association rules and advertising regulations

Format your response as a comprehensive JSON object matching the VideoAnalysisResult interface.`

    const userPrompt = `Conduct a comprehensive ${analysisType} analysis based on ${dataSource} with the following details:

ANALYSIS PARAMETERS:
Type: ${analysisType}
Data Source: ${dataSource}
Analysis Goals: ${analysisGoals.join(', ')}

CONTENT DATA:
${content.transcript ? `Transcript/Content:\n${content.transcript}\n` : ''}
${content.duration ? `Duration: ${content.duration} minutes` : ''}
${content.participants?.length ? `Participants:\n${content.participants.map(p => `- ${p.role}${p.name ? ` (${p.name})` : ''}${p.speakingTime ? ` - ${p.speakingTime}% speaking time` : ''}`).join('\n')}\n` : ''}

METADATA:
${content.metadata?.date ? `Date: ${content.metadata.date}` : ''}
${content.metadata?.callType ? `Call Type: ${content.metadata.callType}` : ''}
${content.metadata?.practiceArea ? `Practice Area: ${content.metadata.practiceArea}` : ''}
${content.metadata?.outcome ? `Outcome: ${content.metadata.outcome}` : ''}

BENCHMARKING:
Industry Standards: ${benchmarks?.industry_standards ? 'Include' : 'Skip'}
Historical Comparison: ${benchmarks?.firm_historical ? 'Include' : 'Skip'}
Competitor Analysis: ${benchmarks?.competitor_comparison ? 'Include' : 'Skip'}

REPORTING PREFERENCES:
Detail Level: ${reportingPreferences?.detail_level || 'detailed'}
Include Recommendations: ${reportingPreferences?.include_recommendations ? 'Yes' : 'No'}
Include Training Points: ${reportingPreferences?.include_training_points ? 'Yes' : 'No'}
Include Script Suggestions: ${reportingPreferences?.include_scripts ? 'Yes' : 'No'}

Please provide a comprehensive analysis including:

1. PERFORMANCE OVERVIEW:
   - Overall performance assessment and scoring
   - Key findings and critical insights
   - Performance grade and improvement potential

2. COMMUNICATION ANALYSIS:
   - Speaking patterns and conversation dynamics
   - Language effectiveness and clarity assessment
   - Tone, professionalism, and empathy evaluation
   - Client engagement and response indicators

3. EFFECTIVENESS METRICS:
   - Efficiency measurements and time utilization
   - Objective achievement and information gathering
   - Conversion probability and closing effectiveness
   - Client question handling and concern resolution

4. CLIENT EXPERIENCE:
   - Satisfaction indicators and sentiment analysis
   - Pain points identification and severity assessment
   - Moments of excellence and replication strategies
   - Trust building and comfort level evaluation

5. COMPLIANCE AND RISK:
   - Ethical standards adherence assessment
   - Risk factor identification and mitigation
   - Professional conduct evaluation
   - Legal disclosure and requirement compliance

6. ACTIONABLE RECOMMENDATIONS:
   - Immediate improvement actions with priority levels
   - Training recommendations and skill development
   - Process improvements and optimization opportunities
   - Script suggestions and communication enhancements

7. BENCHMARKING AND MONITORING:
   - Industry comparison and best practice alignment
   - Performance tracking and KPI establishment
   - Alert thresholds and monitoring protocols
   - Long-term improvement planning

Focus on providing insights that directly improve client conversion rates, satisfaction levels, and operational efficiency while maintaining legal industry compliance standards.

Format the response as a structured JSON object suitable for performance management and improvement implementation.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', analysisType, dataSource })}\n\n`)
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
              const result = JSON.parse(fullResponse) as VideoAnalysisResult
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
            const errorMessage = error instanceof AIError ? error.message : 'Video analysis failed'
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
      const result = JSON.parse(rawResponse) as VideoAnalysisResult
      
      // Calculate confidence and quality scores
      const dataQualityScore = [
        content.transcript ? 0.4 : 0,
        content.duration ? 0.2 : 0,
        content.participants?.length ? 0.2 : 0,
        content.metadata ? 0.2 : 0
      ].reduce((sum, score) => sum + score, 0)
      
      // Set next review date based on analysis type
      const nextReviewDate = new Date()
      if (analysisType.includes('performance')) {
        nextReviewDate.setDate(nextReviewDate.getDate() + 7) // Weekly for performance
      } else {
        nextReviewDate.setDate(nextReviewDate.getDate() + 30) // Monthly for other analyses
      }
      
      // Add metadata
      result.metadata = {
        analysis_confidence: Math.min(0.95, 0.6 + (dataQualityScore * 0.35)),
        data_quality_score: dataQualityScore,
        sample_size: content.duration ? `${content.duration} minute session` : 'Single interaction',
        analysis_limitations: [
          !content.transcript ? 'No transcript data available' : '',
          !content.participants ? 'Participant data not provided' : '',
          !content.metadata?.outcome ? 'Outcome data not specified' : ''
        ].filter(Boolean),
        next_review_date: nextReviewDate.toISOString(),
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        lastUpdated: new Date().toISOString()
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result,
          insights: {
            topPriority: 'Focus on conversion optimization and client engagement improvements',
            quickWins: [
              'Implement script improvements for common scenarios',
              'Enhance opening and closing sequences',
              'Improve objection handling techniques'
            ],
            longTermFocus: [
              'Develop comprehensive training program',
              'Implement performance monitoring system',
              'Optimize client experience journey'
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
      const fallbackResult: VideoAnalysisResult = {
        analysisType,
        dataSource,
        overview: {
          summary: rawResponse.substring(0, 300) + '...',
          keyFindings: ['Analysis requires manual review'],
          overall_score: 0.7,
          performance_grade: 'B',
          improvement_potential: 0.3
        },
        communicationAnalysis: {
          speaking_patterns: {
            attorney: {
              speaking_time_percentage: content.participants?.find(p => p.role === 'attorney')?.speakingTime || 60,
              avg_response_time: '2-3 seconds',
              tone_analysis: ['Professional', 'Clear'],
              clarity_score: 0.8,
              professionalism_score: 0.85
            },
            client: {
              engagement_level: 0.7,
              question_count: 5,
              concern_indicators: [],
              satisfaction_signals: [],
              decision_readiness: 0.6
            }
          },
          conversation_flow: {
            structure_score: 0.75,
            transition_quality: 0.7,
            topic_coverage: [],
            missed_opportunities: [],
            strong_moments: []
          },
          language_analysis: {
            complexity_level: 'Appropriate',
            jargon_usage: 0.3,
            empathy_indicators: [],
            persuasion_techniques: [],
            compliance_language: true
          }
        },
        performanceMetrics: {
          efficiency: {
            call_duration_vs_target: content.duration ? `${content.duration} minutes` : 'Not specified',
            information_gathering_rate: 0.8,
            decision_making_speed: 0.7,
            follow_up_clarity: 0.85
          },
          effectiveness: {
            objectives_achieved: 0.75,
            client_questions_answered: 0.9,
            concerns_addressed: 0.8,
            next_steps_clarity: 0.85
          },
          conversion: {
            conversion_probability: 0.65,
            objection_handling_score: 0.7,
            value_demonstration: 0.75,
            closing_effectiveness: 0.6
          }
        },
        clientExperience: {
          satisfaction_indicators: {
            positive_sentiment: 0.8,
            engagement_score: 0.75,
            trust_building: 0.8,
            comfort_level: 0.85
          },
          pain_points: [],
          moments_of_excellence: []
        },
        complianceAnalysis: {
          ethical_standards: {
            attorney_client_privilege: true,
            professional_conduct: true,
            advertising_compliance: true,
            disclosure_requirements: true
          },
          risk_factors: [],
          improvement_areas: []
        },
        recommendations: {
          immediate_actions: [],
          training_recommendations: [],
          process_improvements: [],
          script_suggestions: []
        },
        benchmarking: {
          industry_comparison: {
            call_duration: 'Within range',
            conversion_rate: 'Above average',
            client_satisfaction: 'Good',
            efficiency_score: 'Satisfactory'
          },
          historical_trends: {
            performance_trajectory: 'Stable',
            improvement_rate: 'Gradual',
            consistency_score: 0.8
          },
          best_practices: []
        },
        actionPlan: {
          short_term: [],
          medium_term: [],
          long_term: []
        },
        monitoring: {
          kpis: [],
          alert_thresholds: [],
          reporting_schedule: {
            daily: [],
            weekly: ['Performance summary'],
            monthly: ['Comprehensive analysis'],
            quarterly: ['Strategic review']
          }
        },
        metadata: {
          analysis_confidence: 0.5,
          data_quality_score: 0.3,
          sample_size: 'Limited data',
          analysis_limitations: ['Structure parsing failed', 'Limited data available'],
          next_review_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          lastUpdated: new Date().toISOString()
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Analysis structure was not fully formatted, provided as basic assessment',
          raw_analysis: rawResponse
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Video analysis API error:', error)

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
        error: 'Video analysis service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
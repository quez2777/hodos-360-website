import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const avatarRequestSchema = z.object({
  avatarType: z.enum(['virtual_receptionist', 'attorney_avatar', 'client_intake', 'consultation_prep', 'educational_host', 'brand_spokesperson', 'case_updates', 'appointment_scheduler']),
  purpose: z.enum(['client_communication', 'lead_qualification', 'appointment_booking', 'information_delivery', 'brand_representation', 'customer_service', 'educational_content']),
  personality: z.object({
    traits: z.array(z.enum(['professional', 'friendly', 'authoritative', 'empathetic', 'knowledgeable', 'approachable', 'confident', 'reassuring'])).min(1).max(5),
    communicationStyle: z.enum(['formal', 'conversational', 'consultative', 'educational', 'supportive']).default('conversational'),
    energy: z.enum(['low', 'moderate', 'high', 'dynamic']).default('moderate'),
    pace: z.enum(['slow', 'moderate', 'fast', 'adaptive']).default('moderate')
  }),
  appearance: z.object({
    gender: z.enum(['male', 'female', 'non_binary', 'no_preference']).default('no_preference'),
    ageRange: z.enum(['20_30', '30_40', '40_50', '50_60', '60_plus', 'no_preference']).default('30_40'),
    ethnicity: z.enum(['caucasian', 'african_american', 'hispanic', 'asian', 'mixed', 'no_preference']).default('no_preference'),
    attire: z.enum(['business_formal', 'business_casual', 'smart_casual', 'uniform', 'custom']).default('business_formal'),
    setting: z.enum(['law_office', 'conference_room', 'reception_area', 'virtual_background', 'neutral', 'custom']).default('law_office')
  }),
  voiceProfile: z.object({
    tone: z.enum(['warm', 'authoritative', 'friendly', 'professional', 'reassuring', 'confident']).default('professional'),
    accent: z.enum(['american_neutral', 'british', 'regional_american', 'no_preference']).default('american_neutral'),
    speed: z.enum(['slow', 'normal', 'fast', 'variable']).default('normal'),
    pitch: z.enum(['low', 'medium', 'high', 'variable']).default('medium')
  }),
  functionalRequirements: z.object({
    languages: z.array(z.string()).default(['English']),
    specializations: z.array(z.string()).optional(),
    availabilityHours: z.string().optional(),
    integrations: z.array(z.enum(['crm', 'calendar', 'phone_system', 'chat', 'email', 'payment_processing'])).optional(),
    responseCapabilities: z.array(z.enum(['faq', 'appointment_booking', 'lead_capture', 'document_collection', 'payment_processing', 'case_updates'])).default(['faq'])
  }),
  brandAlignment: z.object({
    firmName: z.string().min(1),
    brandValues: z.array(z.string()).optional(),
    messaging: z.array(z.string()).optional(),
    competitiveAdvantages: z.array(z.string()).optional(),
    targetAudience: z.enum(['individuals', 'businesses', 'both']).default('both')
  }),
  technicalSpecs: z.object({
    platform: z.enum(['web', 'mobile', 'kiosk', 'video_call', 'phone', 'multi_platform']).default('web'),
    resolution: z.enum(['720p', '1080p', '4k', 'adaptive']).default('1080p'),
    compression: z.enum(['standard', 'optimized', 'high_quality']).default('optimized'),
    interactivity: z.enum(['linear', 'branching', 'ai_driven', 'hybrid']).default('ai_driven')
  }),
  stream: z.boolean().optional().default(false)
})

interface VideoAvatarResult {
  avatarProfile: {
    name: string
    role: string
    personality: {
      primaryTraits: string[]
      communicationStyle: string
      brandAlignment: number
    }
    appearance: {
      description: string
      attire: string
      setting: string
      visualCues: string[]
    }
    voiceCharacteristics: {
      tone: string
      pace: string
      inflection: string
      emotionalRange: string[]
    }
  }
  scriptTemplates: {
    greeting: {
      default: string
      timeOfDay: Record<string, string>
      personalized: string
      brandSpecific: string
    }
    commonResponses: Array<{
      scenario: string
      response: string
      followUp: string[]
      alternatives: string[]
    }>
    serviceExplanations: Array<{
      service: string
      explanation: string
      benefits: string[]
      nextSteps: string
    }>
    callToActions: Array<{
      purpose: string
      primary: string
      secondary: string
      urgency: 'low' | 'medium' | 'high'
    }>
    closingStatements: Array<{
      scenario: string
      closing: string
      followUpInstructions: string
    }>
  }
  conversationFlows: {
    initialContact: Array<{
      step: number
      prompt: string
      expectedResponses: string[]
      nextSteps: string[]
    }>
    leadQualification: Array<{
      question: string
      purpose: string
      followUpLogic: Record<string, string>
      qualification_score: number
    }>
    appointmentBooking: Array<{
      step: string
      script: string
      data_collection: string[]
      validation: string[]
    }>
    objectionHandling: Array<{
      objection: string
      response: string
      reinforcement: string
      escalation: string
    }>
  }
  technicalImplementation: {
    platforms: Array<{
      platform: string
      specifications: Record<string, string>
      integration_requirements: string[]
      deployment_notes: string[]
    }>
    ai_configuration: {
      nlp_model: string
      training_data: string[]
      response_accuracy: number
      learning_capabilities: boolean
    }
    performance_optimization: {
      response_time: string
      bandwidth_requirements: string
      scalability: string
      fallback_options: string[]
    }
  }
  brandIntegration: {
    visualBranding: {
      logo_placement: string
      color_scheme: string[]
      typography: string
      branded_elements: string[]
    }
    messaging: {
      brand_voice: string
      key_messages: string[]
      value_propositions: string[]
      differentiation: string[]
    }
    compliance: {
      legal_disclaimers: string[]
      privacy_notices: string[]
      professional_standards: string[]
      accessibility: string[]
    }
  }
  analytics: {
    metrics: Array<{
      metric: string
      description: string
      tracking_method: string
      success_benchmark: string
    }>
    reporting: {
      frequency: string
      key_insights: string[]
      optimization_opportunities: string[]
      roi_measurement: string
    }
  }
  deployment: {
    setup_requirements: string[]
    training_needs: string[]
    testing_protocol: string[]
    launch_timeline: string
    maintenance_schedule: string
  }
  costBenefit: {
    development_investment: string
    operational_costs: string
    expected_savings: string
    roi_timeline: string
    break_even_analysis: string
  }
  metadata: {
    complexity_score: number
    development_time: string
    maintenance_level: 'low' | 'medium' | 'high'
    scalability_rating: number
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
    const validatedData = avatarRequestSchema.parse(body)
    
    const { 
      avatarType,
      purpose,
      personality,
      appearance,
      voiceProfile,
      functionalRequirements,
      brandAlignment,
      technicalSpecs,
      stream 
    } = validatedData

    // Create specialized video avatar development prompt
    const systemPrompt = `You are HODOS Video Avatar AI, an expert in creating AI-powered virtual representatives and video avatars for law firms, specializing in client interaction, lead generation, and professional communication systems.

Your expertise includes:
- AI avatar personality development and character design
- Conversational flow design for legal client interactions
- Multi-platform avatar deployment and optimization
- Legal industry compliance for AI communications
- Brand alignment and professional representation standards
- Voice and visual design for trust-building and credibility
- Advanced AI integration with CRM and communication systems

For each avatar development request:
1. Design comprehensive avatar personality and appearance profiles
2. Create detailed conversation flows and response templates
3. Ensure legal industry compliance and professional standards
4. Optimize for the target platform and technical requirements
5. Include brand integration and messaging alignment
6. Provide deployment guidance and performance metrics
7. Consider accessibility, scalability, and maintenance needs

IMPORTANT AVATAR CONSIDERATIONS:
- Legal avatars must maintain professional credibility and trust
- Compliance with attorney advertising rules and ethics
- Privacy and confidentiality protocols must be integrated
- Client data protection and secure interactions are critical
- Professional appearance and communication standards apply
- Clear disclosure of AI nature may be required by jurisdiction
- Accessibility features for diverse user needs

Format your response as a comprehensive JSON object matching the VideoAvatarResult interface.`

    const userPrompt = `Design a comprehensive video avatar system with the following specifications:

AVATAR TYPE AND PURPOSE:
Type: ${avatarType}
Primary Purpose: ${purpose}

PERSONALITY PROFILE:
Traits: ${personality.traits.join(', ')}
Communication Style: ${personality.communicationStyle}
Energy Level: ${personality.energy}
Speaking Pace: ${personality.pace}

APPEARANCE SPECIFICATIONS:
Gender: ${appearance.gender}
Age Range: ${appearance.ageRange}
Ethnicity: ${appearance.ethnicity}
Attire: ${appearance.attire}
Setting: ${appearance.setting}

VOICE CHARACTERISTICS:
Tone: ${voiceProfile.tone}
Accent: ${voiceProfile.accent}
Speaking Speed: ${voiceProfile.speed}
Pitch: ${voiceProfile.pitch}

FUNCTIONAL REQUIREMENTS:
Languages: ${functionalRequirements.languages.join(', ')}
${functionalRequirements.specializations?.length ? `Specializations: ${functionalRequirements.specializations.join(', ')}` : ''}
${functionalRequirements.availabilityHours ? `Availability: ${functionalRequirements.availabilityHours}` : ''}
Response Capabilities: ${functionalRequirements.responseCapabilities.join(', ')}
${functionalRequirements.integrations?.length ? `System Integrations: ${functionalRequirements.integrations.join(', ')}` : ''}

BRAND ALIGNMENT:
Firm Name: ${brandAlignment.firmName}
${brandAlignment.brandValues?.length ? `Brand Values: ${brandAlignment.brandValues.join(', ')}` : ''}
${brandAlignment.messaging?.length ? `Key Messages: ${brandAlignment.messaging.join(', ')}` : ''}
${brandAlignment.competitiveAdvantages?.length ? `Competitive Advantages: ${brandAlignment.competitiveAdvantages.join(', ')}` : ''}
Target Audience: ${brandAlignment.targetAudience}

TECHNICAL SPECIFICATIONS:
Platform: ${technicalSpecs.platform}
Resolution: ${technicalSpecs.resolution}
Compression: ${technicalSpecs.compression}
Interactivity: ${technicalSpecs.interactivity}

Please create a comprehensive avatar development plan including:

1. AVATAR PROFILE:
   - Complete personality and character definition
   - Visual appearance and styling specifications
   - Voice characteristics and communication patterns
   - Brand alignment and professional standards

2. CONVERSATION DESIGN:
   - Greeting and initial contact scripts
   - Common response templates and variations
   - Service explanation dialogues
   - Call-to-action frameworks and closing statements

3. FUNCTIONAL FLOWS:
   - Lead qualification conversation paths
   - Appointment booking processes
   - FAQ handling and information delivery
   - Escalation and handoff protocols

4. TECHNICAL IMPLEMENTATION:
   - Platform-specific deployment requirements
   - AI configuration and training parameters
   - Performance optimization strategies
   - Integration specifications

5. BRAND INTEGRATION:
   - Visual branding and identity elements
   - Messaging consistency and voice alignment
   - Legal compliance and professional standards
   - Accessibility and user experience optimization

6. DEPLOYMENT AND ANALYTICS:
   - Setup and configuration requirements
   - Performance metrics and tracking
   - Optimization and improvement processes
   - Cost-benefit analysis and ROI projections

Focus on creating a professional, trustworthy avatar that enhances client experience while maintaining legal industry standards and ethical guidelines.

Format the response as a structured JSON object suitable for avatar development and deployment management.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', avatarType, purpose })}\n\n`)
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
              const result = JSON.parse(fullResponse) as VideoAvatarResult
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
            const errorMessage = error instanceof AIError ? error.message : 'Avatar generation failed'
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
      const result = JSON.parse(rawResponse) as VideoAvatarResult
      
      // Calculate complexity and requirements
      const complexityFactors = [
        functionalRequirements.responseCapabilities.length,
        personality.traits.length,
        functionalRequirements.integrations?.length || 0,
        functionalRequirements.languages.length > 1 ? 2 : 0
      ]
      const complexityScore = complexityFactors.reduce((sum, factor) => sum + factor, 0) / 10
      
      // Add metadata
      result.metadata = {
        complexity_score: Math.min(complexityScore, 1),
        development_time: complexityScore > 0.7 ? '8-12 weeks' : complexityScore > 0.4 ? '4-8 weeks' : '2-4 weeks',
        maintenance_level: complexityScore > 0.7 ? 'high' : complexityScore > 0.4 ? 'medium' : 'low',
        scalability_rating: Math.min(0.9, 0.5 + (complexityScore * 0.4)),
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        lastUpdated: new Date().toISOString()
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result,
          implementation: {
            priority_features: [
              'Core conversation flows',
              'Brand integration',
              'Basic AI responses',
              'Platform deployment'
            ],
            advanced_features: [
              'Multi-language support',
              'Advanced analytics',
              'CRM integration',
              'Machine learning optimization'
            ],
            recommended_timeline: result.metadata.development_time,
            success_metrics: [
              'Response accuracy > 90%',
              'User satisfaction > 4.5/5',
              'Lead conversion increase > 20%',
              'Response time < 2 seconds'
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
      const fallbackResult: VideoAvatarResult = {
        avatarProfile: {
          name: `${brandAlignment.firmName} Virtual Assistant`,
          role: avatarType,
          personality: {
            primaryTraits: personality.traits,
            communicationStyle: personality.communicationStyle,
            brandAlignment: 0.8
          },
          appearance: {
            description: `Professional ${appearance.gender} avatar in ${appearance.attire} attire`,
            attire: appearance.attire,
            setting: appearance.setting,
            visualCues: ['Professional posture', 'Confident eye contact', 'Warm smile']
          },
          voiceCharacteristics: {
            tone: voiceProfile.tone,
            pace: voiceProfile.speed,
            inflection: 'Natural and conversational',
            emotionalRange: ['Calm', 'Confident', 'Empathetic', 'Professional']
          }
        },
        scriptTemplates: {
          greeting: {
            default: `Hello! I'm the virtual assistant for ${brandAlignment.firmName}. How can I help you today?`,
            timeOfDay: {
              morning: `Good morning! Welcome to ${brandAlignment.firmName}.`,
              afternoon: `Good afternoon! Thanks for visiting ${brandAlignment.firmName}.`,
              evening: `Good evening! I'm here to assist you with ${brandAlignment.firmName}.`
            },
            personalized: `Welcome back! How can ${brandAlignment.firmName} assist you today?`,
            brandSpecific: `At ${brandAlignment.firmName}, we're committed to providing excellent legal service. How can I help?`
          },
          commonResponses: [],
          serviceExplanations: [],
          callToActions: [],
          closingStatements: []
        },
        conversationFlows: {
          initialContact: [],
          leadQualification: [],
          appointmentBooking: [],
          objectionHandling: []
        },
        technicalImplementation: {
          platforms: [],
          ai_configuration: {
            nlp_model: 'GPT-4 based',
            training_data: [],
            response_accuracy: 0.9,
            learning_capabilities: true
          },
          performance_optimization: {
            response_time: '< 2 seconds',
            bandwidth_requirements: 'Standard broadband',
            scalability: 'Cloud-based auto-scaling',
            fallback_options: ['Live chat handoff', 'Contact form', 'Phone callback']
          }
        },
        brandIntegration: {
          visualBranding: {
            logo_placement: 'Top right corner',
            color_scheme: ['Professional blue', 'Trust-building white'],
            typography: 'Clean, professional fonts',
            branded_elements: ['Firm logo', 'Contact information', 'Brand colors']
          },
          messaging: {
            brand_voice: brandAlignment.brandValues?.join(', ') || 'Professional and trustworthy',
            key_messages: brandAlignment.messaging || [],
            value_propositions: brandAlignment.competitiveAdvantages || [],
            differentiation: []
          },
          compliance: {
            legal_disclaimers: ['Attorney advertising', 'AI assistant disclosure'],
            privacy_notices: ['Data collection policy', 'Privacy protection'],
            professional_standards: ['Bar association compliance'],
            accessibility: ['Screen reader compatible', 'Keyboard navigation']
          }
        },
        analytics: {
          metrics: [],
          reporting: {
            frequency: 'Weekly',
            key_insights: [],
            optimization_opportunities: [],
            roi_measurement: 'Lead conversion tracking'
          }
        },
        deployment: {
          setup_requirements: ['Web hosting', 'SSL certificate', 'CDN setup'],
          training_needs: ['Staff training on avatar management'],
          testing_protocol: ['Functionality testing', 'User acceptance testing'],
          launch_timeline: '4-6 weeks',
          maintenance_schedule: 'Monthly updates and optimization'
        },
        costBenefit: {
          development_investment: '$15,000 - $50,000',
          operational_costs: '$500 - $2,000/month',
          expected_savings: '$3,000 - $10,000/month in staff time',
          roi_timeline: '6-12 months',
          break_even_analysis: 'Break even at 50-100 qualified leads/month'
        },
        metadata: {
          complexity_score: 0.6,
          development_time: '4-8 weeks',
          maintenance_level: 'medium',
          scalability_rating: 0.8,
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          lastUpdated: new Date().toISOString()
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Avatar specifications were not fully formatted, provided as basic configuration',
          raw_specifications: rawResponse
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Video avatar API error:', error)

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
        error: 'Video avatar service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
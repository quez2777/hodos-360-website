import { NextRequest, NextResponse } from 'next/server'
import { openAIClient, AIError, countTokens } from '@/lib/ai/openai-client'
import { rateLimitMiddleware, addRateLimitHeaders } from '@/app/api/middleware/rate-limit'
import { securityMiddleware } from '@/app/api/middleware/security'
import type { OpenAI } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schema
const scriptRequestSchema = z.object({
  videoType: z.enum(['client_testimonial', 'explainer_video', 'attorney_intro', 'process_walkthrough', 'case_study', 'educational_content', 'marketing_promo', 'consultation_prep', 'faq_response', 'brand_story']),
  purpose: z.enum(['lead_generation', 'client_education', 'brand_building', 'service_explanation', 'trust_building', 'consultation_prep', 'referral_generation', 'social_proof']),
  duration: z.enum(['30_seconds', '60_seconds', '2_minutes', '5_minutes', '10_minutes', 'custom']).default('2_minutes'),
  customDuration: z.string().optional(),
  practiceArea: z.enum(['personal_injury', 'criminal_defense', 'family_law', 'corporate_law', 'immigration', 'employment', 'real_estate', 'estate_planning', 'bankruptcy', 'litigation', 'general']).optional(),
  audience: z.enum(['potential_clients', 'existing_clients', 'referral_sources', 'general_public', 'other_attorneys', 'media']),
  tone: z.enum(['professional', 'conversational', 'authoritative', 'empathetic', 'educational', 'reassuring', 'confident']).default('professional'),
  firmInfo: z.object({
    name: z.string().min(1),
    attorney: z.object({
      name: z.string().min(1),
      title: z.string().optional(),
      experience: z.string().optional(),
      specialization: z.string().optional()
    }).optional(),
    values: z.array(z.string()).optional(),
    uniqueSellingPoints: z.array(z.string()).optional()
  }),
  contentRequirements: z.object({
    keyMessages: z.array(z.string()).max(5),
    callToAction: z.string(),
    mustInclude: z.array(z.string()).optional(),
    mustAvoid: z.array(z.string()).optional()
  }),
  productionSpecs: z.object({
    setting: z.enum(['office', 'courtroom', 'client_meeting', 'home', 'outdoor', 'studio', 'virtual_background']).optional(),
    visualStyle: z.enum(['professional', 'cinematic', 'documentary', 'casual', 'animated', 'presentation']).optional(),
    includeGraphics: z.boolean().default(false),
    includeCaptions: z.boolean().default(true)
  }).optional(),
  compliance: z.object({
    disclaimers: z.boolean().default(true),
    stateRequirements: z.array(z.string()).optional(),
    ethicalGuidelines: z.boolean().default(true)
  }).default({
    disclaimers: true,
    ethicalGuidelines: true
  }),
  stream: z.boolean().optional().default(false)
})

interface VideoScriptResult {
  videoType: string
  purpose: string
  estimatedDuration: string
  script: {
    title: string
    logline: string
    hook: {
      openingLine: string
      visualDirection: string
      duration: string
    }
    sections: Array<{
      name: string
      content: {
        dialogue: string
        visualDirections: string
        duration: string
        keyPoints: string[]
      }
      purpose: string
    }>
    callToAction: {
      setup: string
      primaryCTA: string
      secondaryCTA?: string
      visualDirection: string
      duration: string
    }
    closing: {
      dialogue: string
      visualDirection: string
      disclaimers?: string[]
    }
  }
  productionNotes: {
    setting: string
    equipment: string[]
    lighting: string
    audio: string
    props: string[]
    wardrobe: string[]
  }
  shotList: Array<{
    shotNumber: number
    shotType: string
    description: string
    duration: string
    audio: string
    notes: string
  }>
  graphics: Array<{
    type: 'text_overlay' | 'logo' | 'contact_info' | 'statistic' | 'quote' | 'disclaimer'
    content: string
    timing: string
    placement: string
    style: string
  }>
  alternatives: {
    openingVariations: string[]
    ctaVariations: string[]
    closingVariations: string[]
  }
  optimization: {
    seoTitle: string
    videoDescription: string
    tags: string[]
    thumbnailSuggestions: string[]
  }
  distribution: {
    platforms: Array<{
      platform: string
      adaptations: string[]
      specifications: Record<string, string>
    }>
    audienceTargeting: string[]
    postingStrategy: string
  }
  compliance: {
    legalDisclosures: string[]
    ethicalConsiderations: string[]
    barRequirements: string[]
    riskAssessment: string
  }
  metrics: {
    kpis: string[]
    successMetrics: string[]
    trackingSetup: string[]
  }
  metadata: {
    scriptLength: number
    readingTime: string
    productionComplexity: 'low' | 'medium' | 'high'
    estimatedCost: string
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
    const validatedData = scriptRequestSchema.parse(body)
    
    const { 
      videoType,
      purpose,
      duration,
      customDuration,
      practiceArea,
      audience,
      tone,
      firmInfo,
      contentRequirements,
      productionSpecs,
      compliance,
      stream 
    } = validatedData

    // Create specialized video script generation prompt
    const systemPrompt = `You are HODOS Video AI, an expert video script writer specializing in legal marketing, client communication, and professional video content for law firms.

Your expertise includes:
- Professional video script writing for legal services marketing
- Client psychology and trust-building through video content
- Legal industry compliance and ethical video marketing standards
- Multi-platform video content optimization
- Visual storytelling and production direction
- Conversion-focused video marketing strategies
- Attorney branding and professional presentation

For each video script request:
1. Create compelling, professional scripts that build trust and credibility
2. Include detailed visual directions and production notes
3. Ensure compliance with legal advertising ethics and bar requirements
4. Optimize for the target audience and platform specifications
5. Include clear calls-to-action that drive desired outcomes
6. Provide shot lists and production guidance
7. Consider budget and production complexity

IMPORTANT LEGAL VIDEO CONSIDERATIONS:
- All content must comply with legal advertising rules and ethics
- Attorney solicitation rules vary by jurisdiction
- Client confidentiality must be maintained in all content
- Disclaimers and disclosures are often required
- Professional appearance and messaging standards apply
- Results cannot be guaranteed in promotional content

Format your response as a comprehensive JSON object matching the VideoScriptResult interface.`

    const durationMap = {
      '30_seconds': '30 seconds',
      '60_seconds': '60 seconds', 
      '2_minutes': '2 minutes',
      '5_minutes': '5 minutes',
      '10_minutes': '10 minutes',
      'custom': customDuration || '2 minutes'
    }

    const userPrompt = `Create a ${durationMap[duration]} ${videoType} video script with the following specifications:

VIDEO REQUIREMENTS:
Type: ${videoType}
Purpose: ${purpose}
Duration: ${durationMap[duration]}
${practiceArea ? `Practice Area: ${practiceArea}` : ''}
Target Audience: ${audience}
Tone: ${tone}

FIRM INFORMATION:
Firm Name: ${firmInfo.name}
${firmInfo.attorney ? `Attorney: ${firmInfo.attorney.name}${firmInfo.attorney.title ? ` - ${firmInfo.attorney.title}` : ''}` : ''}
${firmInfo.attorney?.experience ? `Experience: ${firmInfo.attorney.experience}` : ''}
${firmInfo.attorney?.specialization ? `Specialization: ${firmInfo.attorney.specialization}` : ''}
${firmInfo.values?.length ? `Core Values: ${firmInfo.values.join(', ')}` : ''}
${firmInfo.uniqueSellingPoints?.length ? `Unique Selling Points: ${firmInfo.uniqueSellingPoints.join(', ')}` : ''}

CONTENT REQUIREMENTS:
Key Messages: ${contentRequirements.keyMessages.join(', ')}
Call to Action: ${contentRequirements.callToAction}
${contentRequirements.mustInclude?.length ? `Must Include: ${contentRequirements.mustInclude.join(', ')}` : ''}
${contentRequirements.mustAvoid?.length ? `Must Avoid: ${contentRequirements.mustAvoid.join(', ')}` : ''}

PRODUCTION SPECIFICATIONS:
${productionSpecs?.setting ? `Setting: ${productionSpecs.setting}` : ''}
${productionSpecs?.visualStyle ? `Visual Style: ${productionSpecs.visualStyle}` : ''}
Include Graphics: ${productionSpecs?.includeGraphics ? 'Yes' : 'No'}
Include Captions: ${productionSpecs?.includeCaptions ? 'Yes' : 'No'}

COMPLIANCE REQUIREMENTS:
Include Disclaimers: ${compliance.disclaimers ? 'Yes' : 'No'}
Ethical Guidelines: ${compliance.ethicalGuidelines ? 'Yes' : 'No'}
${compliance.stateRequirements?.length ? `State Requirements: ${compliance.stateRequirements.join(', ')}` : ''}

Please create a comprehensive video script including:

1. SCRIPT STRUCTURE:
   - Compelling hook that captures attention immediately
   - Clear, logical flow that builds trust and credibility
   - Structured sections with specific purposes
   - Strong call-to-action that drives conversions
   - Professional closing with appropriate disclaimers

2. PRODUCTION GUIDANCE:
   - Detailed visual directions for each scene
   - Shot list with specific camera angles and movements
   - Lighting and audio recommendations
   - Props, wardrobe, and setting requirements

3. GRAPHICS AND TEXT OVERLAYS:
   - Contact information and branding elements
   - Key statistics or quotes if relevant
   - Visual reinforcement of key messages
   - Disclaimer text and legal requirements

4. PLATFORM OPTIMIZATION:
   - SEO-optimized title and description
   - Platform-specific adaptations
   - Thumbnail suggestions
   - Distribution strategy

5. COMPLIANCE AND LEGAL:
   - All required legal disclosures
   - Ethical considerations and guidelines
   - Risk assessment and mitigation
   - Bar association compliance notes

Focus on creating compelling content that builds trust, demonstrates expertise, and drives the desired action while maintaining strict professional and ethical standards.

Format the response as a structured JSON object suitable for video production workflow management.`

    if (stream) {
      // Handle streaming response
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'start', videoType, purpose })}\n\n`)
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
              const result = JSON.parse(fullResponse) as VideoScriptResult
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
            const errorMessage = error instanceof AIError ? error.message : 'Video script generation failed'
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
      const result = JSON.parse(rawResponse) as VideoScriptResult
      
      // Calculate script metrics
      const fullScript = result.script ? 
        Object.values(result.script).filter(v => typeof v === 'string').join(' ') : rawResponse
      const wordCount = fullScript.split(/\s+/).length
      const readingTime = Math.ceil(wordCount / 150) // 150 words per minute average speaking pace
      
      // Add metadata
      result.metadata = {
        scriptLength: wordCount,
        readingTime: `${readingTime} minutes`,
        productionComplexity: wordCount > 500 ? 'high' : wordCount > 200 ? 'medium' : 'low',
        estimatedCost: wordCount > 500 ? '$2,000-5,000' : wordCount > 200 ? '$1,000-2,500' : '$500-1,500',
        processingTime: Date.now() - startTime,
        tokenUsage: completion.usage?.total_tokens || 0,
        lastUpdated: new Date().toISOString()
      }

      const response = NextResponse.json(
        {
          success: true,
          data: result,
          production: {
            estimatedShootingTime: `${Math.ceil(wordCount / 100)} hours`,
            recommendedTeamSize: wordCount > 300 ? '3-5 people' : '2-3 people',
            postProductionTime: `${Math.ceil(wordCount / 200)} days`,
            deliveryTimeline: `${Math.ceil(wordCount / 150)} weeks`
          }
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
        
    } catch (parseError) {
      // Fallback response if JSON parsing fails
      const fallbackResult: VideoScriptResult = {
        videoType,
        purpose,
        estimatedDuration: durationMap[duration],
        script: {
          title: `${videoType} for ${firmInfo.name}`,
          logline: `Professional ${videoType} showcasing ${firmInfo.name}'s expertise`,
          hook: {
            openingLine: rawResponse.substring(0, 100) + '...',
            visualDirection: 'Professional office setting',
            duration: '5 seconds'
          },
          sections: [{
            name: 'Main Content',
            content: {
              dialogue: rawResponse,
              visualDirections: 'Medium shot of attorney speaking directly to camera',
              duration: durationMap[duration],
              keyPoints: contentRequirements.keyMessages
            },
            purpose: purpose
          }],
          callToAction: {
            setup: 'If you need legal assistance...',
            primaryCTA: contentRequirements.callToAction,
            visualDirection: 'Close-up with contact information overlay',
            duration: '10 seconds'
          },
          closing: {
            dialogue: 'Thank you for watching.',
            visualDirection: 'Fade to logo',
            disclaimers: compliance.disclaimers ? ['This is attorney advertising.', 'Past results do not guarantee future outcomes.'] : undefined
          }
        },
        productionNotes: {
          setting: productionSpecs?.setting || 'office',
          equipment: ['Professional camera', 'Lapel microphone', 'LED lighting kit'],
          lighting: 'Soft, professional lighting setup',
          audio: 'Clear, crisp audio recording',
          props: ['Firm logo', 'Professional backdrop'],
          wardrobe: ['Professional business attire', 'Solid colors preferred']
        },
        shotList: [],
        graphics: [],
        alternatives: {
          openingVariations: [],
          ctaVariations: [],
          closingVariations: []
        },
        optimization: {
          seoTitle: `${videoType} - ${firmInfo.name}`,
          videoDescription: `Learn more about ${firmInfo.name}'s legal services`,
          tags: [practiceArea || 'legal', videoType, 'attorney', firmInfo.name].filter(Boolean),
          thumbnailSuggestions: []
        },
        distribution: {
          platforms: [],
          audienceTargeting: [],
          postingStrategy: 'Cross-platform distribution recommended'
        },
        compliance: {
          legalDisclosures: compliance.disclaimers ? ['Attorney advertising disclaimer required'] : [],
          ethicalConsiderations: compliance.ethicalGuidelines ? ['Professional responsibility compliance'] : [],
          barRequirements: compliance.stateRequirements || [],
          riskAssessment: 'Low risk - standard professional content'
        },
        metrics: {
          kpis: ['View count', 'Engagement rate', 'Click-through rate'],
          successMetrics: ['Lead generation', 'Brand awareness', 'Client inquiries'],
          trackingSetup: ['Google Analytics', 'Platform insights', 'Call tracking']
        },
        metadata: {
          scriptLength: rawResponse.split(/\s+/).length,
          readingTime: `${Math.ceil(rawResponse.split(/\s+/).length / 150)} minutes`,
          productionComplexity: 'medium',
          estimatedCost: '$1,000-2,500',
          processingTime: Date.now() - startTime,
          tokenUsage: completion.usage?.total_tokens || 0,
          lastUpdated: new Date().toISOString()
        }
      }

      const response = NextResponse.json(
        {
          success: true,
          data: fallbackResult,
          warning: 'Script structure was not fully formatted, provided as basic script',
          raw_script: rawResponse
        },
        { headers: corsHeaders }
      )

      return rateLimitResult.success && rateLimitResult.data?.rateLimitInfo
        ? addRateLimitHeaders(response, rateLimitResult.data.rateLimitInfo)
        : response
    }

  } catch (error) {
    console.error('Video script API error:', error)

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
        error: 'Video script service temporarily unavailable',
        message: 'Please try again in a few moments'
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
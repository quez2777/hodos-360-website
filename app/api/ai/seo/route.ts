import { NextRequest, NextResponse } from 'next/server'
import { seoAnalyzer } from '@/lib/ai/seo-analyzer'
import { AIError } from '@/lib/ai/openai-client'
import { z } from 'zod'

// Request validation schemas
const analyzeRequestSchema = z.object({
  url: z.string().url(),
  includeCompetitors: z.boolean().optional(),
  competitors: z.array(z.string()).optional(),
})

const contentGenerationSchema = z.object({
  topic: z.string().min(1).max(500),
  keywords: z.array(z.string()).min(1).max(10),
  contentType: z.enum(['blog', 'landing', 'product']),
  tone: z.enum(['professional', 'casual', 'technical']),
  wordCount: z.number().min(100).max(5000),
})

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders })
}

// Main SEO analysis endpoint
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = analyzeRequestSchema.parse(body)
    
    const { url, includeCompetitors = false, competitors = [] } = validatedData

    // Perform SEO analysis
    const analysis = await seoAnalyzer.analyze(url)

    // Add competitor analysis if requested
    if (includeCompetitors && competitors.length > 0) {
      const competitorData = await seoAnalyzer.analyzeCompetitors(
        new URL(url).hostname,
        competitors
      )
      analysis.competitorAnalysis = competitorData
    }

    return NextResponse.json(
      {
        success: true,
        data: analysis,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('SEO analysis error:', error)

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
        error: 'Failed to analyze SEO',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// SEO content generation endpoint
export async function POST_generate(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = contentGenerationSchema.parse(body)

    const content = await seoAnalyzer.generateSEOContent(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: content,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Content generation error:', error)

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

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate content',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}

// Quick SEO check endpoint (lighter analysis)
export async function POST_check(req: NextRequest) {
  try {
    const { url } = await req.json()

    if (!url || !z.string().url().safeParse(url).success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid URL provided',
        },
        { status: 400, headers: corsHeaders }
      )
    }

    // Fetch page and do quick analysis
    const response = await fetch(url)
    const html = await response.text()

    // Quick checks
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)
    const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || []
    
    const quickCheck = {
      hasTitle: !!titleMatch,
      titleLength: titleMatch?.[1]?.length || 0,
      hasMetaDescription: !!metaDescMatch,
      metaDescriptionLength: metaDescMatch?.[1]?.length || 0,
      h1Count: h1Matches.length,
      isHTTPS: url.startsWith('https://'),
      loadTime: response.headers.get('x-response-time') || 'N/A',
      recommendations: [] as string[],
    }

    // Generate recommendations
    if (!quickCheck.hasTitle) {
      quickCheck.recommendations.push('Add a title tag to your page')
    } else if (quickCheck.titleLength < 30 || quickCheck.titleLength > 60) {
      quickCheck.recommendations.push('Optimize title length (30-60 characters)')
    }

    if (!quickCheck.hasMetaDescription) {
      quickCheck.recommendations.push('Add a meta description')
    } else if (quickCheck.metaDescriptionLength < 120 || quickCheck.metaDescriptionLength > 160) {
      quickCheck.recommendations.push('Optimize meta description length (120-160 characters)')
    }

    if (quickCheck.h1Count === 0) {
      quickCheck.recommendations.push('Add an H1 heading to your page')
    } else if (quickCheck.h1Count > 1) {
      quickCheck.recommendations.push('Use only one H1 tag per page')
    }

    if (!quickCheck.isHTTPS) {
      quickCheck.recommendations.push('Enable HTTPS for better security and SEO')
    }

    return NextResponse.json(
      {
        success: true,
        data: quickCheck,
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Quick SEO check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform SEO check',
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
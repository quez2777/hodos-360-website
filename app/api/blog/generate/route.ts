import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { openAIClient } from '@/lib/ai/openai-client'

interface BlogGenerationRequest {
  topic: string
  category: string
  keywords: string[]
  tone: 'professional' | 'casual' | 'authoritative' | 'conversational'
  length: 'short' | 'medium' | 'long'
  includeOutline?: boolean
  targetAudience?: string
  seoFocus?: boolean
}

// POST /api/blog/generate - Generate blog content with AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: BlogGenerationRequest = await request.json()
    const { 
      topic, 
      category, 
      keywords, 
      tone, 
      length, 
      includeOutline = false,
      targetAudience = 'legal professionals',
      seoFocus = true
    } = body

    if (!topic || !category) {
      return NextResponse.json(
        { error: 'Topic and category are required' },
        { status: 400 }
      )
    }

    const wordCount = {
      short: '800-1000',
      medium: '1500-2000', 
      long: '2500-3000'
    }[length]

    // Create category-specific context
    const categoryContext = {
      'ai-law-firm-management': 'Focus on AI solutions for law firm operations, case management, client relationships, and practice efficiency. Reference HODOS platform capabilities.',
      'legal-marketing-automation': 'Focus on digital marketing strategies for law firms, SEO, content marketing, and client acquisition. Reference HODOS Marketing Platform features.',
      'ai-video-for-law-firms': 'Focus on AI-powered video solutions for client intake, reception automation, and virtual assistants. Reference HODOS VIDEO Agents.',
      'legal-tech-trends': 'Focus on emerging technologies in legal industry, innovations, and future trends.',
      'law-firm-growth': 'Focus on business development, scaling strategies, and practice management for law firms.'
    }[category] || 'Focus on legal technology and law firm management.'

    const systemPrompt = `You are an expert legal technology writer for HODOS 360 LLC. Create comprehensive, SEO-optimized blog content that establishes thought leadership in legal tech.

BRAND CONTEXT:
- HODOS 360 LLC offers three flagship products:
  1. HODOS - Complete AI law firm management system
  2. HODOS Marketing Platform - AI SEO and paid marketing
  3. HODOS VIDEO Agents - Video/voice AI for reception, intake, and sales

CONTENT REQUIREMENTS:
- Write in a ${tone} tone for ${targetAudience}
- Target word count: ${wordCount} words
- Category focus: ${categoryContext}
- Include relevant keywords naturally: ${keywords.join(', ')}
- Structure with clear H2 and H3 headings
- Include actionable insights and practical advice
- Add internal linking opportunities (mark with [INTERNAL_LINK: suggested anchor text])
- Conclude with a compelling call-to-action

SEO OPTIMIZATION:
${seoFocus ? '- Optimize for featured snippets with clear, concise answers' : ''}
${seoFocus ? '- Include FAQ sections where appropriate' : ''}
${seoFocus ? '- Use semantic keywords and related terms' : ''}
${seoFocus ? '- Structure content for voice search optimization' : ''}

OUTPUT FORMAT:
Return a JSON object with:
- title: SEO-optimized title (60 characters max)
- metaDescription: Meta description (155 characters max)
- content: Full HTML content with proper headings and formatting
- excerpt: Brief summary (150 words max)
- suggestedKeywords: Array of primary and secondary keywords
- internalLinks: Array of suggested internal link opportunities
- readingTime: Estimated reading time in minutes
${includeOutline ? '- outline: Structured outline of the content' : ''}`

    const userPrompt = `Create a comprehensive blog post about: "${topic}"

Target keywords: ${keywords.join(', ')}
Category: ${category}
Target audience: ${targetAudience}

${includeOutline ? 'Please include a detailed outline before the full content.' : ''}`

    const completion = await openAIClient.createChatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 4000,
        stream: false
      }
    ) as any

    const response = completion.choices[0]?.message?.content

    if (!response) {
      throw new Error('No response from AI')
    }

    // Try to parse JSON response, fallback to structured parsing
    let blogContent
    try {
      blogContent = JSON.parse(response)
    } catch {
      // If not JSON, create structured response
      const lines = response.split('\n')
      const title = lines.find((line: string) => line.includes('Title:'))?.replace('Title:', '').trim()
      const metaDescription = lines.find((line: string) => line.includes('Meta Description:'))?.replace('Meta Description:', '').trim()
      
      blogContent = {
        title: title || `${topic} - Expert Insights from HODOS 360`,
        metaDescription: metaDescription || `Discover expert insights on ${topic} from HODOS 360's legal technology specialists.`,
        content: `<div class="blog-content">${response}</div>`,
        excerpt: response.substring(0, 300) + '...',
        suggestedKeywords: keywords,
        internalLinks: [],
        readingTime: Math.ceil(response.split(' ').length / 200)
      }
    }

    // Calculate SEO score (basic implementation)
    const seoScore = calculateSEOScore(blogContent, keywords)

    return NextResponse.json({
      ...blogContent,
      seoScore,
      generationPrompt: userPrompt,
      aiGenerated: true,
      category,
      tone,
      length
    })

  } catch (error) {
    console.error('Blog Generation Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate blog content' },
      { status: 500 }
    )
  }
}

function calculateSEOScore(content: any, keywords: string[]): number {
  let score = 0
  const { title, metaDescription, content: htmlContent, suggestedKeywords } = content

  // Title optimization (20 points)
  if (title && title.length <= 60 && title.length >= 30) score += 10
  if (keywords.some(keyword => title?.toLowerCase().includes(keyword.toLowerCase()))) score += 10

  // Meta description (15 points)
  if (metaDescription && metaDescription.length <= 155 && metaDescription.length >= 120) score += 8
  if (keywords.some(keyword => metaDescription?.toLowerCase().includes(keyword.toLowerCase()))) score += 7

  // Content length (15 points)
  const wordCount = htmlContent?.split(' ').length || 0
  if (wordCount >= 800) score += 15

  // Keyword usage (25 points)
  const contentLower = htmlContent?.toLowerCase() || ''
  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase()
    const frequency = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
    if (frequency >= 3 && frequency <= 7) score += 5
  })

  // Headings (15 points)
  const h2Count = (htmlContent?.match(/<h2/g) || []).length
  const h3Count = (htmlContent?.match(/<h3/g) || []).length
  if (h2Count >= 2) score += 8
  if (h3Count >= 3) score += 7

  // Readability (10 points)
  if (htmlContent?.includes('<p>') && htmlContent?.includes('<li>')) score += 10

  return Math.min(score, 100)
}
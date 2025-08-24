import { openAIClient, AIError } from './openai-client'
import type { OpenAI } from './openai-client'

// SEO Analysis Types
export interface SEOAnalysisResult {
  url: string
  timestamp: Date
  scores: {
    overall: number
    performance: number
    accessibility: number
    bestPractices: number
    seo: number
  }
  issues: SEOIssue[]
  suggestions: SEOSuggestion[]
  technicalData: TechnicalSEOData
  contentAnalysis: ContentAnalysis
  competitorAnalysis?: CompetitorData[]
}

export interface SEOIssue {
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  description: string
  impact: string
  howToFix: string
}

export interface SEOSuggestion {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  estimatedImpact: string
  implementation: string
}

export interface TechnicalSEOData {
  loadTime: number
  mobileUsability: boolean
  httpsEnabled: boolean
  robotsTxt: boolean
  sitemap: boolean
  structuredData: any[]
  canonicalUrl?: string
  metaTags: {
    title?: string
    description?: string
    keywords?: string
    ogTags?: Record<string, string>
    twitterTags?: Record<string, string>
  }
}

export interface ContentAnalysis {
  wordCount: number
  readabilityScore: number
  keywordDensity: Record<string, number>
  headingStructure: {
    h1: string[]
    h2: string[]
    h3: string[]
  }
  images: {
    total: number
    withoutAlt: number
    largeImages: number
  }
  links: {
    internal: number
    external: number
    broken: number
  }
}

export interface CompetitorData {
  domain: string
  metrics: {
    domainAuthority: number
    backlinks: number
    organicTraffic: number
    topKeywords: string[]
  }
}

// Mock API keys (in production, use real API keys from environment)
const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY || 'demo'
const LIGHTHOUSE_API_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

// SEO Analysis Service
export class SEOAnalyzer {
  private static async fetchPageContent(url: string): Promise<string> {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
      }
      return await response.text()
    } catch (error) {
      throw new AIError(
        'Failed to fetch page content',
        'FETCH_ERROR',
        500,
        { url, error }
      )
    }
  }

  private static async runPageSpeedAnalysis(url: string): Promise<any> {
    // In production, use real PageSpeed Insights API
    if (PAGESPEED_API_KEY === 'demo') {
      // Return mock data for demo
      return {
        lighthouseResult: {
          categories: {
            performance: { score: 0.85 },
            accessibility: { score: 0.92 },
            'best-practices': { score: 0.88 },
            seo: { score: 0.90 },
          },
          audits: {
            'first-contentful-paint': {
              score: 0.89,
              displayValue: '1.2 s',
            },
            'speed-index': {
              score: 0.92,
              displayValue: '1.8 s',
            },
            'largest-contentful-paint': {
              score: 0.85,
              displayValue: '2.5 s',
            },
          },
        },
      }
    }

    try {
      const apiUrl = `${LIGHTHOUSE_API_URL}?url=${encodeURIComponent(url)}&key=${PAGESPEED_API_KEY}&category=performance&category=accessibility&category=best-practices&category=seo`
      const response = await fetch(apiUrl)
      
      if (!response.ok) {
        throw new Error(`PageSpeed API error: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      throw new AIError(
        'Failed to run PageSpeed analysis',
        'PAGESPEED_ERROR',
        500,
        { url, error }
      )
    }
  }

  private static analyzeMetaTags(html: string): TechnicalSEOData['metaTags'] {
    const metaTags: TechnicalSEOData['metaTags'] = {
      ogTags: {},
      twitterTags: {},
    }

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch) {
      metaTags.title = titleMatch[1].trim()
    }

    // Extract meta tags
    const metaRegex = /<meta\s+(?:[^>]*?\s+)?(?:name|property)=["']([^"']+)["']\s+(?:[^>]*?\s+)?content=["']([^"']+)["'][^>]*>/gi
    let match
    
    while ((match = metaRegex.exec(html)) !== null) {
      const name = match[1].toLowerCase()
      const content = match[2]

      if (name === 'description') {
        metaTags.description = content
      } else if (name === 'keywords') {
        metaTags.keywords = content
      } else if (name.startsWith('og:')) {
        metaTags.ogTags![name] = content
      } else if (name.startsWith('twitter:')) {
        metaTags.twitterTags![name] = content
      }
    }

    return metaTags
  }

  private static analyzeContent(html: string): ContentAnalysis {
    // Remove script and style tags
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Word count
    const words = textContent.split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length

    // Extract headings
    const h1Matches = html.match(/<h1[^>]*>([^<]*)<\/h1>/gi) || []
    const h2Matches = html.match(/<h2[^>]*>([^<]*)<\/h2>/gi) || []
    const h3Matches = html.match(/<h3[^>]*>([^<]*)<\/h3>/gi) || []

    const headingStructure = {
      h1: h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()),
      h2: h2Matches.map(h => h.replace(/<[^>]+>/g, '').trim()),
      h3: h3Matches.map(h => h.replace(/<[^>]+>/g, '').trim()),
    }

    // Analyze images
    const imgMatches = html.match(/<img[^>]*>/gi) || []
    const imagesWithoutAlt = imgMatches.filter(img => !img.includes('alt=')).length

    // Analyze links
    const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi) || []
    const internalLinks = linkMatches.filter(link => {
      const href = link.match(/href=["']([^"']+)["']/)?.[1] || ''
      return href.startsWith('/') || href.includes(new URL(href).hostname)
    }).length
    const externalLinks = linkMatches.length - internalLinks

    // Simple keyword density (top 10 words)
    const wordFrequency: Record<string, number> = {}
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were'])
    
    words.forEach(word => {
      const lowerWord = word.toLowerCase()
      if (lowerWord.length > 3 && !commonWords.has(lowerWord)) {
        wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1
      }
    })

    const topKeywords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [word, count]) => {
        acc[word] = Math.round((count / wordCount) * 100 * 100) / 100
        return acc
      }, {} as Record<string, number>)

    return {
      wordCount,
      readabilityScore: this.calculateReadabilityScore(textContent),
      keywordDensity: topKeywords,
      headingStructure,
      images: {
        total: imgMatches.length,
        withoutAlt: imagesWithoutAlt,
        largeImages: 0, // Would need to actually fetch images to check size
      },
      links: {
        internal: internalLinks,
        external: externalLinks,
        broken: 0, // Would need to check each link
      },
    }
  }

  private static calculateReadabilityScore(text: string): number {
    // Simple Flesch Reading Ease approximation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const syllables = words.reduce((count, word) => {
      // Simple syllable counting (not perfect but good enough)
      return count + word.toLowerCase().replace(/[^aeiou]/g, '').length || 1
    }, 0)

    if (sentences.length === 0 || words.length === 0) return 0

    const avgWordsPerSentence = words.length / sentences.length
    const avgSyllablesPerWord = syllables / words.length

    // Flesch Reading Ease formula
    const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    return Math.max(0, Math.min(100, Math.round(score)))
  }

  private static async generateAISuggestions(
    analysis: Partial<SEOAnalysisResult>
  ): Promise<SEOSuggestion[]> {
    const prompt = `Based on this SEO analysis data, provide specific, actionable suggestions:
${JSON.stringify(analysis, null, 2)}

Return a JSON array of suggestions with this structure:
{
  "priority": "high|medium|low",
  "category": "content|technical|performance|ux",
  "title": "Brief title",
  "description": "Detailed description",
  "estimatedImpact": "Expected improvement",
  "implementation": "Step-by-step implementation"
}`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are an SEO expert. Provide specific, actionable SEO suggestions.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '[]'
      
      try {
        return JSON.parse(response)
      } catch {
        return []
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
      return []
    }
  }

  static async analyze(url: string): Promise<SEOAnalysisResult> {
    try {
      // Fetch page content
      const html = await this.fetchPageContent(url)
      
      // Run PageSpeed analysis
      const pageSpeedData = await this.runPageSpeedAnalysis(url)
      
      // Analyze content and technical aspects
      const metaTags = this.analyzeMetaTags(html)
      const contentAnalysis = this.analyzeContent(html)
      
      // Extract scores from PageSpeed data
      const scores = {
        overall: Math.round(
          ((pageSpeedData.lighthouseResult?.categories?.performance?.score || 0) +
           (pageSpeedData.lighthouseResult?.categories?.accessibility?.score || 0) +
           (pageSpeedData.lighthouseResult?.categories?.['best-practices']?.score || 0) +
           (pageSpeedData.lighthouseResult?.categories?.seo?.score || 0)) * 25
        ),
        performance: Math.round((pageSpeedData.lighthouseResult?.categories?.performance?.score || 0) * 100),
        accessibility: Math.round((pageSpeedData.lighthouseResult?.categories?.accessibility?.score || 0) * 100),
        bestPractices: Math.round((pageSpeedData.lighthouseResult?.categories?.['best-practices']?.score || 0) * 100),
        seo: Math.round((pageSpeedData.lighthouseResult?.categories?.seo?.score || 0) * 100),
      }

      // Generate issues based on analysis
      const issues: SEOIssue[] = []

      // Check for common SEO issues
      if (!metaTags.title || metaTags.title.length < 30) {
        issues.push({
          severity: 'critical',
          category: 'Meta Tags',
          title: 'Missing or Short Title Tag',
          description: 'The page title is missing or too short. Titles should be 30-60 characters.',
          impact: 'Title tags are crucial for search rankings and click-through rates.',
          howToFix: 'Add a descriptive title between 30-60 characters that includes your target keywords.',
        })
      }

      if (!metaTags.description || metaTags.description.length < 120) {
        issues.push({
          severity: 'warning',
          category: 'Meta Tags',
          title: 'Missing or Short Meta Description',
          description: 'The meta description is missing or too short. Descriptions should be 120-160 characters.',
          impact: 'Meta descriptions influence click-through rates from search results.',
          howToFix: 'Add a compelling meta description between 120-160 characters.',
        })
      }

      if (contentAnalysis.headingStructure.h1.length === 0) {
        issues.push({
          severity: 'critical',
          category: 'Content',
          title: 'Missing H1 Tag',
          description: 'The page is missing an H1 heading tag.',
          impact: 'H1 tags help search engines understand the main topic of your page.',
          howToFix: 'Add a single H1 tag that clearly describes the page content.',
        })
      }

      if (contentAnalysis.images.withoutAlt > 0) {
        issues.push({
          severity: 'warning',
          category: 'Accessibility',
          title: 'Images Without Alt Text',
          description: `${contentAnalysis.images.withoutAlt} images are missing alt text.`,
          impact: 'Alt text improves accessibility and helps search engines understand images.',
          howToFix: 'Add descriptive alt text to all images.',
        })
      }

      // Build technical data
      const technicalData: TechnicalSEOData = {
        loadTime: parseFloat(pageSpeedData.lighthouseResult?.audits?.['speed-index']?.displayValue?.replace(/[^0-9.]/g, '') || '0'),
        mobileUsability: scores.performance > 70,
        httpsEnabled: url.startsWith('https://'),
        robotsTxt: true, // Would need to check actual robots.txt
        sitemap: true, // Would need to check actual sitemap
        structuredData: [], // Would need to parse structured data
        canonicalUrl: url,
        metaTags,
      }

      // Build partial result for AI suggestions
      const partialResult = {
        scores,
        issues,
        technicalData,
        contentAnalysis,
      }

      // Generate AI-powered suggestions
      const suggestions = await this.generateAISuggestions(partialResult)

      return {
        url,
        timestamp: new Date(),
        scores,
        issues,
        suggestions,
        technicalData,
        contentAnalysis,
      }
    } catch (error) {
      if (error instanceof AIError) {
        throw error
      }
      throw new AIError(
        'Failed to complete SEO analysis',
        'ANALYSIS_ERROR',
        500,
        { url, error }
      )
    }
  }

  static async analyzeCompetitors(
    domain: string,
    competitors: string[]
  ): Promise<CompetitorData[]> {
    // In production, this would use APIs like Ahrefs, SEMrush, or Moz
    // For now, we'll use AI to generate realistic competitor analysis

    const prompt = `Analyze these competitor domains for ${domain}:
${competitors.join(', ')}

For each competitor, provide realistic SEO metrics in this JSON format:
[{
  "domain": "competitor.com",
  "metrics": {
    "domainAuthority": 50-100,
    "backlinks": estimated number,
    "organicTraffic": estimated monthly visitors,
    "topKeywords": ["keyword1", "keyword2", "keyword3"]
  }
}]`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: 'You are an SEO analyst. Provide realistic competitor metrics.' },
        { role: 'user', content: prompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 1000,
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '[]'
      
      try {
        return JSON.parse(response)
      } catch {
        return competitors.map(competitor => ({
          domain: competitor,
          metrics: {
            domainAuthority: Math.floor(Math.random() * 50) + 50,
            backlinks: Math.floor(Math.random() * 100000) + 1000,
            organicTraffic: Math.floor(Math.random() * 1000000) + 10000,
            topKeywords: ['keyword1', 'keyword2', 'keyword3'],
          },
        }))
      }
    } catch (error) {
      throw new AIError(
        'Failed to analyze competitors',
        'COMPETITOR_ANALYSIS_ERROR',
        500,
        { domain, competitors, error }
      )
    }
  }

  static async generateSEOContent(params: {
    topic: string
    keywords: string[]
    contentType: 'blog' | 'landing' | 'product'
    tone: 'professional' | 'casual' | 'technical'
    wordCount: number
  }): Promise<{
    title: string
    metaDescription: string
    content: string
    outline: string[]
  }> {
    const systemPrompt = `You are an SEO content writer. Create optimized content that:
1. Naturally incorporates the target keywords
2. Follows SEO best practices
3. Provides value to readers
4. Uses the specified tone
5. Meets the word count requirement`

    const userPrompt = `Create ${params.contentType} content about "${params.topic}"
Target keywords: ${params.keywords.join(', ')}
Tone: ${params.tone}
Word count: approximately ${params.wordCount}

Return JSON with:
- title: SEO-optimized title (50-60 chars)
- metaDescription: Meta description (150-160 chars)
- content: The full content with HTML formatting
- outline: Array of main headings`

    try {
      const completion = await openAIClient.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: Math.min(params.wordCount * 2, 4000),
      }) as OpenAI.Chat.ChatCompletion

      const response = completion.choices[0]?.message?.content || '{}'
      
      try {
        return JSON.parse(response)
      } catch {
        // Fallback if response isn't valid JSON
        return {
          title: params.topic,
          metaDescription: `Learn about ${params.topic}`,
          content: response,
          outline: [],
        }
      }
    } catch (error) {
      throw new AIError(
        'Failed to generate SEO content',
        'CONTENT_GENERATION_ERROR',
        500,
        { params, error }
      )
    }
  }
}

// Export singleton instance
export const seoAnalyzer = SEOAnalyzer
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { GradientText } from '@/components/ui/gradient-text'
import { 
  SparklesIcon, 
  ArrowLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface GeneratedContent {
  title: string
  metaDescription: string
  content: string
  excerpt: string
  suggestedKeywords: string[]
  internalLinks: Array<{
    anchor: string
    url: string
  }>
  readingTime: number
  seoScore: number
  outline?: Array<{
    heading: string
    subheadings: string[]
  }>
}

const CATEGORIES = [
  { id: 'ai-law-firm-management', name: 'AI Law Firm Management', color: '#3B82F6' },
  { id: 'legal-marketing-automation', name: 'Legal Marketing Automation', color: '#10B981' },
  { id: 'ai-video-for-law-firms', name: 'AI Video for Law Firms', color: '#8B5CF6' },
  { id: 'legal-tech-trends', name: 'Legal Tech Trends', color: '#F59E0B' },
  { id: 'law-firm-growth', name: 'Law Firm Growth', color: '#EF4444' }
]

const TONES = [
  { value: 'professional', label: 'Professional', description: 'Formal, authoritative tone for expert content' },
  { value: 'conversational', label: 'Conversational', description: 'Friendly, approachable tone for engagement' },
  { value: 'authoritative', label: 'Authoritative', description: 'Expert, confident tone for thought leadership' },
  { value: 'casual', label: 'Casual', description: 'Relaxed, accessible tone for broader appeal' }
]

const LENGTHS = [
  { value: 'short', label: 'Short Form', description: '800-1000 words', time: '4-5 min read' },
  { value: 'medium', label: 'Medium Form', description: '1500-2000 words', time: '8-10 min read' },
  { value: 'long', label: 'Long Form', description: '2500-3000 words', time: '12-15 min read' }
]

export default function BlogGenerator() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Form state
  const [topic, setTopic] = useState('')
  const [category, setCategory] = useState('')
  const [keywords, setKeywords] = useState('')
  const [tone, setTone] = useState('professional')
  const [length, setLength] = useState('medium')
  const [targetAudience, setTargetAudience] = useState('legal professionals')
  const [includeOutline, setIncludeOutline] = useState(false)
  const [seoFocus, setSeoFocus] = useState(true)
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [generationStep, setGenerationStep] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status])

  const handleGenerate = async () => {
    if (!topic || !category) {
      setError('Please provide a topic and select a category')
      return
    }

    setIsGenerating(true)
    setError('')
    setGenerationStep('Analyzing topic and keywords...')

    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k)
      
      setGenerationStep('Generating content structure...')
      
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic,
          category,
          keywords: keywordArray,
          tone,
          length,
          targetAudience,
          includeOutline,
          seoFocus
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      setGenerationStep('Optimizing SEO and formatting...')
      
      // Simulate additional processing time for better UX
      setTimeout(() => {
        setGeneratedContent(data)
        setIsGenerating(false)
        setGenerationStep('')
      }, 1000)

    } catch (error) {
      console.error('Generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate content')
      setIsGenerating(false)
      setGenerationStep('')
    }
  }

  const handleSavePost = async (status: 'draft' | 'published') => {
    if (!generatedContent) return

    try {
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: generatedContent.title,
          content: generatedContent.content,
          excerpt: generatedContent.excerpt,
          metaTitle: generatedContent.title,
          metaDescription: generatedContent.metaDescription,
          keywords: generatedContent.suggestedKeywords,
          status,
          aiGenerated: true,
          generationPrompt: `Topic: ${topic}, Category: ${category}, Tone: ${tone}, Length: ${length}`,
          categories: [CATEGORIES.find(c => c.id === category)?.id].filter(Boolean)
        })
      })

      if (response.ok) {
        router.push('/admin/blog')
      } else {
        throw new Error('Failed to save post')
      }
    } catch (error) {
      console.error('Save error:', error)
      setError('Failed to save the generated post')
    }
  }

  const getSEOScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSEOScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircleIcon className="h-5 w-5 text-green-500" />
    if (score >= 60) return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
    return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" asChild>
            <Link href="/admin/blog">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <GradientText>AI Blog Generator</GradientText>
          </h1>
          <p className="text-muted-foreground">
            Generate SEO-optimized blog content tailored for legal professionals
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Generation Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                Content Configuration
              </CardTitle>
              <CardDescription>
                Configure your blog post parameters for AI generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Blog Topic *</Label>
                <Input
                  id="topic"
                  placeholder="e.g., How AI is transforming legal document review"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Content Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Target Keywords</Label>
                <Input
                  id="keywords"
                  placeholder="AI legal tech, document automation, legal AI (comma-separated)"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter relevant keywords separated by commas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Writing Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div>
                            <div className="font-medium">{t.label}</div>
                            <div className="text-sm text-muted-foreground">{t.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content Length</Label>
                  <Select value={length} onValueChange={setLength}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LENGTHS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          <div>
                            <div className="font-medium">{l.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {l.description} • {l.time}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., legal professionals, law firm partners"
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="outline"
                    checked={includeOutline}
                    onChange={(e) => setIncludeOutline(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="outline">Include content outline</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="seo"
                    checked={seoFocus}
                    onChange={(e) => setSeoFocus(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="seo">Optimize for SEO</Label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !topic || !category}
                className="w-full"
              >
                {isGenerating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {generationStep}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    Generate Blog Post
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Generated Content Preview */}
        <div className="space-y-6">
          {generatedContent ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Content</CardTitle>
                  <div className="flex items-center gap-2">
                    {getSEOScoreIcon(generatedContent.seoScore)}
                    <span className={`font-bold ${getSEOScoreColor(generatedContent.seoScore)}`}>
                      SEO Score: {generatedContent.seoScore}/100
                    </span>
                  </div>
                </div>
                <CardDescription>
                  Review and customize your AI-generated blog post
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="seo">SEO Details</TabsTrigger>
                    {generatedContent.outline && (
                      <TabsTrigger value="outline">Outline</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="preview" className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{generatedContent.title}</h2>
                      <p className="text-muted-foreground mb-4">{generatedContent.excerpt}</p>
                      
                      <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          {generatedContent.readingTime} min read
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpenIcon className="h-4 w-4" />
                          {generatedContent.content.split(' ').length} words
                        </div>
                      </div>
                      
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: generatedContent.content }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="seo" className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Meta Title</h3>
                      <p className="text-sm bg-muted p-2 rounded">{generatedContent.title}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Meta Description</h3>
                      <p className="text-sm bg-muted p-2 rounded">{generatedContent.metaDescription}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Target Keywords</h3>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.suggestedKeywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary">{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    {generatedContent.internalLinks && generatedContent.internalLinks.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Internal Linking Opportunities</h3>
                        <div className="space-y-2">
                          {generatedContent.internalLinks.map((link, index) => (
                            <div key={index} className="text-sm bg-muted p-2 rounded">
                              <strong>{link.anchor}</strong> → {link.url}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  {generatedContent.outline && (
                    <TabsContent value="outline">
                      <div className="space-y-4">
                        {generatedContent.outline.map((section, index) => (
                          <div key={index}>
                            <h3 className="font-semibold">{section.heading}</h3>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                              {section.subheadings.map((sub, subIndex) => (
                                <li key={subIndex} className="text-sm text-muted-foreground">{sub}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
                
                <div className="flex gap-3 mt-6">
                  <Button onClick={() => handleSavePost('draft')} variant="outline">
                    Save as Draft
                  </Button>
                  <Button onClick={() => handleSavePost('published')}>
                    Publish Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <SparklesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ready to Generate</h3>
                <p className="text-muted-foreground">
                  Fill in the form and click "Generate Blog Post" to create your content
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GradientText } from '@/components/ui/gradient-text'
import { 
  CalendarIcon, 
  ClockIcon, 
  EyeIcon,
  ShareIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  TagIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  featuredImage?: string
  publishedAt: string
  updatedAt: string
  readingTime: number
  views: number
  shares: number
  seoScore: number
  metaTitle?: string
  metaDescription?: string
  keywords: string[]
  schemaMarkup?: any
  categories: Array<{
    id: string
    name: string
    slug: string
    color: string
  }>
  tags: Array<{
    id: string
    name: string
    slug: string
  }>
  author: {
    id: string
    name: string
    email: string
  }
  internalLinks?: Array<{
    anchor: string
    url: string
  }>
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  readingTime: number
  publishedAt: string
  categories: Array<{
    name: string
    color: string
  }>
}

// This would fetch from your API
async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Mock data for development - replace with actual API call
    if (slug === 'ai-revolutionizing-legal-document-review') {
      return {
        id: '1',
        title: 'How AI is Revolutionizing Legal Document Review',
        slug: 'ai-revolutionizing-legal-document-review',
        content: `
          <div class="prose prose-lg max-w-none">
            <p class="lead">The legal industry is experiencing a seismic shift as artificial intelligence transforms one of its most time-consuming processes: document review. What once required armies of junior associates working around the clock can now be accomplished with unprecedented speed and accuracy.</p>

            <h2>The Traditional Document Review Challenge</h2>
            <p>Traditional document review has long been the bane of legal practice. Large litigation cases can involve millions of documents, requiring countless hours of manual review to identify relevant materials, privileged communications, and key evidence.</p>

            <blockquote>
              <p>"Before AI, we would spend 60-70% of our project budgets on document review alone. Now, we're seeing that reduced to 20-30% while improving accuracy." - Sarah Chen, Managing Partner</p>
            </blockquote>

            <h2>How AI is Changing the Game</h2>
            <p>Modern AI-powered document review platforms leverage several cutting-edge technologies:</p>

            <h3>Natural Language Processing (NLP)</h3>
            <p>Advanced NLP algorithms can understand context, identify relationships between documents, and recognize privileged communications with remarkable accuracy.</p>

            <h3>Machine Learning Models</h3>
            <p>These systems learn from each review, becoming more accurate over time and adapting to specific case requirements and firm preferences.</p>

            <h3>Predictive Coding</h3>
            <p>Technology-assisted review (TAR) uses predictive algorithms to categorize documents based on relevance, significantly reducing manual review time.</p>

            <h2>Real-World Impact and Results</h2>
            <p>Law firms implementing AI document review solutions are seeing transformative results:</p>

            <ul>
              <li><strong>300% increase in efficiency:</strong> What took months now takes weeks</li>
              <li><strong>95% accuracy rates:</strong> Exceeding human-only review capabilities</li>
              <li><strong>60% cost reduction:</strong> Dramatic savings on large-scale reviews</li>
              <li><strong>24/7 processing:</strong> Continuous document analysis without human fatigue</li>
            </ul>

            <h2>Implementation Best Practices</h2>
            <p>Successfully implementing AI document review requires careful planning:</p>

            <h3>1. Data Preparation</h3>
            <p>Ensure documents are properly formatted and organized before feeding them into AI systems.</p>

            <h3>2. Training and Validation</h3>
            <p>Invest time in training the AI system with your specific case requirements and validation protocols.</p>

            <h3>3. Human Oversight</h3>
            <p>Maintain qualified human reviewers for quality control and complex decision-making.</p>

            <h3>4. Continuous Monitoring</h3>
            <p>Regularly assess and refine AI performance to ensure optimal results.</p>

            <h2>The Future of Legal Document Review</h2>
            <p>As AI technology continues to advance, we can expect even more sophisticated capabilities:</p>

            <ul>
              <li>Real-time document analysis during depositions</li>
              <li>Automated privilege logs and redaction</li>
              <li>Cross-language document review capabilities</li>
              <li>Integration with case management systems</li>
            </ul>

            <h2>Getting Started with AI Document Review</h2>
            <p>If you're considering implementing AI document review in your practice, start with these steps:</p>

            <ol>
              <li>Assess your current document review processes and pain points</li>
              <li>Research AI platforms that align with your practice areas</li>
              <li>Pilot the technology on a smaller case to evaluate effectiveness</li>
              <li>Train your team on the new workflows and best practices</li>
              <li>Gradually expand implementation across larger matters</li>
            </ol>

            <p>The future of legal practice is here, and AI document review is just the beginning. Firms that embrace these technologies now will gain a significant competitive advantage in efficiency, accuracy, and client value.</p>
          </div>
        `,
        excerpt: 'Discover how artificial intelligence is transforming the way law firms handle document review, increasing efficiency by up to 300% while reducing costs.',
        publishedAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        readingTime: 8,
        views: 2547,
        shares: 156,
        seoScore: 95,
        metaTitle: 'How AI is Revolutionizing Legal Document Review | HODOS 360',
        metaDescription: 'Discover how artificial intelligence is transforming legal document review, increasing efficiency by 300% while reducing costs. Expert insights from HODOS 360.',
        keywords: ['AI document review', 'legal technology', 'document automation', 'legal AI', 'predictive coding'],
        categories: [
          { id: '1', name: 'AI Law Firm Management', slug: 'ai-law-firm-management', color: '#3B82F6' }
        ],
        tags: [
          { id: '1', name: 'AI Technology', slug: 'ai-technology' },
          { id: '2', name: 'Document Review', slug: 'document-review' },
          { id: '3', name: 'Legal Automation', slug: 'legal-automation' }
        ],
        author: {
          id: '1',
          name: 'Sarah Chen',
          email: 'sarah@hodos360.com'
        }
      }
    }
    return null
  } catch (error) {
    return null
  }
}

async function getRelatedPosts(currentSlug: string): Promise<RelatedPost[]> {
  // Mock related posts
  return [
    {
      id: '2',
      title: 'The Ultimate Guide to Legal Marketing Automation',
      slug: 'ultimate-guide-legal-marketing-automation',
      excerpt: 'Learn how to implement marketing automation to generate 40% more qualified leads.',
      readingTime: 12,
      publishedAt: '2024-01-12T14:30:00Z',
      categories: [{ name: 'Legal Marketing', color: '#10B981' }]
    },
    {
      id: '3',
      title: 'AI Video Agents: The Future of Client Intake',
      slug: 'ai-video-agents-future-client-intake',
      excerpt: 'Explore how AI-powered video agents are transforming client intake processes.',
      readingTime: 6,
      publishedAt: '2024-01-10T09:15:00Z',
      categories: [{ name: 'AI Video Technology', color: '#8B5CF6' }]
    }
  ]
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | HODOS 360',
      description: 'The requested blog post could not be found.'
    }
  }

  return {
    title: post.metaTitle || `${post.title} | HODOS 360`,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords.join(', '),
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags.map(tag => tag.name)
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt
    }
  }
}

function TableOfContents({ content }: { content: string }) {
  // Extract headings from content (simplified implementation)
  const headings = content.match(/<h[2-3][^>]*>([^<]+)<\/h[2-3]>/g) || []
  
  if (headings.length === 0) return null

  return (
    <Card className="lg:sticky lg:top-8 bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BookmarkIcon className="h-5 w-5" />
          Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <nav className="space-y-2">
          {headings.map((heading, index) => {
            const text = heading.replace(/<[^>]+>/g, '')
            const level = heading.match(/h([2-3])/)?.[1]
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            
            return (
              <a
                key={index}
                href={`#${id}`}
                className={`block text-sm hover:text-primary transition-colors ${
                  level === '3' ? 'ml-4 text-muted-foreground' : 'font-medium'
                }`}
              >
                {text}
              </a>
            )
          })}
        </nav>
      </CardContent>
    </Card>
  )
}

function ShareButtons({ post }: { post: BlogPost }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  }

  return (
    <Card className="bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShareIcon className="h-4 w-4" />
            Share this article:
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href={shareLinks.twitter} target="_blank" rel="noopener">
                Twitter
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={shareLinks.linkedin} target="_blank" rel="noopener">
                LinkedIn
              </a>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={shareLinks.facebook} target="_blank" rel="noopener">
                Facebook
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RelatedPostCard({ post }: { post: RelatedPost }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {post.categories.map((category) => (
              <Badge 
                key={category.name}
                variant="secondary"
                style={{ backgroundColor: category.color + '20', color: category.color }}
              >
                {category.name}
              </Badge>
            ))}
          </div>
          
          <h3 className="font-semibold text-lg hover:text-primary transition-colors">
            <Link href={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </h3>
          
          <p className="text-muted-foreground text-sm line-clamp-2">
            {post.excerpt}
          </p>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="h-4 w-4" />
                {post.readingTime} min
              </div>
            </div>
            
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/blog/${post.slug}`}>
                Read More
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function BlogPostPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const [post, relatedPosts] = await Promise.all([
    getBlogPost(params.slug),
    getRelatedPosts(params.slug)
  ])

  if (!post) {
    notFound()
  }

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name
    },
    publisher: {
      '@type': 'Organization',
      name: 'HODOS 360 LLC',
      logo: {
        '@type': 'ImageObject',
        url: '/images/hodos-logo.svg'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `/blog/${post.slug}`
    },
    articleSection: post.categories.map(cat => cat.name),
    keywords: post.keywords.join(', '),
    wordCount: post.content.split(' ').length,
    timeRequired: `PT${post.readingTime}M`
  }

  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Navigation */}
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/blog">
              <ChevronLeftIcon className="h-4 w-4 mr-2" />
              Back to Blog
            </Link>
          </Button>
        </div>

        {/* Article Header */}
        <article className="container mx-auto px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <header className="mb-12">
              <div className="flex flex-wrap gap-2 mb-6">
                {post.categories.map((category) => (
                  <Badge 
                    key={category.id}
                    variant="secondary"
                    className="font-medium"
                    style={{ backgroundColor: category.color + '20', color: category.color }}
                  >
                    <Link href={`/blog/category/${category.slug}`}>
                      {category.name}
                    </Link>
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                <GradientText>{post.title}</GradientText>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                {post.excerpt}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{post.author.name}</div>
                    <div className="text-xs">Legal Tech Specialist</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  {post.readingTime} min read
                </div>
                
                <div className="flex items-center gap-1">
                  <EyeIcon className="h-4 w-4" />
                  {post.views.toLocaleString()} views
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-xs">
                    <TagIcon className="h-3 w-3 mr-1" />
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </header>

            <div className="grid lg:grid-cols-4 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-3">
                <div className="mb-8">
                  <ShareButtons post={post} />
                </div>
                
                <div 
                  className="prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                
                <div className="mt-12 pt-8 border-t">
                  <ShareButtons post={post} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1 space-y-8">
                <Suspense fallback={<div className="h-64 bg-muted animate-pulse rounded-lg"></div>}>
                  <TableOfContents content={post.content} />
                </Suspense>
                
                {/* Back to Top */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <ArrowUpIcon className="h-4 w-4 mr-2" />
                  Back to Top
                </Button>
              </div>
            </div>
          </div>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="max-w-6xl mx-auto mt-20">
              <h2 className="text-3xl font-bold mb-8 text-center">
                <GradientText>Related Articles</GradientText>
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <RelatedPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </section>
          )}

          {/* Newsletter CTA */}
          <section className="max-w-4xl mx-auto mt-20">
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 text-center">
              <CardContent className="p-12">
                <h3 className="text-2xl font-bold mb-4">
                  <GradientText>Stay Ahead of Legal Tech Trends</GradientText>
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Get expert insights on AI law firm management, legal marketing automation, 
                  and cutting-edge legal technology delivered to your inbox weekly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg border bg-white/50 backdrop-blur-sm"
                  />
                  <Button>Subscribe</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Join 5,000+ legal professionals. No spam, unsubscribe anytime.
                </p>
              </CardContent>
            </Card>
          </section>
        </article>
      </div>
    </>
  )
}
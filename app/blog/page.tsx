import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { GradientText } from '@/components/ui/gradient-text'
import { 
  CalendarIcon, 
  ClockIcon, 
  EyeIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ChevronRightIcon,
  BookOpenIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Legal Tech Blog | HODOS 360 - AI Law Firm Management Insights',
  description: 'Expert insights on AI law firm management, legal marketing automation, and legal technology trends. Stay ahead with HODOS 360\'s cutting-edge legal tech knowledge.',
  keywords: 'legal tech blog, AI law firm management, legal marketing, law firm automation, legal technology trends',
  openGraph: {
    title: 'Legal Tech Blog | HODOS 360',
    description: 'Expert insights on AI law firm management, legal marketing automation, and legal technology trends.',
    type: 'website',
    url: '/blog'
  }
}

// This would typically fetch from your API
async function getBlogPosts() {
  // Mock data for development - replace with actual API call
  return {
    posts: [
      {
        id: '1',
        title: 'How AI is Revolutionizing Legal Document Review',
        slug: 'ai-revolutionizing-legal-document-review',
        excerpt: 'Discover how artificial intelligence is transforming the way law firms handle document review, increasing efficiency by up to 300% while reducing costs.',
        featuredImage: '/images/blog/ai-document-review.jpg',
        publishedAt: '2024-01-15T10:00:00Z',
        readingTime: 8,
        views: 2547,
        categories: [
          { name: 'AI Law Firm Management', slug: 'ai-law-firm-management', color: '#3B82F6' }
        ],
        tags: [
          { name: 'AI Technology', slug: 'ai-technology' },
          { name: 'Document Review', slug: 'document-review' },
          { name: 'Legal Automation', slug: 'legal-automation' }
        ],
        author: {
          name: 'Sarah Chen',
          role: 'Legal Tech Specialist'
        }
      },
      {
        id: '2',
        title: 'The Ultimate Guide to Legal Marketing Automation',
        slug: 'ultimate-guide-legal-marketing-automation',
        excerpt: 'Learn how to implement marketing automation to generate 40% more qualified leads and reduce client acquisition costs for your law firm.',
        featuredImage: '/images/blog/legal-marketing-automation.jpg',
        publishedAt: '2024-01-12T14:30:00Z',
        readingTime: 12,
        views: 1823,
        categories: [
          { name: 'Legal Marketing', slug: 'legal-marketing-automation', color: '#10B981' }
        ],
        tags: [
          { name: 'Marketing Automation', slug: 'marketing-automation' },
          { name: 'Lead Generation', slug: 'lead-generation' },
          { name: 'SEO', slug: 'seo' }
        ],
        author: {
          name: 'Michael Rodriguez',
          role: 'Marketing Director'
        }
      },
      {
        id: '3',
        title: 'AI Video Agents: The Future of Client Intake',
        slug: 'ai-video-agents-future-client-intake',
        excerpt: 'Explore how AI-powered video agents are transforming client intake processes, providing 24/7 availability and improving conversion rates by 60%.',
        featuredImage: '/images/blog/ai-video-agents.jpg',
        publishedAt: '2024-01-10T09:15:00Z',
        readingTime: 6,
        views: 1456,
        categories: [
          { name: 'AI Video Technology', slug: 'ai-video-for-law-firms', color: '#8B5CF6' }
        ],
        tags: [
          { name: 'Video AI', slug: 'video-ai' },
          { name: 'Client Intake', slug: 'client-intake' },
          { name: 'Automation', slug: 'automation' }
        ],
        author: {
          name: 'David Kim',
          role: 'AI Solutions Architect'
        }
      }
    ],
    categories: [
      { name: 'AI Law Firm Management', slug: 'ai-law-firm-management', color: '#3B82F6', count: 15 },
      { name: 'Legal Marketing', slug: 'legal-marketing-automation', color: '#10B981', count: 12 },
      { name: 'AI Video Technology', slug: 'ai-video-for-law-firms', color: '#8B5CF6', count: 8 },
      { name: 'Legal Tech Trends', slug: 'legal-tech-trends', color: '#F59E0B', count: 10 },
      { name: 'Law Firm Growth', slug: 'law-firm-growth', color: '#EF4444', count: 7 }
    ],
    featuredPosts: [
      {
        id: '4',
        title: '2024 Legal Technology Trends: What Law Firms Need to Know',
        slug: '2024-legal-technology-trends',
        excerpt: 'Stay ahead of the curve with our comprehensive analysis of the top legal technology trends shaping the industry in 2024.',
        readingTime: 10,
        category: { name: 'Legal Tech Trends', color: '#F59E0B' }
      }
    ]
  }
}

function BlogPostCard({ post }: { post: any }) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/50 backdrop-blur-sm">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
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
        </div>
        
        <div>
          <CardTitle className="text-xl mb-3 group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/blog/${post.slug}`}>
              {post.title}
            </Link>
          </CardTitle>
          <CardDescription className="text-base line-clamp-3">
            {post.excerpt}
          </CardDescription>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {post.categories.map((category: any) => (
            <Badge 
              key={category.slug} 
              variant="secondary"
              className="font-medium"
              style={{ backgroundColor: category.color + '20', color: category.color }}
            >
              <Link href={`/blog/category/${category.slug}`}>
                {category.name}
              </Link>
            </Badge>
          ))}
          {post.tags.slice(0, 3).map((tag: any) => (
            <Badge key={tag.slug} variant="outline" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {post.author.name.split(' ').map((n: string) => n[0]).join('')}
              </span>
            </div>
            <div>
              <div className="font-medium text-sm">{post.author.name}</div>
              <div className="text-xs text-muted-foreground">{post.author.role}</div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" asChild className="group-hover:bg-primary/10 transition-colors">
            <Link href={`/blog/${post.slug}`}>
              Read More
              <ChevronRightIcon className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CategoryCard({ category }: { category: any }) {
  return (
    <Link href={`/blog/category/${category.slug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <h3 className="font-semibold">{category.name}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {category.count} {category.count === 1 ? 'post' : 'posts'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function FeaturedPostCard({ post }: { post: any }) {
  return (
    <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <SparklesIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <Badge className="mb-2" style={{ backgroundColor: post.category.color }}>
              Featured
            </Badge>
            <h3 className="text-lg font-semibold mb-2">
              <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                {post.title}
              </Link>
            </h3>
            <p className="text-muted-foreground mb-3">{post.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
                {post.readingTime} min read
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/blog/${post.slug}`}>
                  Read Featured Post
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function BlogPage() {
  const { posts, categories, featuredPosts } = await getBlogPosts()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              <GradientText>Legal Tech Insights</GradientText>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Stay ahead with expert insights on AI law firm management, legal marketing automation, 
              and the latest trends shaping the future of legal technology.
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-12">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{posts.length}+ Expert Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-secondary" />
                <span className="text-sm font-medium">Weekly Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">AI-Powered Insights</span>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search articles..." 
                className="pl-10 bg-white/50 backdrop-blur-sm border-primary/20"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">
              <GradientText>Featured Articles</GradientText>
            </h2>
            <div className="grid gap-6">
              {featuredPosts.map((post) => (
                <FeaturedPostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Latest Articles</h2>
              <div className="text-sm text-muted-foreground">
                Showing {posts.length} articles
              </div>
            </div>
            
            <Suspense fallback={
              <div className="grid gap-8">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-muted rounded w-20"></div>
                        <div className="h-6 bg-muted rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }>
              <div className="grid gap-8">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            </Suspense>

            {/* Load More Button */}
            <div className="text-center mt-12">
              <Button size="lg" variant="outline" className="bg-white/50 backdrop-blur-sm">
                Load More Articles
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Categories */}
            <div>
              <h3 className="text-xl font-bold mb-6">Categories</h3>
              <div className="grid gap-4">
                {categories.map((category) => (
                  <CategoryCard key={category.slug} category={category} />
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  Stay Updated
                </CardTitle>
                <CardDescription>
                  Get the latest legal tech insights delivered to your inbox weekly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Enter your email" className="bg-white/50" />
                <Button className="w-full">Subscribe to Newsletter</Button>
                <p className="text-xs text-muted-foreground text-center">
                  Join 5,000+ legal professionals staying ahead of the curve.
                </p>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <div>
              <h3 className="text-xl font-bold mb-6">Popular Topics</h3>
              <div className="flex flex-wrap gap-2">
                {['AI Technology', 'Legal Automation', 'Document Review', 'Marketing Automation', 
                  'Client Intake', 'SEO for Lawyers', 'Practice Management', 'Legal Tech Trends'].map((tag) => (
                  <Badge key={tag} variant="outline" className="hover:bg-primary/10 cursor-pointer">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
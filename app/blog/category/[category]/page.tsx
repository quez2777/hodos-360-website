import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { GradientText } from '@/components/ui/gradient-text'
import { 
  CalendarIcon, 
  ClockIcon, 
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface CategoryData {
  id: string
  name: string
  slug: string
  description: string
  color: string
  seoTitle?: string
  seoDescription?: string
  postCount: number
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  publishedAt: string
  readingTime: number
  views: number
  author: {
    name: string
    role: string
  }
  tags: Array<{
    name: string
    slug: string
  }>
}

const CATEGORIES = {
  'ai-law-firm-management': {
    id: '1',
    name: 'AI Law Firm Management',
    slug: 'ai-law-firm-management',
    description: 'Discover how artificial intelligence is transforming law firm operations, from case management to client relationships and practice efficiency.',
    color: '#3B82F6',
    seoTitle: 'AI Law Firm Management Articles | HODOS 360',
    seoDescription: 'Expert insights on AI-powered law firm management, automation tools, and digital transformation strategies for modern legal practices.',
    postCount: 15
  },
  'legal-marketing-automation': {
    id: '2',
    name: 'Legal Marketing Automation',
    slug: 'legal-marketing-automation',
    description: 'Learn about digital marketing strategies, SEO for lawyers, content marketing, and automated client acquisition systems.',
    color: '#10B981',
    seoTitle: 'Legal Marketing Automation | HODOS 360',
    seoDescription: 'Comprehensive guides on legal marketing automation, SEO strategies, and digital marketing tools for law firms.',
    postCount: 12
  },
  'ai-video-for-law-firms': {
    id: '3',
    name: 'AI Video for Law Firms',
    slug: 'ai-video-for-law-firms',
    description: 'Explore AI-powered video solutions for client intake, virtual receptionists, and automated client communication.',
    color: '#8B5CF6',
    seoTitle: 'AI Video Solutions for Law Firms | HODOS 360',
    seoDescription: 'Discover AI video agents, virtual receptionists, and automated client intake solutions for modern law firms.',
    postCount: 8
  },
  'legal-tech-trends': {
    id: '4',
    name: 'Legal Tech Trends',
    slug: 'legal-tech-trends',
    description: 'Stay updated with the latest trends in legal technology, industry innovations, and future predictions.',
    color: '#F59E0B',
    seoTitle: 'Legal Technology Trends | HODOS 360',
    seoDescription: 'Latest legal technology trends, industry insights, and future innovations shaping the legal industry.',
    postCount: 10
  },
  'law-firm-growth': {
    id: '5',
    name: 'Law Firm Growth',
    slug: 'law-firm-growth',
    description: 'Business development strategies, scaling techniques, and practice management insights for growing law firms.',
    color: '#EF4444',
    seoTitle: 'Law Firm Growth Strategies | HODOS 360',
    seoDescription: 'Expert advice on law firm growth, business development, and practice management strategies.',
    postCount: 7
  }
}

// Mock function to get category posts - replace with actual API call
async function getCategoryPosts(categorySlug: string): Promise<BlogPost[]> {
  // Mock data based on category
  const basePosts = [
    {
      id: '1',
      title: 'How AI is Revolutionizing Legal Document Review',
      slug: 'ai-revolutionizing-legal-document-review',
      excerpt: 'Discover how artificial intelligence is transforming the way law firms handle document review, increasing efficiency by up to 300% while reducing costs.',
      publishedAt: '2024-01-15T10:00:00Z',
      readingTime: 8,
      views: 2547,
      author: {
        name: 'Sarah Chen',
        role: 'Legal Tech Specialist'
      },
      tags: [
        { name: 'AI Technology', slug: 'ai-technology' },
        { name: 'Document Review', slug: 'document-review' }
      ]
    },
    {
      id: '2',
      title: 'Implementing AI Case Management Systems',
      slug: 'implementing-ai-case-management-systems',
      excerpt: 'A comprehensive guide to selecting and implementing AI-powered case management systems that streamline your practice.',
      publishedAt: '2024-01-12T14:30:00Z',
      readingTime: 10,
      views: 1823,
      author: {
        name: 'Michael Rodriguez',
        role: 'Practice Management Expert'
      },
      tags: [
        { name: 'Case Management', slug: 'case-management' },
        { name: 'AI Integration', slug: 'ai-integration' }
      ]
    },
    {
      id: '3',
      title: 'AI-Powered Client Intake Optimization',
      slug: 'ai-powered-client-intake-optimization',
      excerpt: 'Learn how AI can transform your client intake process, improving conversion rates and client satisfaction.',
      publishedAt: '2024-01-10T09:15:00Z',
      readingTime: 6,
      views: 1456,
      author: {
        name: 'Emily Watson',
        role: 'Client Experience Director'
      },
      tags: [
        { name: 'Client Intake', slug: 'client-intake' },
        { name: 'Process Optimization', slug: 'process-optimization' }
      ]
    }
  ]

  // Filter posts based on category (in a real app, this would be a proper API call)
  return basePosts
}

export async function generateMetadata({ 
  params 
}: { 
  params: { category: string } 
}): Promise<Metadata> {
  const categoryData = CATEGORIES[params.category as keyof typeof CATEGORIES]
  
  if (!categoryData) {
    return {
      title: 'Category Not Found | HODOS 360',
      description: 'The requested category could not be found.'
    }
  }

  return {
    title: categoryData.seoTitle || `${categoryData.name} | HODOS 360 Blog`,
    description: categoryData.seoDescription || categoryData.description,
    openGraph: {
      title: categoryData.name,
      description: categoryData.description,
      type: 'website',
      url: `/blog/category/${categoryData.slug}`
    }
  }
}

function CategoryPostCard({ post }: { post: BlogPost }) {
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
          {post.tags.map((tag) => (
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

export default async function CategoryPage({ 
  params 
}: { 
  params: { category: string } 
}) {
  const categoryData = CATEGORIES[params.category as keyof typeof CATEGORIES]
  
  if (!categoryData) {
    notFound()
  }

  const posts = await getCategoryPosts(params.category)

  // JSON-LD structured data for category
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryData.name,
    description: categoryData.description,
    url: `/blog/category/${categoryData.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'HODOS 360 LLC'
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'BlogPosting',
        position: index + 1,
        headline: post.title,
        description: post.excerpt,
        url: `/blog/${post.slug}`,
        datePublished: post.publishedAt,
        author: {
          '@type': 'Person',
          name: post.author.name
        }
      }))
    }
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

        {/* Category Header */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div 
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: categoryData.color }}
              />
              <FolderIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              <GradientText>{categoryData.name}</GradientText>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {categoryData.description}
            </p>
            
            <div className="flex items-center justify-center gap-6 mb-12">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" style={{ color: categoryData.color }} />
                <span className="text-sm font-medium">
                  {posts.length} {posts.length === 1 ? 'Article' : 'Articles'}
                </span>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder={`Search ${categoryData.name.toLowerCase()} articles...`}
                className="pl-10 bg-white/50 backdrop-blur-sm border-primary/20"
              />
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="container mx-auto px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            {posts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold">
                    Latest in {categoryData.name}
                  </h2>
                  <div className="text-sm text-muted-foreground">
                    Showing {posts.length} {posts.length === 1 ? 'article' : 'articles'}
                  </div>
                </div>
                
                <div className="grid gap-8">
                  {posts.map((post) => (
                    <CategoryPostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Load More - for future implementation */}
                <div className="text-center mt-12">
                  <Button size="lg" variant="outline" className="bg-white/50 backdrop-blur-sm">
                    Load More Articles
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <DocumentTextIcon className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">No Articles Yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  We're working on creating amazing content for the {categoryData.name} category. 
                  Check back soon for expert insights and practical guides.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild>
                    <Link href="/blog">Browse All Articles</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact">Suggest a Topic</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Related Categories */}
        <section className="container mx-auto px-4 pb-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">
              <GradientText>Explore Other Categories</GradientText>
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.values(CATEGORIES)
                .filter(cat => cat.slug !== categoryData.slug)
                .map((category) => (
                  <Link key={category.slug} href={`/blog/category/${category.slug}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-white/30 backdrop-blur-sm h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <h3 className="font-semibold text-sm">{category.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              }
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="container mx-auto px-4 pb-20">
          <div className="max-w-4xl mx-auto">
            <Card 
              className="border-2 text-center"
              style={{ 
                backgroundColor: categoryData.color + '10',
                borderColor: categoryData.color + '40'
              }}
            >
              <CardContent className="p-12">
                <h3 className="text-2xl font-bold mb-4">
                  <GradientText>Stay Updated on {categoryData.name}</GradientText>
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Get the latest insights and expert advice on {categoryData.name.toLowerCase()} 
                  delivered directly to your inbox. Join thousands of legal professionals staying ahead of the curve.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 rounded-lg border bg-white/50 backdrop-blur-sm"
                  />
                  <Button style={{ backgroundColor: categoryData.color }}>
                    Subscribe
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Weekly updates • No spam • Unsubscribe anytime
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  )
}
'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GradientText } from '@/components/ui/gradient-text'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon, 
  CalendarIcon,
  ChartBarIcon,
  SparklesIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  publishedAt: string | null
  scheduledFor: string | null
  views: number
  readingTime: number
  aiGenerated: boolean
  seoScore: number
  author: {
    name: string
    email: string
  }
  categories: Array<{
    id: string
    name: string
    color: string
  }>
  createdAt: string
  updatedAt: string
}

interface Analytics {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  scheduledPosts: number
  totalViews: number
  avgSeoScore: number
  recentActivity: Array<{
    type: 'created' | 'published' | 'updated'
    post: string
    date: string
  }>
}

export default function BlogDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchPosts()
    fetchAnalytics()
  }, [session, status])

  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/blog?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/blog/analytics')
      const data = await response.json()
      
      if (response.ok) {
        // Mock analytics structure for now
        setAnalytics({
          totalPosts: data.overview?.totalViews || 0,
          publishedPosts: posts.filter(p => p.status === 'published').length,
          draftPosts: posts.filter(p => p.status === 'draft').length,
          scheduledPosts: posts.filter(p => p.status === 'scheduled').length,
          totalViews: data.overview?.totalViews || 0,
          avgSeoScore: 85,
          recentActivity: []
        })
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/blog/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'scheduled': return <CalendarIcon className="h-4 w-4 text-blue-500" />
      case 'draft': return <DocumentTextIcon className="h-4 w-4 text-gray-500" />
      default: return <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      default: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || 
                           post.categories.some(cat => cat.id === categoryFilter)
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <GradientText>Blog Management</GradientText>
            </h1>
            <p className="text-muted-foreground">
              Create, manage, and optimize your blog content for maximum SEO impact
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/admin/blog/generate">
                <SparklesIcon className="h-4 w-4 mr-2" />
                AI Generate
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/blog/schedule">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/blog/analytics">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Analytics
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Posts</CardDescription>
              <CardTitle className="text-2xl">{analytics.totalPosts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-2xl text-green-600">{analytics.publishedPosts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Views</CardDescription>
              <CardTitle className="text-2xl">{analytics.totalViews.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg SEO Score</CardDescription>
              <CardTitle className="text-2xl text-blue-600">{analytics.avgSeoScore}/100</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="posts">All Posts</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({posts.filter(p => p.status === 'draft').length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({posts.filter(p => p.status === 'scheduled').length})</TabsTrigger>
          <TabsTrigger value="published">Published ({posts.filter(p => p.status === 'published').length})</TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="posts" className="space-y-4">
          <div className="grid gap-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(post.status)}
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                        {post.aiGenerated && (
                          <Badge variant="outline">
                            <SparklesIcon className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <EyeIcon className="h-4 w-4" />
                          {post.views}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ClockIcon className="h-4 w-4" />
                          {post.readingTime}min
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                      <p className="text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {post.categories.map((category) => (
                          <Badge 
                            key={category.id} 
                            variant="secondary"
                            style={{ backgroundColor: category.color + '20', color: category.color }}
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>By {post.author.name}</span>
                        <span>
                          {post.status === 'published' && post.publishedAt 
                            ? `Published ${new Date(post.publishedAt).toLocaleDateString()}`
                            : post.status === 'scheduled' && post.scheduledFor
                            ? `Scheduled for ${new Date(post.scheduledFor).toLocaleDateString()}`
                            : `Updated ${new Date(post.updatedAt).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">SEO Score</div>
                        <div className={`text-lg font-bold ${
                          post.seoScore >= 80 ? 'text-green-600' : 
                          post.seoScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {post.seoScore || 0}/100
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/admin/blog/edit/${post.id}`}>
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deletePost(post.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first blog post'
                }
              </p>
              <Button asChild>
                <Link href="/admin/blog/generate">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Post
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts">
          <div className="grid gap-4">
            {posts.filter(p => p.status === 'draft').map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                {/* Same card content as above but filtered for drafts */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled">
          <div className="grid gap-4">
            {posts.filter(p => p.status === 'scheduled').map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                {/* Same card content as above but filtered for scheduled */}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="published">
          <div className="grid gap-4">
            {posts.filter(p => p.status === 'published').map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                {/* Same card content as above but filtered for published */}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
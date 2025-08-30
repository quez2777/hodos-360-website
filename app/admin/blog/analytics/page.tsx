'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GradientText } from '@/components/ui/gradient-text'
import { Progress } from '@/components/ui/progress'
import { 
  ChartBarIcon, 
  ArrowLeftIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  overview: {
    totalViews: number
    viewsGrowth: number
    uniqueViews: number
    uniqueViewsGrowth: number
    socialShares: number
    avgTimeOnPage: number
    avgBounceRate: number
    avgClickThroughRate: number
    organicTraffic: number
    referralTraffic: number
  }
  topPosts: Array<{
    id: string
    title: string
    slug: string
    views: number
    publishedAt: string
    categories: Array<{
      name: string
      color: string
    }>
    totalAnalytics: number
  }>
  categoryPerformance: Array<{
    id: string
    name: string
    slug: string
    color: string
    totalPosts: number
    totalViews: number
    avgViews: number
  }>
  recentPosts: Array<{
    id: string
    title: string
    slug: string
    publishedAt: string
    views: number
  }>
  keywordPerformance: Array<{
    keyword: string
    currentRank: number | null
    targetRank: number | null
    searchVolume: number | null
    difficulty: number | null
    url: string | null
  }>
  period: number
}

export default function BlogAnalytics() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchAnalytics()
  }, [session, status, period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blog/analytics?period=${period}`)
      const data = await response.json()
      
      if (response.ok) {
        setAnalytics(data)
      } else {
        setError(data.error || 'Failed to fetch analytics')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpIcon className="h-4 w-4 text-green-500" />
    if (growth < 0) return <ArrowDownIcon className="h-4 w-4 text-red-500" />
    return <div className="w-4 h-4" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-gray-500'
    if (rank <= 3) return 'text-green-600'
    if (rank <= 10) return 'text-yellow-600'
    if (rank <= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return 'bg-gray-100'
    if (difficulty <= 30) return 'bg-green-100 text-green-800'
    if (difficulty <= 60) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <ChartBarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Analytics Unavailable</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchAnalytics()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
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
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <GradientText>Blog Analytics</GradientText>
            </h1>
            <p className="text-muted-foreground">
              Track your blog performance and SEO metrics
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => fetchAnalytics()}>
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {analytics && (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    Total Views
                  </CardDescription>
                  {getGrowthIcon(analytics.overview.viewsGrowth)}
                </div>
                <CardTitle className="text-2xl">
                  {formatNumber(analytics.overview.totalViews)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-sm ${getGrowthColor(analytics.overview.viewsGrowth)}`}>
                  {analytics.overview.viewsGrowth > 0 ? '+' : ''}{analytics.overview.viewsGrowth}% vs previous period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="flex items-center gap-2">
                    <DocumentTextIcon className="h-4 w-4" />
                    Unique Views
                  </CardDescription>
                  {getGrowthIcon(analytics.overview.uniqueViewsGrowth)}
                </div>
                <CardTitle className="text-2xl">
                  {formatNumber(analytics.overview.uniqueViews)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-sm ${getGrowthColor(analytics.overview.uniqueViewsGrowth)}`}>
                  {analytics.overview.uniqueViewsGrowth > 0 ? '+' : ''}{analytics.overview.uniqueViewsGrowth}% vs previous period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Avg Time on Page
                </CardDescription>
                <CardTitle className="text-2xl">
                  {formatTime(analytics.overview.avgTimeOnPage)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  Bounce Rate: {analytics.overview.avgBounceRate}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <ShareIcon className="h-4 w-4" />
                  Social Shares
                </CardDescription>
                <CardTitle className="text-2xl">
                  {formatNumber(analytics.overview.socialShares)}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm text-muted-foreground">
                  CTR: {analytics.overview.avgClickThroughRate}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="seo">SEO Keywords</TabsTrigger>
              <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ArrowTrendingUpIcon className="h-5 w-5" />
                      Top Performing Posts
                    </CardTitle>
                    <CardDescription>Most viewed posts in the last {period} days</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.topPosts.slice(0, 5).map((post, index) => (
                      <div key={post.id} className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{post.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <EyeIcon className="h-4 w-4" />
                            {formatNumber(post.views)} views
                            <span>•</span>
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.categories.map((category) => (
                              <Badge 
                                key={category.name} 
                                variant="secondary"
                                className="text-xs"
                                style={{ backgroundColor: category.color + '20', color: category.color }}
                              >
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Recent Posts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarDaysIcon className="h-5 w-5" />
                      Recent Posts Performance
                    </CardTitle>
                    <CardDescription>Latest published posts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.recentPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{post.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarDaysIcon className="h-4 w-4" />
                            {new Date(post.publishedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatNumber(post.views)}</div>
                          <div className="text-sm text-muted-foreground">views</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="categories" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Performance breakdown by content category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {analytics.categoryPerformance.map((category) => (
                      <div key={category.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <h3 className="font-medium">{category.name}</h3>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatNumber(category.totalViews)}</div>
                            <div className="text-sm text-muted-foreground">total views</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Posts: </span>
                            <span className="font-medium">{category.totalPosts}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg Views: </span>
                            <span className="font-medium">{formatNumber(category.avgViews)}</span>
                          </div>
                        </div>
                        
                        <Progress 
                          value={(category.totalViews / analytics.overview.totalViews) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                    SEO Keyword Performance
                  </CardTitle>
                  <CardDescription>Track your keyword rankings and search performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.keywordPerformance.map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{keyword.keyword}</h4>
                            {keyword.difficulty && (
                              <Badge className={getDifficultyColor(keyword.difficulty)}>
                                {keyword.difficulty}% difficulty
                              </Badge>
                            )}
                          </div>
                          {keyword.url && (
                            <div className="text-sm text-muted-foreground truncate">
                              {keyword.url}
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className={`text-lg font-bold ${getRankColor(keyword.currentRank)}`}>
                              {keyword.currentRank || '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Current</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-muted-foreground">
                              {keyword.targetRank || '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Target</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">
                              {keyword.searchVolume ? formatNumber(keyword.searchVolume) : '—'}
                            </div>
                            <div className="text-xs text-muted-foreground">Volume</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {analytics.keywordPerformance.length === 0 && (
                      <div className="text-center py-8">
                        <MagnifyingGlassIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No keyword data available yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="traffic" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Organic Traffic</CardTitle>
                    <CardDescription>Traffic from search engines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {formatNumber(analytics.overview.organicTraffic)}
                      </div>
                      <p className="text-muted-foreground">visits from search</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Referral Traffic</CardTitle>
                    <CardDescription>Traffic from other websites</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {formatNumber(analytics.overview.referralTraffic)}
                      </div>
                      <p className="text-muted-foreground">visits from referrals</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
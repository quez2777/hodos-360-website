import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET /api/blog/analytics - Get blog analytics
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const postId = searchParams.get('postId')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Base analytics query
    const whereClause: any = {
      date: {
        gte: startDate
      }
    }

    if (postId) {
      whereClause.postId = postId
    }

    const [analytics, topPosts, categoryStats, recentPosts] = await Promise.all([
      // Overall analytics
      prisma.blogAnalytics.aggregate({
        where: whereClause,
        _sum: {
          views: true,
          uniqueViews: true,
          socialShares: true,
          organicTraffic: true,
          referralTraffic: true
        },
        _avg: {
          timeOnPage: true,
          bounceRate: true,
          clickThroughRate: true
        }
      }),

      // Top performing posts
      prisma.blogPost.findMany({
        include: {
          analytics: {
            where: {
              date: { gte: startDate }
            }
          },
          categories: true,
          _count: {
            select: { analytics: true }
          }
        },
        orderBy: {
          views: 'desc'
        },
        take: 10
      }),

      // Category performance
      prisma.blogCategory.findMany({
        include: {
          posts: {
            include: {
              analytics: {
                where: {
                  date: { gte: startDate }
                }
              }
            }
          }
        }
      }),

      // Recent post performance
      prisma.blogPost.findMany({
        where: {
          publishedAt: {
            gte: startDate
          },
          status: 'published'
        },
        include: {
          analytics: {
            where: {
              date: { gte: startDate }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        take: 5
      })
    ])

    // Process category stats
    const categoryPerformance = categoryStats.map(category => {
      const totalViews = category.posts.reduce((sum, post) => 
        sum + post.analytics.reduce((postSum, analytics) => postSum + analytics.views, 0), 0
      )
      const totalPosts = category.posts.length
      const avgViews = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0

      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        color: category.color,
        totalPosts,
        totalViews,
        avgViews
      }
    }).sort((a, b) => b.totalViews - a.totalViews)

    // Calculate growth metrics
    const previousPeriodStart = new Date()
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period) * 2)
    previousPeriodStart.setDate(previousPeriodStart.getDate() + parseInt(period))

    const previousAnalytics = await prisma.blogAnalytics.aggregate({
      where: {
        date: {
          gte: previousPeriodStart,
          lt: startDate
        }
      },
      _sum: {
        views: true,
        uniqueViews: true,
        socialShares: true
      }
    })

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const currentViews = analytics._sum.views || 0
    const previousViews = previousAnalytics._sum.views || 0
    const viewsGrowth = calculateGrowth(currentViews, previousViews)

    const currentUniqueViews = analytics._sum.uniqueViews || 0
    const previousUniqueViews = previousAnalytics._sum.uniqueViews || 0
    const uniqueViewsGrowth = calculateGrowth(currentUniqueViews, previousUniqueViews)

    // SEO keyword performance (mock data - would integrate with actual SEO tools)
    const keywordPerformance = await prisma.sEOKeyword.findMany({
      orderBy: { currentRank: 'asc' },
      take: 10
    })

    return NextResponse.json({
      overview: {
        totalViews: currentViews,
        viewsGrowth,
        uniqueViews: currentUniqueViews,
        uniqueViewsGrowth,
        socialShares: analytics._sum.socialShares || 0,
        avgTimeOnPage: Math.round(analytics._avg.timeOnPage || 0),
        avgBounceRate: Math.round(analytics._avg.bounceRate || 0),
        avgClickThroughRate: Math.round((analytics._avg.clickThroughRate || 0) * 100) / 100,
        organicTraffic: analytics._sum.organicTraffic || 0,
        referralTraffic: analytics._sum.referralTraffic || 0
      },
      topPosts: topPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        views: post.views,
        publishedAt: post.publishedAt,
        categories: post.categories,
        totalAnalytics: post.analytics.reduce((sum, a) => sum + a.views, 0)
      })),
      categoryPerformance,
      recentPosts: recentPosts.map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        publishedAt: post.publishedAt,
        views: post.analytics.reduce((sum, a) => sum + a.views, 0)
      })),
      keywordPerformance: keywordPerformance.map(keyword => ({
        keyword: keyword.keyword,
        currentRank: keyword.currentRank,
        targetRank: keyword.targetRank,
        searchVolume: keyword.searchVolume,
        difficulty: keyword.difficulty,
        url: keyword.url
      })),
      period: parseInt(period)
    })

  } catch (error) {
    console.error('Blog Analytics API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
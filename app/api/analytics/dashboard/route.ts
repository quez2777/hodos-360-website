import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/analytics/dashboard - Return comprehensive dashboard metrics
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "30d" // 7d, 30d, 90d, 1y
    const includeDetails = searchParams.get("includeDetails") === "true"

    // Validate timeframe parameter
    const validTimeframes = ["7d", "30d", "90d", "1y"]
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        { error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}` },
        { status: 400 }
      )
    }

    // Calculate date range based on timeframe
    const now = new Date()
    const daysAgo: number = {
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365
    }[timeframe] as number

    const startDate = new Date()
    startDate.setDate(now.getDate() - daysAgo)

    // Base where clause for user's data
    const userWhere = { userId: session.user.id }
    const timeRangeWhere = { 
      userId: session.user.id,
      createdAt: { gte: startDate }
    }
    
    const documentTimeRangeWhere = {
      userId: session.user.id,
      uploadedAt: { gte: startDate }
    }

    // Execute all analytics queries in parallel for better performance
    const [
      totalClients,
      newClientsInPeriod,
      totalCases,
      newCasesInPeriod,
      casesByStatus,
      casesByPriority,
      totalDocuments,
      newDocumentsInPeriod,
      documentsByCategory,
      totalCampaigns,
      activeCampaigns,
      campaignsByType,
      campaignMetrics,
      recentActivity
    ] = await Promise.all([
      // Client metrics
      prisma.client.count({ where: userWhere }),
      prisma.client.count({ where: timeRangeWhere }),
      
      // Case metrics
      prisma.case.count({ where: userWhere }),
      prisma.case.count({ where: timeRangeWhere }),
      
      // Cases by status
      prisma.case.groupBy({
        by: ['status'],
        where: userWhere,
        _count: { status: true }
      }),
      
      // Cases by priority
      prisma.case.groupBy({
        by: ['priority'],
        where: userWhere,
        _count: { priority: true }
      }),
      
      // Document metrics
      prisma.document.count({ where: userWhere }),
      prisma.document.count({ where: documentTimeRangeWhere }),
      
      // Documents by category
      prisma.document.groupBy({
        by: ['category'],
        where: userWhere,
        _count: { category: true }
      }),
      
      // Campaign metrics
      prisma.marketingCampaign.count({ where: userWhere }),
      prisma.marketingCampaign.count({ 
        where: { 
          userId: session.user.id,
          status: 'active'
        }
      }),
      
      // Campaigns by type
      prisma.marketingCampaign.groupBy({
        by: ['type'],
        where: userWhere,
        _count: { type: true }
      }),
      
      // Campaign spending metrics
      prisma.marketingCampaign.aggregate({
        where: userWhere,
        _sum: { 
          budget: true,
          spent: true
        },
        _avg: {
          spent: true
        }
      }),
      
      // Recent activity (if details requested)
      includeDetails ? prisma.auditLog.findMany({
        where: {
          userId: session.user.id,
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      }) : Promise.resolve([])
    ])

    // Calculate growth rates
    const previousStartDate = new Date()
    previousStartDate.setDate(startDate.getDate() - daysAgo)
    
    const [
      previousClients,
      previousCases,
      previousDocuments
    ] = await Promise.all([
      prisma.client.count({
        where: {
          userId: session.user.id,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      }),
      prisma.case.count({
        where: {
          userId: session.user.id,
          createdAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      }),
      prisma.document.count({
        where: {
          userId: session.user.id,
          uploadedAt: { 
            gte: previousStartDate,
            lt: startDate
          }
        }
      })
    ])

    // Calculate growth percentages
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    // Prepare response data
    const dashboardMetrics = {
      timeframe,
      period: {
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      },
      clients: {
        total: totalClients,
        new: newClientsInPeriod,
        growth: calculateGrowth(newClientsInPeriod, previousClients)
      },
      cases: {
        total: totalCases,
        new: newCasesInPeriod,
        growth: calculateGrowth(newCasesInPeriod, previousCases),
        byStatus: casesByStatus.reduce((acc: Record<string, number>, item: any) => {
          acc[item.status] = item._count.status
          return acc
        }, {} as Record<string, number>),
        byPriority: casesByPriority.reduce((acc: Record<string, number>, item: any) => {
          acc[item.priority] = item._count.priority
          return acc
        }, {} as Record<string, number>)
      },
      documents: {
        total: totalDocuments,
        new: newDocumentsInPeriod,
        growth: calculateGrowth(newDocumentsInPeriod, previousDocuments),
        byCategory: documentsByCategory.reduce((acc: Record<string, number>, item: any) => {
          acc[item.category] = item._count.category
          return acc
        }, {} as Record<string, number>)
      },
      marketing: {
        totalCampaigns,
        activeCampaigns,
        byType: campaignsByType.reduce((acc: Record<string, number>, item: any) => {
          acc[item.type] = item._count.type
          return acc
        }, {} as Record<string, number>),
        budget: {
          total: campaignMetrics._sum.budget || 0,
          spent: campaignMetrics._sum.spent || 0,
          remaining: (campaignMetrics._sum.budget || 0) - (campaignMetrics._sum.spent || 0),
          averageSpent: campaignMetrics._avg.spent || 0
        }
      },
      recentActivity: includeDetails ? recentActivity.map((activity: any) => ({
        id: activity.id,
        action: activity.action,
        timestamp: activity.timestamp,
        documentId: activity.documentId,
        filename: activity.filename
      })) : undefined
    }

    // Add performance indicators
    const performanceIndicators = {
      averageCaseDuration: await calculateAverageCaseDuration(session.user.id),
      documentUploadTrend: await calculateDocumentTrend(session.user.id, startDate),
      clientAcquisitionRate: newClientsInPeriod / daysAgo, // clients per day
      caseResolutionRate: await calculateCaseResolutionRate(session.user.id, startDate)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...dashboardMetrics,
        performance: performanceIndicators
      }
    })

  } catch (error) {
    console.error("Dashboard analytics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard analytics" },
      { status: 500 }
    )
  }
}

// Helper function to calculate average case duration
async function calculateAverageCaseDuration(userId: string): Promise<number> {
  try {
    const closedCases = await prisma.case.findMany({
      where: {
        userId,
        status: 'closed',
        endDate: { not: null }
      },
      select: {
        startDate: true,
        endDate: true
      }
    })

    if (closedCases.length === 0) return 0

    const totalDuration = closedCases.reduce((sum: number, caseItem: any) => {
      if (caseItem.endDate) {
        const duration = caseItem.endDate.getTime() - caseItem.startDate.getTime()
        return sum + duration
      }
      return sum
    }, 0)

    // Return average duration in days
    return Math.round(totalDuration / (closedCases.length * 1000 * 60 * 60 * 24))
  } catch (error) {
    console.error("Error calculating average case duration:", error)
    return 0
  }
}

// Helper function to calculate document upload trend
async function calculateDocumentTrend(userId: string, startDate: Date): Promise<number[]> {
  try {
    const documents = await prisma.document.findMany({
      where: {
        userId,
        uploadedAt: { gte: startDate }
      },
      select: {
        uploadedAt: true
      }
    })

    // Group by day and count
    const dailyCounts: Record<string, number> = {}
    documents.forEach((doc: any) => {
      const day = doc.uploadedAt.toISOString().split('T')[0]
      dailyCounts[day] = (dailyCounts[day] || 0) + 1
    })

    return Object.values(dailyCounts)
  } catch (error) {
    console.error("Error calculating document trend:", error)
    return []
  }
}

// Helper function to calculate case resolution rate
async function calculateCaseResolutionRate(userId: string, startDate: Date): Promise<number> {
  try {
    const [totalCases, resolvedCases] = await Promise.all([
      prisma.case.count({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.case.count({
        where: {
          userId,
          status: 'closed',
          createdAt: { gte: startDate }
        }
      })
    ])

    return totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0
  } catch (error) {
    console.error("Error calculating case resolution rate:", error)
    return 0
  }
}
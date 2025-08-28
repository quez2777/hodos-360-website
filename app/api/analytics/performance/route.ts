import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Performance metrics interface
interface PerformanceMetrics {
  efficiency: {
    caseResolutionTime: number
    documentProcessingSpeed: number
    clientResponseTime: number
    taskCompletionRate: number
  }
  productivity: {
    casesHandledPerMonth: number
    documentsProcessedPerDay: number
    billableHoursUtilization: number
    revenuePerCase: number
  }
  quality: {
    clientSatisfactionScore: number
    caseSuccessRate: number
    errorRate: number
    complianceScore: number
  }
  trends: {
    performanceTrend: number[]
    monthlyComparisons: Array<{
      month: string
      efficiency: number
      productivity: number
      quality: number
    }>
  }
}

// GET /api/analytics/performance - Temporary fallback for deployment
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

    // Temporary fallback response for deployment
    const mockData: PerformanceMetrics = {
      efficiency: {
        caseResolutionTime: 0,
        documentProcessingSpeed: 0,
        clientResponseTime: 0,
        taskCompletionRate: 0
      },
      productivity: {
        casesHandledPerMonth: 0,
        documentsProcessedPerDay: 0,
        billableHoursUtilization: 0,
        revenuePerCase: 0
      },
      quality: {
        clientSatisfactionScore: 0,
        caseSuccessRate: 0,
        errorRate: 0,
        complianceScore: 0
      },
      trends: {
        performanceTrend: [],
        monthlyComparisons: []
      }
    }

    return NextResponse.json({
      success: true,
      data: mockData,
      message: "Performance analytics temporarily disabled - deployment mode"
    })

  } catch (error) {
    console.error("Performance analytics error:", error)
    return NextResponse.json(
      { error: "Performance analytics service temporarily unavailable" },
      { status: 500 }
    )
  }
}
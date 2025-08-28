import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

// Interfaces for type safety
interface FinancialMetrics {
  revenue: {
    total: number
    recurring: number
    oneTime: number
    projected: number
    growth: number
  }
  billing: {
    outstanding: number
    overdue: number
    collected: number
    collectionRate: number
    averageDaysToPayment: number
  }
  roi: {
    caseBased: number
    clientLifetimeValue: number
    acquisitionCost: number
    profitMargin: number
  }
  cashFlow: {
    current: number
    projected30Days: number
    projected90Days: number
    trend: number[]
  }
}

// GET /api/analytics/financial - Temporary fallback for deployment
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
    const mockData: FinancialMetrics = {
      revenue: {
        total: 0,
        recurring: 0,
        oneTime: 0,
        projected: 0,
        growth: 0
      },
      billing: {
        outstanding: 0,
        overdue: 0,
        collected: 0,
        collectionRate: 0,
        averageDaysToPayment: 0
      },
      roi: {
        caseBased: 0,
        clientLifetimeValue: 0,
        acquisitionCost: 0,
        profitMargin: 0
      },
      cashFlow: {
        current: 0,
        projected30Days: 0,
        projected90Days: 0,
        trend: []
      }
    }

    return NextResponse.json({
      success: true,
      data: mockData,
      message: "Financial analytics temporarily disabled - deployment mode"
    })

  } catch (error) {
    console.error("Financial analytics error:", error)
    return NextResponse.json(
      { error: "Financial analytics service temporarily unavailable" },
      { status: 500 }
    )
  }
}
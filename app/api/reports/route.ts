import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Report types interface
interface Report {
  id: string
  title: string
  type: string
  description: string
  createdAt: string
  status: string
  data: any
}

// GET /api/reports - List reports or get specific report
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get('id')
    const type = searchParams.get('type')

    // For deployment, return mock data
    const mockReports: Report[] = [
      {
        id: '1',
        title: 'Monthly Performance Report',
        type: 'performance',
        description: 'Monthly overview of law firm performance metrics',
        createdAt: new Date().toISOString(),
        status: 'completed',
        data: {
          cases: 25,
          clients: 18,
          revenue: 125000,
          growth: 15
        }
      },
      {
        id: '2',
        title: 'Financial Summary',
        type: 'financial',
        description: 'Financial overview and analysis',
        createdAt: new Date().toISOString(),
        status: 'completed',
        data: {
          revenue: 125000,
          expenses: 85000,
          profit: 40000,
          margin: 32
        }
      }
    ]

    if (reportId) {
      const report = mockReports.find(r => r.id === reportId)
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: report })
    }

    // Filter by type if specified
    const filteredReports = type 
      ? mockReports.filter(r => r.type === type)
      : mockReports

    return NextResponse.json({
      success: true,
      data: filteredReports,
      message: 'Reports service temporarily uses mock data for deployment'
    })

  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json(
      { error: 'Reports service temporarily unavailable' },
      { status: 500 }
    )
  }
}

// POST /api/reports - Generate new report
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, type, dateRange, filters } = body

    // Mock report generation
    const newReport: Report = {
      id: Date.now().toString(),
      title: title || `${type} Report`,
      type: type || 'general',
      description: `Generated report for ${dateRange?.start || 'current period'}`,
      createdAt: new Date().toISOString(),
      status: 'generating',
      data: {
        message: 'Report generation temporarily disabled for deployment',
        filters,
        dateRange
      }
    }

    return NextResponse.json({
      success: true,
      data: newReport,
      message: 'Report generation started (mock mode for deployment)'
    })

  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: 'Report generation service temporarily unavailable' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/marketing/campaigns - List campaigns with performance metrics
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"
    const includeMetrics = searchParams.get("includeMetrics") !== "false"

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100" },
        { status: 400 }
      )
    }

    // Validate sort parameters
    const validSortFields = ["createdAt", "updatedAt", "name", "startDate", "endDate", "budget", "spent"]
    const validSortOrders = ["asc", "desc"]
    
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        { error: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}` },
        { status: 400 }
      )
    }

    if (!validSortOrders.includes(sortOrder)) {
      return NextResponse.json(
        { error: `Invalid sortOrder. Must be 'asc' or 'desc'` },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (status) {
      const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      where.status = status
    }

    if (type) {
      const validTypes = ['email', 'seo', 'ppc', 'social', 'content']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
      where.type = type
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { targetAudience: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Execute queries in parallel
    const [campaigns, totalCount] = await Promise.all([
      prisma.marketingCampaign.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.marketingCampaign.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Calculate performance metrics if requested
    let campaignsWithMetrics = campaigns
    if (includeMetrics) {
      campaignsWithMetrics = campaigns.map((campaign: any) => {
        const metrics = campaign.metrics as any || {}
        const goals = campaign.goals as any || {}
        
        // Calculate performance indicators
        const roi = campaign.budget && campaign.budget > 0 
          ? ((metrics.revenue || 0) - campaign.spent) / campaign.spent * 100
          : 0
        
        const budgetUtilization = campaign.budget && campaign.budget > 0
          ? (campaign.spent / campaign.budget) * 100
          : 0

        const goalCompletion = goals.target && goals.target > 0
          ? Math.min((metrics.achieved || 0) / goals.target * 100, 100)
          : 0

        return {
          ...campaign,
          performance: {
            roi: Math.round(roi * 100) / 100,
            budgetUtilization: Math.round(budgetUtilization * 100) / 100,
            goalCompletion: Math.round(goalCompletion * 100) / 100,
            costPerAcquisition: metrics.acquisitions && metrics.acquisitions > 0
              ? Math.round((campaign.spent / metrics.acquisitions) * 100) / 100
              : 0
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: campaignsWithMetrics,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error("Marketing campaigns GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch marketing campaigns" },
      { status: 500 }
    )
  }
}

// POST /api/marketing/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    const requiredFields = ["name", "type"]
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate field types and values
    if (typeof body.name !== 'string' || body.name.length > 255) {
      return NextResponse.json(
        { error: "Name must be a string with maximum 255 characters" },
        { status: 400 }
      )
    }

    const validTypes = ['email', 'seo', 'ppc', 'social', 'content']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate optional fields
    const validStatuses = ['draft', 'active', 'paused', 'completed', 'cancelled']
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (body.description && (typeof body.description !== 'string' || body.description.length > 1000)) {
      return NextResponse.json(
        { error: "Description must be a string with maximum 1000 characters" },
        { status: 400 }
      )
    }

    if (body.targetAudience && (typeof body.targetAudience !== 'string' || body.targetAudience.length > 500)) {
      return NextResponse.json(
        { error: "Target audience must be a string with maximum 500 characters" },
        { status: 400 }
      )
    }

    // Validate budget and spent amounts
    if (body.budget !== undefined) {
      if (typeof body.budget !== 'number' || body.budget < 0 || body.budget > 1000000) {
        return NextResponse.json(
          { error: "Budget must be a number between 0 and 1,000,000" },
          { status: 400 }
        )
      }
    }

    if (body.spent !== undefined) {
      if (typeof body.spent !== 'number' || body.spent < 0) {
        return NextResponse.json(
          { error: "Spent amount must be a non-negative number" },
          { status: 400 }
        )
      }
      
      if (body.budget && body.spent > body.budget) {
        return NextResponse.json(
          { error: "Spent amount cannot exceed budget" },
          { status: 400 }
        )
      }
    }

    // Validate dates
    let startDate = null
    let endDate = null

    if (body.startDate) {
      startDate = new Date(body.startDate)
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid start date format" },
          { status: 400 }
        )
      }
    }

    if (body.endDate) {
      endDate = new Date(body.endDate)
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid end date format" },
          { status: 400 }
        )
      }
      
      if (startDate && endDate < startDate) {
        return NextResponse.json(
          { error: "End date cannot be before start date" },
          { status: 400 }
        )
      }
    }

    // Validate JSON fields
    let goals = null
    let metrics = null

    if (body.goals) {
      try {
        goals = typeof body.goals === 'string' ? JSON.parse(body.goals) : body.goals
        if (typeof goals !== 'object' || Array.isArray(goals)) {
          throw new Error('Goals must be an object')
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid goals format - must be a valid JSON object" },
          { status: 400 }
        )
      }
    }

    if (body.metrics) {
      try {
        metrics = typeof body.metrics === 'string' ? JSON.parse(body.metrics) : body.metrics
        if (typeof metrics !== 'object' || Array.isArray(metrics)) {
          throw new Error('Metrics must be an object')
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid metrics format - must be a valid JSON object" },
          { status: 400 }
        )
      }
    }

    // Check for duplicate campaign names within user's campaigns
    const existingCampaign = await prisma.marketingCampaign.findFirst({
      where: {
        name: body.name.trim(),
        userId: session.user.id
      }
    })

    if (existingCampaign) {
      return NextResponse.json(
        { error: "A campaign with this name already exists" },
        { status: 409 }
      )
    }

    // Prepare campaign data
    const campaignData = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      type: body.type,
      status: body.status || 'draft',
      budget: body.budget || null,
      spent: body.spent || 0,
      startDate,
      endDate,
      targetAudience: body.targetAudience?.trim() || null,
      goals,
      metrics,
      userId: session.user.id
    }

    // Create campaign
    const newCampaign = await prisma.marketingCampaign.create({
      data: campaignData
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'CAMPAIGN_CREATED',
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Marketing campaign created successfully",
      data: newCampaign
    }, { status: 201 })

  } catch (error) {
    console.error("Marketing campaigns POST error:", error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: "A campaign with this name already exists" },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to create marketing campaign" },
      { status: 500 }
    )
  }
}
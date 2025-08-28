import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/cases - List cases with filtering and pagination
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
    const caseType = searchParams.get("caseType")
    const priority = searchParams.get("priority")
    const clientId = searchParams.get("clientId")
    const search = searchParams.get("search")

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100" },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (status) where.status = status
    if (caseType) where.caseType = caseType
    if (priority) where.priority = priority
    if (clientId) where.clientId = clientId
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Execute queries in parallel
    const [cases, totalCount] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true
            }
          },
          _count: {
            select: { documents: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.case.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: cases,
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
    console.error("Cases GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch cases" },
      { status: 500 }
    )
  }
}

// POST /api/cases - Create new case with validation
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
    const requiredFields = ["title", "caseType", "clientId"]
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate field types and values
    if (typeof body.title !== 'string' || body.title.length > 255) {
      return NextResponse.json(
        { error: "Title must be a string with maximum 255 characters" },
        { status: 400 }
      )
    }

    if (typeof body.caseType !== 'string' || body.caseType.length > 100) {
      return NextResponse.json(
        { error: "Case type must be a string with maximum 100 characters" },
        { status: 400 }
      )
    }

    // Validate optional fields
    const validStatuses = ['open', 'pending', 'closed', 'archived']
    const validPriorities = ['low', 'medium', 'high', 'urgent']

    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { error: `Priority must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: body.clientId,
        userId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or access denied" },
        { status: 404 }
      )
    }

    // Sanitize and prepare data
    const caseData = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      caseType: body.caseType.trim(),
      status: body.status || 'open',
      priority: body.priority || 'medium',
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      endDate: body.endDate ? new Date(body.endDate) : null,
      userId: session.user.id,
      clientId: body.clientId
    }

    // Validate dates
    if (caseData.endDate && caseData.startDate && caseData.endDate < caseData.startDate) {
      return NextResponse.json(
        { error: "End date cannot be before start date" },
        { status: 400 }
      )
    }

    // Create case
    const newCase = await prisma.case.create({
      data: caseData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true
          }
        },
        _count: {
          select: { documents: true }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'CASE_CREATED',
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Case created successfully",
      data: newCase
    }, { status: 201 })

  } catch (error) {
    console.error("Cases POST error:", error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: "Invalid client ID provided" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    )
  }
}
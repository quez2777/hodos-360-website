import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { caseCreateSchema, caseUpdateSchema, caseQuerySchema } from "@/lib/validations"
import { ZodError } from "zod"

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
    
    // Validate query parameters with Zod
    let queryParams
    try {
      queryParams = caseQuerySchema.parse({
        page: searchParams.get("page"),
        limit: searchParams.get("limit"),
        status: searchParams.get("status"),
        caseType: searchParams.get("caseType"),
        priority: searchParams.get("priority"),
        clientId: searchParams.get("clientId"),
        search: searchParams.get("search"),
        sortBy: searchParams.get("sortBy"),
        sortOrder: searchParams.get("sortOrder"),
      })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid query parameters",
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
      throw error
    }

    const { page, limit, status, caseType, priority, clientId, search, sortBy, sortOrder } = queryParams

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
        orderBy: { [sortBy]: sortOrder },
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

    // Validate input with Zod schema
    let validatedData
    try {
      validatedData = caseCreateSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid input data",
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Verify client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: validatedData.clientId,
        userId: session.user.id
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or access denied" },
        { status: 404 }
      )
    }

    // Prepare data (Zod already handled validation and date validation)
    const caseData = {
      ...validatedData,
      userId: session.user.id,
      startDate: validatedData.startDate || new Date(),
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

// PUT /api/cases - Update case (expects ?id=caseId)
export async function PUT(request: NextRequest) {
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
    const caseId = searchParams.get("id")

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input with Zod schema
    let validatedData
    try {
      validatedData = caseUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: "Invalid input data",
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Check if case exists and belongs to user
    const existingCase = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId: session.user.id
      }
    })

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found or access denied" },
        { status: 404 }
      )
    }

    // Update case
    const updatedCase = await prisma.case.update({
      where: { id: caseId },
      data: validatedData,
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
        action: 'CASE_UPDATED',
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Case updated successfully",
      data: updatedCase
    })

  } catch (error) {
    console.error("Cases PUT error:", error)
    
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
      { error: "Failed to update case" },
      { status: 500 }
    )
  }
}

// DELETE /api/cases - Delete case (expects ?id=caseId)
export async function DELETE(request: NextRequest) {
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
    const caseId = searchParams.get("id")

    if (!caseId) {
      return NextResponse.json(
        { error: "Case ID is required" },
        { status: 400 }
      )
    }

    // Check if case exists and belongs to user
    const existingCase = await prisma.case.findFirst({
      where: {
        id: caseId,
        userId: session.user.id
      },
      include: {
        _count: {
          select: { documents: true }
        }
      }
    })

    if (!existingCase) {
      return NextResponse.json(
        { error: "Case not found or access denied" },
        { status: 404 }
      )
    }

    // Check if case has associated documents
    if (existingCase._count.documents > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete case with associated documents. Please delete or reassign documents first.",
          details: { documentCount: existingCase._count.documents }
        },
        { status: 409 }
      )
    }

    // Delete case
    await prisma.case.delete({
      where: { id: caseId }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'CASE_DELETED',
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Case deleted successfully"
    })

  } catch (error) {
    console.error("Cases DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete case" },
      { status: 500 }
    )
  }
}
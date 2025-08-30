import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { clientCreateSchema, clientUpdateSchema, clientQuerySchema } from "@/lib/validations"
import { ZodError } from "zod"

// GET /api/clients - List clients with search
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
      queryParams = clientQuerySchema.parse({
        page: searchParams.get("page"),
        limit: searchParams.get("limit"),
        status: searchParams.get("status"),
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

    const { page, limit, status, search, sortBy, sortOrder } = queryParams

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {
      userId: session.user.id
    }

    if (status) {
      const validStatuses = ['active', 'inactive', 'archived']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Execute queries in parallel
    const [clients, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { cases: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.client.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: clients,
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
    console.error("Clients GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    )
  }
}

// POST /api/clients - Create new client with validation
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
      validatedData = clientCreateSchema.parse(body)
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

    // Check for duplicate email within user's clients
    const existingClient = await prisma.client.findFirst({
      where: {
        email: validatedData.email,
        userId: session.user.id
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this email address already exists" },
        { status: 409 }
      )
    }

    // Prepare data (Zod already handled validation and transformation)
    const clientData = {
      ...validatedData,
      userId: session.user.id
    }

    // Create client
    const newClient = await prisma.client.create({
      data: clientData,
      include: {
        _count: {
          select: { cases: true }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'CLIENT_CREATED',
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Client created successfully",
      data: newClient
    }, { status: 201 })

  } catch (error) {
    console.error("Clients POST error:", error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: "A client with this email address already exists" },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    )
  }
}

// PUT /api/clients - Update client (expects ?id=clientId)
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
    const clientId = searchParams.get("id")

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate input with Zod schema
    let validatedData
    try {
      validatedData = clientUpdateSchema.parse(body)
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

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found or access denied" },
        { status: 404 }
      )
    }

    // Check for duplicate email if email is being updated
    if (validatedData.email && validatedData.email !== existingClient.email) {
      const duplicateClient = await prisma.client.findFirst({
        where: {
          email: validatedData.email,
          userId: session.user.id,
          id: { not: clientId }
        }
      })

      if (duplicateClient) {
        return NextResponse.json(
          { error: "A client with this email address already exists" },
          { status: 409 }
        )
      }
    }

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: validatedData,
      include: {
        _count: {
          select: { cases: true }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'CLIENT_UPDATED',
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Client updated successfully",
      data: updatedClient
    })

  } catch (error) {
    console.error("Clients PUT error:", error)
    
    // Handle Prisma-specific errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: "A client with this email address already exists" },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    )
  }
}

// DELETE /api/clients - Delete client (expects ?id=clientId)
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
    const clientId = searchParams.get("id")

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      )
    }

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId: session.user.id
      },
      include: {
        _count: {
          select: { cases: true }
        }
      }
    })

    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found or access denied" },
        { status: 404 }
      )
    }

    // Check if client has associated cases
    if (existingClient._count.cases > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete client with associated cases. Please delete or reassign cases first.",
          details: { caseCount: existingClient._count.cases }
        },
        { status: 409 }
      )
    }

    // Delete client
    await prisma.client.delete({
      where: { id: clientId }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'CLIENT_DELETED',
        userId: session.user.id,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Client deleted successfully"
    })

  } catch (error) {
    console.error("Clients DELETE error:", error)
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    )
  }
}
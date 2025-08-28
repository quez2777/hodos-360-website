import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "createdAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100" },
        { status: 400 }
      )
    }

    // Validate sort parameters
    const validSortFields = ["createdAt", "updatedAt", "firstName", "lastName", "company"]
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

    // Validate required fields
    const requiredFields = ["firstName", "lastName", "email"]
    for (const field of requiredFields) {
      if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate field types and lengths
    if (typeof body.firstName !== 'string' || body.firstName.length > 100) {
      return NextResponse.json(
        { error: "First name must be a string with maximum 100 characters" },
        { status: 400 }
      )
    }

    if (typeof body.lastName !== 'string' || body.lastName.length > 100) {
      return NextResponse.json(
        { error: "Last name must be a string with maximum 100 characters" },
        { status: 400 }
      )
    }

    if (typeof body.email !== 'string' || !EMAIL_REGEX.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (body.phone && (typeof body.phone !== 'string' || body.phone.length > 20)) {
      return NextResponse.json(
        { error: "Phone must be a string with maximum 20 characters" },
        { status: 400 }
      )
    }

    if (body.company && (typeof body.company !== 'string' || body.company.length > 200)) {
      return NextResponse.json(
        { error: "Company must be a string with maximum 200 characters" },
        { status: 400 }
      )
    }

    if (body.address && (typeof body.address !== 'string' || body.address.length > 500)) {
      return NextResponse.json(
        { error: "Address must be a string with maximum 500 characters" },
        { status: 400 }
      )
    }

    if (body.status) {
      const validStatuses = ['active', 'inactive', 'archived']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Status must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Check for duplicate email within user's clients
    const existingClient = await prisma.client.findFirst({
      where: {
        email: body.email.trim().toLowerCase(),
        userId: session.user.id
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this email address already exists" },
        { status: 409 }
      )
    }

    // Sanitize and prepare data
    const clientData = {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      company: body.company?.trim() || null,
      address: body.address?.trim() || null,
      status: body.status || 'active',
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
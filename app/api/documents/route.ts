import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import * as crypto from "crypto"

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
}

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// GET /api/documents - List documents with filtering
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
    const category = searchParams.get("category")
    const caseId = searchParams.get("caseId")
    const isConfidential = searchParams.get("isConfidential")
    const search = searchParams.get("search")
    const sortBy = searchParams.get("sortBy") || "uploadedAt"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters. Page must be >= 1, limit must be 1-100" },
        { status: 400 }
      )
    }

    // Validate sort parameters
    const validSortFields = ["uploadedAt", "filename", "fileSize", "category"]
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

    if (category) where.category = category
    if (caseId) {
      // Verify case belongs to user
      const caseExists = await prisma.case.findFirst({
        where: { id: caseId, userId: session.user.id }
      })
      if (!caseExists) {
        return NextResponse.json(
          { error: "Case not found or access denied" },
          { status: 404 }
        )
      }
      where.caseId = caseId
    }
    if (isConfidential !== null && isConfidential !== undefined) {
      where.isConfidential = isConfidential === 'true'
    }
    
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Execute queries in parallel
    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          case: {
            select: {
              id: true,
              title: true,
              client: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      }),
      prisma.document.count({ where })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Remove sensitive file paths from response
    const sanitizedDocuments = documents.map((doc: any) => ({
      ...doc,
      filePath: undefined // Don't expose actual file paths
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedDocuments,
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
    console.error("Documents GET error:", error)
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Upload document with metadata
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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const caseId = formData.get("caseId") as string
    const category = formData.get("category") as string || "general"
    const description = formData.get("description") as string
    const isConfidential = formData.get("isConfidential") === "true"

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      const allowedTypes = Object.values(ALLOWED_FILE_TYPES).join(', ')
      return NextResponse.json(
        { error: `File type not allowed. Supported types: ${allowedTypes}` },
        { status: 400 }
      )
    }

    // Validate filename
    if (!file.name || file.name.trim() === '') {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['general', 'contract', 'evidence', 'correspondence', 'legal', 'financial']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate case if provided
    if (caseId) {
      const caseExists = await prisma.case.findFirst({
        where: { id: caseId, userId: session.user.id }
      })
      if (!caseExists) {
        return NextResponse.json(
          { error: "Case not found or access denied" },
          { status: 404 }
        )
      }
    }

    // Generate file hash for duplicate detection
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex')

    // Check for duplicate files
    const existingDocument = await prisma.document.findFirst({
      where: {
        fileHash,
        userId: session.user.id
      }
    })

    if (existingDocument) {
      return NextResponse.json(
        { error: "A document with identical content already exists" },
        { status: 409 }
      )
    }

    // Generate unique filename to prevent conflicts
    const timestamp = Date.now()
    const randomString = crypto.randomBytes(8).toString('hex')
    const fileExtension = ALLOWED_FILE_TYPES[file.type]
    const uniqueFilename = `${timestamp}_${randomString}${fileExtension}`

    // In a real implementation, you would save the file to:
    // - AWS S3
    // - Google Cloud Storage
    // - Local file system with proper security
    // For now, we'll simulate the file path
    const filePath = `/uploads/documents/${session.user.id}/${uniqueFilename}`

    // TODO: Implement actual file upload logic here
    // await uploadFileToStorage(fileBuffer, filePath)

    // Validate description length if provided
    if (description && description.length > 500) {
      return NextResponse.json(
        { error: "Description must be maximum 500 characters" },
        { status: 400 }
      )
    }

    // Prepare document data
    const documentData = {
      filename: uniqueFilename,
      originalName: file.name.trim(),
      fileSize: file.size,
      mimeType: file.type,
      fileHash,
      filePath,
      category,
      description: description?.trim() || null,
      isConfidential,
      userId: session.user.id,
      caseId: caseId || null
    }

    // Create document record
    const newDocument = await prisma.document.create({
      data: documentData,
      include: {
        case: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_UPLOADED',
        userId: session.user.id,
        documentId: newDocument.id,
        filename: newDocument.originalName,
        fileHash: newDocument.fileHash,
        timestamp: new Date()
      }
    })

    // Remove sensitive data from response
    const responseData = {
      ...newDocument,
      filePath: undefined
    }

    return NextResponse.json({
      success: true,
      message: "Document uploaded successfully",
      data: responseData
    }, { status: 201 })

  } catch (error) {
    console.error("Documents POST error:", error)
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: "Invalid case ID provided" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    )
  }
}
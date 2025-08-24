import { NextRequest, NextResponse } from 'next/server'
import S3StorageClient from '@/lib/storage/s3-client'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma' // Assuming you have Prisma set up

// Document update schema
const updateDocumentSchema = z.object({
  filename: z.string().optional(),
  tags: z.array(z.string()).optional(),
  caseId: z.string().optional(),
  clientId: z.string().optional(),
})

// GET /api/documents/[id] - Get document metadata and download URL
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const documentId = params.id

    // Get document from database
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        case: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check access permissions
    // In a real app, implement proper access control
    if (document.userId !== session.user.id && !session.user.isAdmin) {
      // Check if user has access through case or client
      const hasAccess = await checkUserAccess(session.user.id, document)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    // Get download URL if requested
    let downloadUrl = null
    const includeUrl = request.nextUrl.searchParams.get('includeUrl') === 'true'
    const inline = request.nextUrl.searchParams.get('inline') === 'true'
    
    if (includeUrl && document.s3Key) {
      downloadUrl = await S3StorageClient.getDownloadUrl(
        document.s3Key,
        document.filename,
        inline
      )
    }

    // Log access for audit trail
    await logDocumentAccess({
      action: 'view',
      userId: session.user.id,
      documentId: document.id,
      timestamp: new Date(),
    })

    return NextResponse.json({
      document: {
        id: document.id,
        filename: document.filename,
        size: document.size,
        contentType: document.contentType,
        uploadedAt: document.createdAt,
        uploadedBy: document.user,
        tags: document.tags,
        case: document.case,
        client: document.client,
        encrypted: document.encrypted,
        virusScanStatus: document.virusScanStatus,
        virusScanDate: document.virusScanDate,
      },
      downloadUrl,
    })
  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/documents/[id] - Update document metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const documentId = params.id
    const body = await request.json()

    // Validate request body
    const validatedData = updateDocumentSchema.parse(body)

    // Get document to check permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check permissions
    if (document.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Update document
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        filename: validatedData.filename,
        tags: validatedData.tags,
        caseId: validatedData.caseId,
        clientId: validatedData.clientId,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Log update for audit trail
    await logDocumentAccess({
      action: 'update',
      userId: session.user.id,
      documentId: document.id,
      changes: validatedData,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      document: updatedDocument,
    })
  } catch (error) {
    console.error('Update document error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const documentId = params.id

    // Get document to check permissions
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check permissions - only owner or admin can delete
    if (document.userId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Soft delete option
    const softDelete = request.nextUrl.searchParams.get('soft') === 'true'

    if (softDelete) {
      // Mark as deleted in database
      await prisma.document.update({
        where: { id: documentId },
        data: {
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      })
    } else {
      // Delete from S3
      if (document.s3Key) {
        await S3StorageClient.deleteFile(document.s3Key)
      }

      // Delete from database
      await prisma.document.delete({
        where: { id: documentId },
      })
    }

    // Log deletion for audit trail
    await logDocumentAccess({
      action: softDelete ? 'soft_delete' : 'hard_delete',
      userId: session.user.id,
      documentId: document.id,
      timestamp: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: softDelete ? 'Document marked as deleted' : 'Document permanently deleted',
    })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check user access to document
async function checkUserAccess(userId: string, document: any): Promise<boolean> {
  // Check if user has access through case
  if (document.caseId) {
    const caseAccess = await prisma.caseAccess.findFirst({
      where: {
        caseId: document.caseId,
        userId: userId,
      },
    })
    if (caseAccess) return true
  }

  // Check if user has access through client
  if (document.clientId) {
    const clientAccess = await prisma.clientAccess.findFirst({
      where: {
        clientId: document.clientId,
        userId: userId,
      },
    })
    if (clientAccess) return true
  }

  return false
}

// Helper function to log document access
async function logDocumentAccess(entry: any): Promise<void> {
  try {
    await prisma.documentAuditLog.create({
      data: {
        ...entry,
        metadata: entry.changes ? JSON.stringify(entry.changes) : null,
      },
    })
  } catch (error) {
    console.error('Failed to log document access:', error)
  }
}
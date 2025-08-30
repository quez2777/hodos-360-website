import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { S3StorageClient } from "@/lib/storage/s3-client"

// GET /api/documents/[id] - Get document by ID or download document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") // "download" or default (get info)
    const inline = searchParams.get("inline") === "true"

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
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
            title: true,
            client: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // If action is download, generate signed URL
    if (action === "download") {
      try {
        // Generate signed URL for download
        const downloadUrl = await S3StorageClient.getDownloadUrl(
          document.filePath,
          document.originalName,
          inline
        )

        // Log audit trail for download
        await prisma.auditLog.create({
          data: {
            action: 'DOCUMENT_DOWNLOADED',
            userId: session.user.id,
            documentId: document.id,
            filename: document.originalName,
            fileHash: document.fileHash,
            timestamp: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          downloadUrl,
          filename: document.originalName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          expiresIn: 7200, // 2 hours
        })

      } catch (s3Error) {
        console.error('Failed to generate download URL:', s3Error)
        return NextResponse.json(
          { error: "Failed to generate download link" },
          { status: 500 }
        )
      }
    }

    // Default: return document info (without file path for security)
    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        category: document.category,
        description: document.description,
        isConfidential: document.isConfidential,
        uploadedAt: document.uploadedAt,
        updatedAt: document.updatedAt,
        user: document.user,
        case: document.case,
      },
    })
  } catch (error) {
    console.error('Document retrieval error:', error)
    return NextResponse.json(
      { error: 'Document service temporarily unavailable' },
      { status: 500 }
    )
  }
}

// PUT /api/documents/[id] - Update document metadata (simplified)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { description, category, isConfidential } = body

    const document = await prisma.document.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        description,
        category,
        isConfidential,
      },
    })

    return NextResponse.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error('Document update error:', error)
    return NextResponse.json(
      { error: 'Document update service temporarily unavailable' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id] - Delete document with S3 integration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      )
    }

    // Delete file from S3
    try {
      await S3StorageClient.deleteFile(document.filePath)
    } catch (s3Error) {
      console.error('Failed to delete file from S3:', s3Error)
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete document record from database
    await prisma.document.delete({
      where: { id: params.id }
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_DELETED',
        userId: session.user.id,
        documentId: params.id,
        filename: document.originalName,
        fileHash: document.fileHash,
        timestamp: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    })
  } catch (error) {
    console.error('Document deletion error:', error)
    return NextResponse.json(
      { error: 'Document deletion service temporarily unavailable' },
      { status: 500 }
    )
  }
}
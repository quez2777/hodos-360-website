import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/documents/[id] - Get document by ID (simplified for deployment)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        filename: document.filename,
        originalName: document.originalName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        filePath: document.filePath,
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

// DELETE /api/documents/[id] - Delete document (simplified)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.document.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
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
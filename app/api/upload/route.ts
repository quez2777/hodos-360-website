import { NextRequest, NextResponse } from 'next/server'
import DocumentUploadHandler from '@/lib/storage/upload-handler'
import { auth } from '@/lib/auth' // Assuming you have an auth module
import { z } from 'zod'

// Request validation schema
const uploadRequestSchema = z.object({
  caseId: z.string().optional(),
  clientId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  encrypt: z.boolean().optional(),
  scanForVirus: z.boolean().optional().default(true),
})

// Maximum file size (100MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const metadata = formData.get('metadata') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Parse and validate metadata
    let uploadOptions = {}
    if (metadata) {
      try {
        const parsedMetadata = JSON.parse(metadata)
        uploadOptions = uploadRequestSchema.parse(parsedMetadata)
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid metadata format' },
          { status: 400 }
        )
      }
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload document
    const result = await DocumentUploadHandler.uploadDocument(
      buffer,
      file.name,
      file.type || 'application/octet-stream',
      {
        userId: session.user.id,
        ...uploadOptions,
      },
      // Progress callback (not used in API route)
      undefined
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 400 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      documentId: result.documentId,
      url: result.url,
      metadata: result.metadata,
      virusScanResult: result.virusScanResult,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get presigned upload URL for client-side uploads
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get('filename')
    const contentType = searchParams.get('contentType')
    const caseId = searchParams.get('caseId')
    const clientId = searchParams.get('clientId')
    const encrypt = searchParams.get('encrypt') === 'true'

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'Missing required parameters: filename and contentType' },
        { status: 400 }
      )
    }

    // Get presigned upload URL
    const result = await DocumentUploadHandler.getPresignedUploadUrl(
      filename,
      contentType,
      {
        userId: session.user.id,
        caseId: caseId || undefined,
        clientId: clientId || undefined,
        encrypt,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate upload URL' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      uploadUrl: result.uploadUrl,
      documentId: result.documentId,
      key: result.key,
    })
  } catch (error) {
    console.error('Presigned URL API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
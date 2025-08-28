import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!

// Validation schemas
const UploadFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  contentType: z.string().min(1),
  folder: z.string().default('documents'),
  metadata: z.record(z.string()).optional(),
  tags: z.record(z.string()).optional(),
  isPublic: z.boolean().default(false),
  expiresIn: z.number().min(60).max(604800).default(3600), // 1 hour to 7 days
})

const CreatePresignedUrlSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  operation: z.enum(['upload', 'download']),
  folder: z.string().default('documents'),
  expiresIn: z.number().min(60).max(604800).default(3600), // 1 hour to 7 days
})

const MultipartUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().positive(),
  folder: z.string().default('documents'),
  partSize: z.number().min(5242880).max(104857600).default(10485760), // 5MB to 100MB, default 10MB
  metadata: z.record(z.string()).optional(),
})

const CompleteMultipartSchema = z.object({
  uploadId: z.string().min(1),
  fileName: z.string().min(1),
  folder: z.string().default('documents'),
  parts: z.array(z.object({
    partNumber: z.number().positive(),
    etag: z.string().min(1),
  })).min(1),
})

const MoveFileSchema = z.object({
  sourceKey: z.string().min(1),
  destinationKey: z.string().min(1),
  deleteSource: z.boolean().default(true),
})

const CreateBackupSchema = z.object({
  sourceKeys: z.array(z.string().min(1)).min(1),
  backupFolder: z.string().default('backups'),
  compressionLevel: z.enum(['none', 'standard', 'maximum']).default('standard'),
  encryptBackup: z.boolean().default(true),
})

interface StorageFile {
  key: string
  fileName: string
  size: number
  contentType: string
  lastModified: string
  etag: string
  metadata?: Record<string, string>
  tags?: Record<string, string>
  isPublic: boolean
  url?: string
  signedUrl?: string
}

interface UploadResult {
  key: string
  fileName: string
  size: number
  url: string
  etag: string
  versionId?: string
}

interface MultipartUpload {
  uploadId: string
  key: string
  parts: Array<{
    partNumber: number
    uploadUrl: string
    expiresAt: string
  }>
}

class S3StorageService {
  private bucket: string

  constructor() {
    this.bucket = BUCKET_NAME
  }

  async uploadFile(
    buffer: Buffer, 
    uploadData: z.infer<typeof UploadFileSchema>
  ): Promise<UploadResult> {
    try {
      const key = this.generateKey(uploadData.folder, uploadData.fileName)
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: uploadData.contentType,
        ContentLength: uploadData.fileSize,
        Metadata: uploadData.metadata,
        Tagging: uploadData.tags ? this.formatTags(uploadData.tags) : undefined,
        ACL: uploadData.isPublic ? 'public-read' : 'private',
      })

      const result = await s3Client.send(command)
      
      const url = uploadData.isPublic 
        ? `https://${this.bucket}.s3.amazonaws.com/${key}`
        : await this.getSignedDownloadUrl(key, uploadData.expiresIn)

      return {
        key,
        fileName: uploadData.fileName,
        size: uploadData.fileSize,
        url,
        etag: result.ETag?.replace(/"/g, '') || '',
        versionId: result.VersionId,
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload file to S3')
    }
  }

  async createPresignedUrl(
    urlData: z.infer<typeof CreatePresignedUrlSchema>
  ): Promise<{ url: string; key: string; expiresAt: string }> {
    try {
      const key = this.generateKey(urlData.folder, urlData.fileName)
      
      let command: any
      if (urlData.operation === 'upload') {
        command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: urlData.contentType,
        })
      } else {
        command = new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      }

      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: urlData.expiresIn,
      })

      const expiresAt = new Date(Date.now() + urlData.expiresIn * 1000).toISOString()

      return {
        url: signedUrl,
        key,
        expiresAt,
      }
    } catch (error) {
      console.error('S3 presigned URL error:', error)
      throw new Error('Failed to create presigned URL')
    }
  }

  async initiateMultipartUpload(
    uploadData: z.infer<typeof MultipartUploadSchema>
  ): Promise<MultipartUpload> {
    try {
      const key = this.generateKey(uploadData.folder, uploadData.fileName)
      
      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: uploadData.contentType,
        Metadata: uploadData.metadata,
      })

      const result = await s3Client.send(command)
      
      if (!result.UploadId) {
        throw new Error('Failed to initiate multipart upload')
      }

      // Calculate number of parts needed
      const numParts = Math.ceil(uploadData.fileSize / uploadData.partSize)
      const parts = []

      // Generate presigned URLs for each part
      for (let i = 1; i <= numParts; i++) {
        const partCommand = new UploadPartCommand({
          Bucket: this.bucket,
          Key: key,
          PartNumber: i,
          UploadId: result.UploadId,
        })

        const partUrl = await getSignedUrl(s3Client, partCommand, {
          expiresIn: 3600, // 1 hour for each part
        })

        parts.push({
          partNumber: i,
          uploadUrl: partUrl,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        })
      }

      return {
        uploadId: result.UploadId,
        key,
        parts,
      }
    } catch (error) {
      console.error('S3 multipart initiate error:', error)
      throw new Error('Failed to initiate multipart upload')
    }
  }

  async completeMultipartUpload(
    completeData: z.infer<typeof CompleteMultipartSchema>
  ): Promise<UploadResult> {
    try {
      const key = this.generateKey(completeData.folder, completeData.fileName)
      
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: completeData.uploadId,
        MultipartUpload: {
          Parts: completeData.parts.map(part => ({
            ETag: part.etag,
            PartNumber: part.partNumber,
          })),
        },
      })

      const result = await s3Client.send(command)
      
      // Get file size
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
      const headResult = await s3Client.send(headCommand)

      return {
        key,
        fileName: completeData.fileName,
        size: headResult.ContentLength || 0,
        url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
        etag: result.ETag?.replace(/"/g, '') || '',
        versionId: result.VersionId,
      }
    } catch (error) {
      console.error('S3 multipart complete error:', error)
      throw new Error('Failed to complete multipart upload')
    }
  }

  async abortMultipartUpload(uploadId: string, key: string): Promise<void> {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: uploadId,
      })

      await s3Client.send(command)
    } catch (error) {
      console.error('S3 multipart abort error:', error)
      throw new Error('Failed to abort multipart upload')
    }
  }

  async getFile(key: string): Promise<{ buffer: Buffer; metadata: any }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const result = await s3Client.send(command)
      
      if (!result.Body) {
        throw new Error('File not found')
      }

      const buffer = Buffer.from(await result.Body.transformToByteArray())
      
      return {
        buffer,
        metadata: {
          contentType: result.ContentType,
          size: result.ContentLength,
          lastModified: result.LastModified,
          etag: result.ETag,
          metadata: result.Metadata,
        },
      }
    } catch (error) {
      console.error('S3 get file error:', error)
      throw new Error('Failed to retrieve file from S3')
    }
  }

  async getFileInfo(key: string): Promise<StorageFile> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      const result = await s3Client.send(command)
      
      return {
        key,
        fileName: key.split('/').pop() || key,
        size: result.ContentLength || 0,
        contentType: result.ContentType || 'application/octet-stream',
        lastModified: result.LastModified?.toISOString() || '',
        etag: result.ETag?.replace(/"/g, '') || '',
        metadata: result.Metadata,
        isPublic: false, // Would need to check ACL separately
      }
    } catch (error) {
      console.error('S3 get file info error:', error)
      throw new Error('Failed to get file information')
    }
  }

  async listFiles(
    folder: string = '',
    maxKeys: number = 100,
    continuationToken?: string
  ): Promise<{ files: StorageFile[]; nextToken?: string; hasMore: boolean }> {
    try {
      const prefix = folder ? `${folder}/` : ''
      
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken,
      })

      const result = await s3Client.send(command)
      
      const files: StorageFile[] = (result.Contents || []).map(obj => ({
        key: obj.Key!,
        fileName: obj.Key!.split('/').pop() || obj.Key!,
        size: obj.Size || 0,
        contentType: 'application/octet-stream', // Would need separate HEAD requests for accurate MIME types
        lastModified: obj.LastModified?.toISOString() || '',
        etag: obj.ETag?.replace(/"/g, '') || '',
        isPublic: false,
      }))

      return {
        files,
        nextToken: result.NextContinuationToken,
        hasMore: result.IsTruncated || false,
      }
    } catch (error) {
      console.error('S3 list files error:', error)
      throw new Error('Failed to list files from S3')
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })

      await s3Client.send(command)
    } catch (error) {
      console.error('S3 delete file error:', error)
      throw new Error('Failed to delete file from S3')
    }
  }

  async moveFile(moveData: z.infer<typeof MoveFileSchema>): Promise<StorageFile> {
    try {
      // Copy the file to new location
      const copyCommand = new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${moveData.sourceKey}`,
        Key: moveData.destinationKey,
      })

      await s3Client.send(copyCommand)

      // Delete the original file if requested
      if (moveData.deleteSource) {
        await this.deleteFile(moveData.sourceKey)
      }

      // Return info about the moved file
      return await this.getFileInfo(moveData.destinationKey)
    } catch (error) {
      console.error('S3 move file error:', error)
      throw new Error('Failed to move file in S3')
    }
  }

  async createBackup(backupData: z.infer<typeof CreateBackupSchema>): Promise<{ backupKey: string; files: string[] }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupKey = `${backupData.backupFolder}/backup-${timestamp}.json`
      
      // Create backup manifest
      const manifest = {
        createdAt: new Date().toISOString(),
        files: backupData.sourceKeys,
        compressionLevel: backupData.compressionLevel,
        encrypted: backupData.encryptBackup,
      }

      // Upload manifest
      const manifestCommand = new PutObjectCommand({
        Bucket: this.bucket,
        Key: backupKey,
        Body: JSON.stringify(manifest, null, 2),
        ContentType: 'application/json',
        Metadata: {
          backupType: 'manifest',
          fileCount: backupData.sourceKeys.length.toString(),
        },
      })

      await s3Client.send(manifestCommand)

      // Copy files to backup location (in a real implementation, you might compress/encrypt here)
      const copiedFiles = []
      for (const sourceKey of backupData.sourceKeys) {
        const fileName = sourceKey.split('/').pop()
        const backupFileKey = `${backupData.backupFolder}/${timestamp}/${fileName}`
        
        const copyCommand = new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: backupFileKey,
        })

        await s3Client.send(copyCommand)
        copiedFiles.push(backupFileKey)
      }

      return {
        backupKey,
        files: copiedFiles,
      }
    } catch (error) {
      console.error('S3 create backup error:', error)
      throw new Error('Failed to create backup')
    }
  }

  private async getSignedDownloadUrl(key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })

    return await getSignedUrl(s3Client, command, { expiresIn })
  }

  private generateKey(folder: string, fileName: string): string {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}_${sanitizedFileName}`
    return folder ? `${folder}/${uniqueFileName}` : uniqueFileName
  }

  private formatTags(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')
  }
}

// GET: Retrieve file information or list files
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation')
    const key = searchParams.get('key')
    const folder = searchParams.get('folder') || ''
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100')
    const continuationToken = searchParams.get('continuationToken')

    const storageService = new S3StorageService()

    switch (operation) {
      case 'info': {
        if (!key) {
          return NextResponse.json({ error: 'Key is required' }, { status: 400 })
        }

        const fileInfo = await storageService.getFileInfo(key)
        
        // Add signed URL for download
        const signedUrl = await (storageService as any).getSignedDownloadUrl(key, 3600)
        fileInfo.signedUrl = signedUrl

        return NextResponse.json({
          success: true,
          file: fileInfo,
        })
      }

      case 'download': {
        if (!key) {
          return NextResponse.json({ error: 'Key is required' }, { status: 400 })
        }

        const { buffer, metadata } = await storageService.getFile(key)
        
        return new NextResponse(buffer as any, {
          headers: {
            'Content-Type': metadata.contentType,
            'Content-Length': metadata.size.toString(),
            'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
          },
        })
      }

      case 'list': {
        const result = await storageService.listFiles(folder, maxKeys, continuationToken || undefined)
        
        return NextResponse.json({
          success: true,
          ...result,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use: info, download, or list' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Storage GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve storage data' },
      { status: 500 }
    )
  }
}

// POST: Upload files, create presigned URLs, or initiate multipart uploads
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData()
      const file = formData.get('file') as File
      const folder = (formData.get('folder') as string) || 'documents'
      const isPublic = formData.get('isPublic') === 'true'
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      
      const uploadData: z.infer<typeof UploadFileSchema> = {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        folder,
        isPublic,
        expiresIn: 3600, // 1 hour default
      }

      const storageService = new S3StorageService()
      const result = await storageService.uploadFile(buffer, uploadData)

      // Save file metadata to database
      await saveFileToDatabase(session.user.id, {
        key: result.key,
        fileName: result.fileName,
        size: result.size,
        contentType: uploadData.contentType,
        url: result.url,
      })

      return NextResponse.json({
        success: true,
        file: result,
      })
    } else {
      // Handle JSON requests
      const body = await request.json()
      const { operation } = body

      const storageService = new S3StorageService()

      switch (operation) {
        case 'presigned-url': {
          const validatedData = CreatePresignedUrlSchema.parse(body)
          
          const result = await storageService.createPresignedUrl(validatedData)

          return NextResponse.json({
            success: true,
            ...result,
          })
        }

        case 'multipart-initiate': {
          const validatedData = MultipartUploadSchema.parse(body)
          
          const result = await storageService.initiateMultipartUpload(validatedData)

          // Save multipart upload info to database
          await saveMultipartUploadToDatabase(session.user.id, result)

          return NextResponse.json({
            success: true,
            multipartUpload: result,
          })
        }

        case 'multipart-complete': {
          const validatedData = CompleteMultipartSchema.parse(body)
          
          const result = await storageService.completeMultipartUpload(validatedData)

          // Update file metadata in database
          await saveFileToDatabase(session.user.id, {
            key: result.key,
            fileName: result.fileName,
            size: result.size,
            url: result.url,
          })

          return NextResponse.json({
            success: true,
            file: result,
          })
        }

        case 'multipart-abort': {
          const { uploadId, key } = body
          
          if (!uploadId || !key) {
            return NextResponse.json(
              { error: 'Upload ID and key are required' },
              { status: 400 }
            )
          }

          await storageService.abortMultipartUpload(uploadId, key)

          // Remove multipart upload from database
          await deleteMultipartUploadFromDatabase(session.user.id, uploadId)

          return NextResponse.json({
            success: true,
            message: 'Multipart upload aborted',
          })
        }

        case 'backup': {
          const validatedData = CreateBackupSchema.parse(body)
          
          const result = await storageService.createBackup(validatedData)

          // Save backup info to database
          await saveBackupToDatabase(session.user.id, result)

          return NextResponse.json({
            success: true,
            backup: result,
          })
        }

        default:
          return NextResponse.json(
            { error: 'Invalid operation. Use: presigned-url, multipart-initiate, multipart-complete, multipart-abort, or backup' },
            { status: 400 }
          )
      }
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Storage POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process storage request' },
      { status: 500 }
    )
  }
}

// PUT: Move/rename files
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { operation } = body

    const storageService = new S3StorageService()

    switch (operation) {
      case 'move': {
        const validatedData = MoveFileSchema.parse(body)
        
        const result = await storageService.moveFile(validatedData)

        // Update file metadata in database
        await updateFileInDatabase(session.user.id, validatedData.sourceKey, result)

        return NextResponse.json({
          success: true,
          file: result,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use: move' },
          { status: 400 }
        )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Storage PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update storage data' },
      { status: 500 }
    )
  }
}

// DELETE: Delete files
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const storageService = new S3StorageService()
    await storageService.deleteFile(key)

    // Remove file from database
    await deleteFileFromDatabase(session.user.id, key)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    })
  } catch (error) {
    console.error('Storage DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

// Database helper functions
async function saveFileToDatabase(userId: string, fileData: any): Promise<void> {
  // TODO: Implement saving file metadata to database
}

async function saveMultipartUploadToDatabase(userId: string, uploadData: MultipartUpload): Promise<void> {
  // TODO: Implement saving multipart upload info to database
}

async function deleteMultipartUploadFromDatabase(userId: string, uploadId: string): Promise<void> {
  // TODO: Implement deleting multipart upload from database
}

async function saveBackupToDatabase(userId: string, backupData: any): Promise<void> {
  // TODO: Implement saving backup info to database
}

async function updateFileInDatabase(userId: string, oldKey: string, newFileData: StorageFile): Promise<void> {
  // TODO: Implement updating file metadata in database
}

async function deleteFileFromDatabase(userId: string, key: string): Promise<void> {
  // TODO: Implement deleting file from database
}
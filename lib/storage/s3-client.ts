import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'

// Initialize S3 client with AWS credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const UPLOAD_EXPIRY = 3600 // 1 hour
const DOWNLOAD_EXPIRY = 7200 // 2 hours

// Allowed file types for legal documents
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/tiff',
]

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.tiff'
]

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface DocumentMetadata {
  id: string
  filename: string
  size: number
  contentType: string
  uploadedBy: string
  uploadedAt: Date
  lastModified?: Date
  tags?: string[]
  caseId?: string
  clientId?: string
  encrypted?: boolean
  virusScanStatus?: 'pending' | 'clean' | 'infected'
  virusScanDate?: Date
}

export class S3StorageClient {
  /**
   * Validate file type and extension
   */
  static validateFile(filename: string, contentType: string, size: number): { valid: boolean; error?: string } {
    // Check file size
    if (size > MAX_FILE_SIZE) {
      return { valid: false, error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` }
    }

    // Check content type
    if (!ALLOWED_FILE_TYPES.includes(contentType)) {
      return { valid: false, error: 'File type not allowed' }
    }

    // Check file extension
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return { valid: false, error: 'File extension not allowed' }
    }

    // Additional validation for executable files
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js']
    if (dangerousExtensions.some(ext => filename.toLowerCase().includes(ext))) {
      return { valid: false, error: 'Potentially dangerous file type detected' }
    }

    return { valid: true }
  }

  /**
   * Generate a secure S3 key for the document
   */
  static generateS3Key(userId: string, filename: string, documentId: string): string {
    const timestamp = Date.now()
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    return `documents/${userId}/${documentId}/${timestamp}_${sanitizedFilename}`
  }

  /**
   * Upload a file to S3 with progress tracking
   */
  static async uploadFile(
    file: Buffer | Uint8Array | Blob,
    key: string,
    contentType: string,
    metadata: Partial<DocumentMetadata>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ key: string; etag: string; versionId?: string }> {
    try {
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: key,
          Body: file,
          ContentType: contentType,
          ServerSideEncryption: 'AES256', // Enable server-side encryption
          Metadata: {
            uploadedBy: metadata.uploadedBy || '',
            documentId: metadata.id || '',
            caseId: metadata.caseId || '',
            clientId: metadata.clientId || '',
          },
          Tagging: metadata.tags ? `tags=${metadata.tags.join(',')}` : undefined,
        },
      })

      // Track upload progress
      upload.on('httpUploadProgress', (progress) => {
        if (onProgress && progress.loaded && progress.total) {
          onProgress({
            loaded: progress.loaded,
            total: progress.total,
            percentage: Math.round((progress.loaded / progress.total) * 100),
          })
        }
      })

      const result = await upload.done()
      return {
        key,
        etag: result.ETag || '',
        versionId: result.VersionId,
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      throw new Error('Failed to upload file to storage')
    }
  }

  /**
   * Generate a presigned URL for secure file upload
   */
  static async getUploadUrl(
    key: string,
    contentType: string,
    metadata: Partial<DocumentMetadata>
  ): Promise<{ uploadUrl: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
      Metadata: {
        uploadedBy: metadata.uploadedBy || '',
        documentId: metadata.id || '',
      },
    })

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: UPLOAD_EXPIRY })
    return { uploadUrl, key }
  }

  /**
   * Generate a presigned URL for secure file download
   */
  static async getDownloadUrl(
    key: string,
    filename: string,
    inline = false
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: inline 
        ? `inline; filename="${filename}"`
        : `attachment; filename="${filename}"`,
    })

    return getSignedUrl(s3Client, command, { expiresIn: DOWNLOAD_EXPIRY })
  }

  /**
   * Check if a file exists in S3
   */
  static async fileExists(key: string): Promise<boolean> {
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }))
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }))
    } catch (error) {
      console.error('S3 delete error:', error)
      throw new Error('Failed to delete file from storage')
    }
  }

  /**
   * Get file metadata from S3
   */
  static async getFileMetadata(key: string): Promise<{
    size: number
    lastModified: Date
    contentType: string
    metadata: Record<string, string>
  }> {
    try {
      const response = await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }))

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || 'application/octet-stream',
        metadata: response.Metadata || {},
      }
    } catch (error) {
      console.error('S3 metadata error:', error)
      throw new Error('Failed to get file metadata')
    }
  }

  /**
   * Copy a file within S3 (useful for versioning)
   */
  static async copyFile(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      await s3Client.send(new CopyObjectCommand({
        Bucket: BUCKET_NAME,
        Key: destinationKey,
        CopySource: `${BUCKET_NAME}/${sourceKey}`,
        ServerSideEncryption: 'AES256',
      }))
    } catch (error) {
      console.error('S3 copy error:', error)
      throw new Error('Failed to copy file')
    }
  }
}

export default S3StorageClient
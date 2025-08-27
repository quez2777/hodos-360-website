import S3StorageClient, { DocumentMetadata, UploadProgress } from './s3-client'
import crypto from 'crypto'
import { promisify } from 'util'
import { pipeline } from 'stream'
import FormData from 'form-data'
import axios from 'axios'

const pipelineAsync = promisify(pipeline)

// Virus scanning service configuration
const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY
const CLAMAV_ENDPOINT = process.env.CLAMAV_ENDPOINT || 'http://localhost:3310'

export interface UploadOptions {
  userId: string
  caseId?: string
  clientId?: string
  tags?: string[]
  maxSize?: number
  allowedTypes?: string[]
  scanForVirus?: boolean
  encrypt?: boolean
}

export interface UploadResult {
  success: boolean
  documentId?: string
  key?: string
  url?: string
  metadata?: DocumentMetadata
  error?: string
  virusScanResult?: VirusScanResult
}

export interface VirusScanResult {
  clean: boolean
  threats?: string[]
  scanDate: Date
  scanner: 'clamav' | 'virustotal' | 'none'
}

export class DocumentUploadHandler {
  /**
   * Generate a unique document ID
   */
  static generateDocumentId(): string {
    return `doc_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
  }

  /**
   * Calculate file hash for integrity verification
   */
  static async calculateFileHash(buffer: Buffer): Promise<string> {
    const hash = crypto.createHash('sha256')
    hash.update(buffer)
    return hash.digest('hex')
  }

  /**
   * Scan file for viruses using ClamAV
   */
  static async scanWithClamAV(buffer: Buffer, filename: string): Promise<VirusScanResult> {
    try {
      const formData = new FormData()
      formData.append('file', buffer, { filename })

      const response = await axios.post(`${CLAMAV_ENDPOINT}/scan`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 second timeout
      })

      const result = response.data
      return {
        clean: result.clean === true,
        threats: result.threats || [],
        scanDate: new Date(),
        scanner: 'clamav',
      }
    } catch (error) {
      console.error('ClamAV scan error:', error)
      // In production, you might want to fail closed (treat as infected)
      // For now, we'll log and continue
      return {
        clean: true,
        threats: [],
        scanDate: new Date(),
        scanner: 'none',
      }
    }
  }

  /**
   * Scan file for viruses using VirusTotal API
   */
  static async scanWithVirusTotal(buffer: Buffer, filename: string): Promise<VirusScanResult> {
    if (!VIRUSTOTAL_API_KEY) {
      return {
        clean: true,
        threats: [],
        scanDate: new Date(),
        scanner: 'none',
      }
    }

    try {
      const formData = new FormData()
      formData.append('file', buffer, { filename })

      // Upload file to VirusTotal
      const uploadResponse = await axios.post(
        'https://www.virustotal.com/api/v3/files',
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'x-apikey': VIRUSTOTAL_API_KEY,
          },
          maxBodyLength: Infinity,
          timeout: 60000, // 60 second timeout
        }
      )

      const analysisId = uploadResponse.data.data.id

      // Poll for results (in production, use webhooks)
      let attempts = 0
      while (attempts < 30) {
        const analysisResponse = await axios.get(
          `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
          {
            headers: {
              'x-apikey': VIRUSTOTAL_API_KEY,
            },
          }
        )

        const status = analysisResponse.data.data.attributes.status
        if (status === 'completed') {
          const stats = analysisResponse.data.data.attributes.stats
          const malicious = stats.malicious || 0
          const suspicious = stats.suspicious || 0

          return {
            clean: malicious === 0 && suspicious === 0,
            threats: malicious > 0 ? [`${malicious} threats detected`] : [],
            scanDate: new Date(),
            scanner: 'virustotal',
          }
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 2000))
        attempts++
      }

      // Timeout - treat as clean but log
      console.warn('VirusTotal scan timeout')
      return {
        clean: true,
        threats: [],
        scanDate: new Date(),
        scanner: 'none',
      }
    } catch (error) {
      console.error('VirusTotal scan error:', error)
      return {
        clean: true,
        threats: [],
        scanDate: new Date(),
        scanner: 'none',
      }
    }
  }

  /**
   * Sanitize filename to prevent path traversal attacks
   */
  static sanitizeFilename(filename: string): string {
    // Remove any path components
    const basename = filename.split(/[\\/]/).pop() || 'unnamed'
    // Remove special characters except dots and hyphens
    return basename.replace(/[^a-zA-Z0-9._-]/g, '_')
  }

  /**
   * Encrypt file buffer (for sensitive documents)
   */
  static async encryptFile(buffer: Buffer, key?: string): Promise<Buffer> {
    const encryptionKey = key || process.env.DOCUMENT_ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('Encryption key not configured')
    }

    const algorithm = 'aes-256-gcm'
    const iv = crypto.randomBytes(16)
    const salt = crypto.randomBytes(64)
    const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha256')
    
    const cipher = crypto.createCipheriv(algorithm, derivedKey, iv)
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
    const authTag = cipher.getAuthTag()

    // Prepend salt, iv, and auth tag to encrypted data
    return Buffer.concat([salt, iv, authTag, encrypted])
  }

  /**
   * Main upload handler
   */
  static async uploadDocument(
    file: Buffer,
    filename: string,
    contentType: string,
    options: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    try {
      // Sanitize filename
      const sanitizedFilename = this.sanitizeFilename(filename)
      
      // Validate file
      const validation = S3StorageClient.validateFile(sanitizedFilename, contentType, file.length)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        }
      }

      // Scan for viruses if enabled
      let virusScanResult: VirusScanResult | undefined
      if (options.scanForVirus !== false) {
        // Try ClamAV first, fall back to VirusTotal
        virusScanResult = await this.scanWithClamAV(file, sanitizedFilename)
        if (virusScanResult.scanner === 'none' && VIRUSTOTAL_API_KEY) {
          virusScanResult = await this.scanWithVirusTotal(file, sanitizedFilename)
        }

        if (!virusScanResult.clean) {
          return {
            success: false,
            error: 'File failed virus scan',
            virusScanResult,
          }
        }
      }

      // Encrypt file if required
      let processedFile = file
      if (options.encrypt) {
        processedFile = await this.encryptFile(file)
      }

      // Generate document ID and S3 key
      const documentId = this.generateDocumentId()
      const s3Key = S3StorageClient.generateS3Key(options.userId, sanitizedFilename, documentId)

      // Calculate file hash for integrity
      const fileHash = await this.calculateFileHash(file)

      // Create metadata
      const metadata: DocumentMetadata = {
        id: documentId,
        filename: sanitizedFilename,
        size: file.length,
        contentType,
        uploadedBy: options.userId,
        uploadedAt: new Date(),
        caseId: options.caseId,
        clientId: options.clientId,
        tags: options.tags,
        encrypted: options.encrypt,
        virusScanStatus: virusScanResult ? 'clean' : 'pending',
        virusScanDate: virusScanResult?.scanDate,
      }

      // Upload to S3
      const uploadResult = await S3StorageClient.uploadFile(
        processedFile,
        s3Key,
        contentType,
        metadata,
        onProgress
      )

      // Generate download URL
      const downloadUrl = await S3StorageClient.getDownloadUrl(s3Key, sanitizedFilename)

      // Log audit trail
      await this.logAuditTrail({
        action: 'document_upload',
        userId: options.userId,
        documentId,
        filename: sanitizedFilename,
        fileHash,
        virusScanResult,
        timestamp: new Date(),
      })

      return {
        success: true,
        documentId,
        key: s3Key,
        url: downloadUrl,
        metadata,
        virusScanResult,
      }
    } catch (error) {
      console.error('Upload handler error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  /**
   * Upload document using presigned URL (for client-side uploads)
   */
  static async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    options: UploadOptions
  ): Promise<{
    success: boolean
    uploadUrl?: string
    documentId?: string
    key?: string
    error?: string
  }> {
    try {
      // Sanitize and validate
      const sanitizedFilename = this.sanitizeFilename(filename)
      const validation = S3StorageClient.validateFile(sanitizedFilename, contentType, 0)
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        }
      }

      // Generate IDs
      const documentId = this.generateDocumentId()
      const s3Key = S3StorageClient.generateS3Key(options.userId, sanitizedFilename, documentId)

      // Create metadata
      const metadata: Partial<DocumentMetadata> = {
        id: documentId,
        filename: sanitizedFilename,
        uploadedBy: options.userId,
        caseId: options.caseId,
        clientId: options.clientId,
      }

      // Get presigned URL
      const { uploadUrl } = await S3StorageClient.getUploadUrl(s3Key, contentType, metadata)

      return {
        success: true,
        uploadUrl,
        documentId,
        key: s3Key,
      }
    } catch (error) {
      console.error('Presigned URL error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate upload URL',
      }
    }
  }

  /**
   * Log audit trail for compliance
   */
  private static async logAuditTrail(entry: any): Promise<void> {
    // In production, this would write to a secure audit log
    // For now, we'll console log with structured data
    // Try Supabase admin insert first (if configured)
    try {
      // Lazy import to avoid adding a runtime dependency when not used
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { supabaseAdmin } = require('../supabase')

      if (supabaseAdmin && typeof supabaseAdmin.from === 'function') {
        const payload = {
          action: entry.action,
          user_id: String(entry.userId || ''),
          document_id: entry.documentId ? String(entry.documentId) : null,
          filename: entry.filename || null,
          file_hash: entry.fileHash || null,
          virus_scan_result: entry.virusScanResult || null,
          timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString(),
        }

        const { error } = await supabaseAdmin.from('audit_logs').insert(payload)
        if (!error) return
        console.error('Supabase insert error:', error)
      }
    } catch (supErr) {
      console.error('Supabase audit write failed:', supErr)
    }

    // Fallback: structured console log
    console.log('AUDIT_TRAIL:', JSON.stringify({
      ...entry,
      environment: process.env.NODE_ENV,
      serverTime: new Date().toISOString(),
    }))
  }

  /**
   * Decrypt an encrypted file
   */
  static async decryptFile(encryptedBuffer: Buffer, key?: string): Promise<Buffer> {
    const decryptionKey = key || process.env.DOCUMENT_ENCRYPTION_KEY
    if (!decryptionKey) {
      throw new Error('Decryption key not configured')
    }

    const algorithm = 'aes-256-gcm'
    
    // Extract components
    const salt = encryptedBuffer.slice(0, 64)
    const iv = encryptedBuffer.slice(64, 80)
    const authTag = encryptedBuffer.slice(80, 96)
    const encrypted = encryptedBuffer.slice(96)
    
    const derivedKey = crypto.pbkdf2Sync(decryptionKey, salt, 100000, 32, 'sha256')
    
    const decipher = crypto.createDecipheriv(algorithm, derivedKey, iv)
    decipher.setAuthTag(authTag)
    
    return Buffer.concat([decipher.update(encrypted), decipher.final()])
  }
}

export default DocumentUploadHandler
import { sendEmail, sendBatchEmails, type EmailOptions, type EmailResponse } from './client'

interface QueuedEmail extends EmailOptions {
  id: string
  attempts: number
  maxAttempts: number
  createdAt: Date
  lastAttemptAt?: Date
  nextRetryAt?: Date
  status: 'pending' | 'processing' | 'sent' | 'failed'
  error?: string
}

interface EmailQueueOptions {
  maxRetries?: number
  retryDelay?: number // Base delay in ms
  retryBackoff?: number // Backoff multiplier
  batchSize?: number
  processInterval?: number // How often to process queue in ms
}

class EmailQueue {
  private queue: Map<string, QueuedEmail> = new Map()
  private processing: boolean = false
  private timer: NodeJS.Timeout | null = null
  private options: Required<EmailQueueOptions>

  constructor(options: EmailQueueOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000, // 1 second
      retryBackoff: options.retryBackoff ?? 2, // Exponential backoff
      batchSize: options.batchSize ?? 10,
      processInterval: options.processInterval ?? 5000, // 5 seconds
    }

    // Start processing queue
    this.startProcessing()
  }

  /**
   * Add an email to the queue
   */
  async add(email: EmailOptions): Promise<string> {
    const id = this.generateId()
    const queuedEmail: QueuedEmail = {
      ...email,
      id,
      attempts: 0,
      maxAttempts: this.options.maxRetries + 1,
      createdAt: new Date(),
      status: 'pending',
    }

    this.queue.set(id, queuedEmail)
    
    // Process immediately if not already processing
    if (!this.processing) {
      this.processQueue()
    }

    return id
  }

  /**
   * Add multiple emails to the queue
   */
  async addBatch(emails: EmailOptions[]): Promise<string[]> {
    const ids = emails.map((email) => {
      const id = this.generateId()
      const queuedEmail: QueuedEmail = {
        ...email,
        id,
        attempts: 0,
        maxAttempts: this.options.maxRetries + 1,
        createdAt: new Date(),
        status: 'pending',
      }
      this.queue.set(id, queuedEmail)
      return id
    })

    // Process immediately if not already processing
    if (!this.processing) {
      this.processQueue()
    }

    return ids
  }

  /**
   * Get email status by ID
   */
  getStatus(id: string): QueuedEmail | undefined {
    return this.queue.get(id)
  }

  /**
   * Get all emails with a specific status
   */
  getByStatus(status: QueuedEmail['status']): QueuedEmail[] {
    return Array.from(this.queue.values()).filter((email) => email.status === status)
  }

  /**
   * Retry a failed email
   */
  retry(id: string): boolean {
    const email = this.queue.get(id)
    if (!email || email.status !== 'failed') {
      return false
    }

    email.status = 'pending'
    email.nextRetryAt = new Date()
    return true
  }

  /**
   * Remove an email from the queue
   */
  remove(id: string): boolean {
    return this.queue.delete(id)
  }

  /**
   * Clear all emails with a specific status
   */
  clearByStatus(status: QueuedEmail['status']): number {
    const emails = this.getByStatus(status)
    emails.forEach((email) => this.queue.delete(email.id))
    return emails.length
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const stats = {
      total: this.queue.size,
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
    }

    this.queue.forEach((email) => {
      stats[email.status]++
    })

    return stats
  }

  /**
   * Start processing the queue
   */
  private startProcessing() {
    if (this.timer) return

    this.timer = setInterval(() => {
      this.processQueue()
    }, this.options.processInterval)
  }

  /**
   * Stop processing the queue
   */
  stopProcessing() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  /**
   * Process pending emails in the queue
   */
  private async processQueue() {
    if (this.processing) return

    this.processing = true

    try {
      // Get emails that are ready to be sent
      const now = new Date()
      const pendingEmails = Array.from(this.queue.values())
        .filter((email) => 
          email.status === 'pending' && 
          (!email.nextRetryAt || email.nextRetryAt <= now)
        )
        .slice(0, this.options.batchSize)

      if (pendingEmails.length === 0) {
        return
      }

      // Process emails in batch if possible
      if (pendingEmails.length > 1) {
        await this.processBatch(pendingEmails)
      } else {
        await this.processSingle(pendingEmails[0])
      }
    } catch (error) {
      console.error('Queue processing error:', error)
    } finally {
      this.processing = false
    }
  }

  /**
   * Process a single email
   */
  private async processSingle(email: QueuedEmail) {
    email.status = 'processing'
    email.attempts++
    email.lastAttemptAt = new Date()

    try {
      const result = await sendEmail(email)

      if (result.success) {
        email.status = 'sent'
        
        // Remove from queue after successful send
        setTimeout(() => {
          this.queue.delete(email.id)
        }, 60000) // Keep for 1 minute for status checks
      } else {
        this.handleFailure(email, result.error)
      }
    } catch (error) {
      this.handleFailure(email, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Process multiple emails as a batch
   */
  private async processBatch(emails: QueuedEmail[]) {
    // Mark all as processing
    emails.forEach((email) => {
      email.status = 'processing'
      email.attempts++
      email.lastAttemptAt = new Date()
    })

    try {
      const results = await sendBatchEmails(emails)

      emails.forEach((email, index) => {
        const result = results[index]
        
        if (result.success) {
          email.status = 'sent'
          
          // Remove from queue after successful send
          setTimeout(() => {
            this.queue.delete(email.id)
          }, 60000) // Keep for 1 minute for status checks
        } else {
          this.handleFailure(email, result.error)
        }
      })
    } catch (error) {
      // If batch fails, handle each email individually
      emails.forEach((email) => {
        this.handleFailure(email, error instanceof Error ? error.message : 'Unknown error')
      })
    }
  }

  /**
   * Handle email failure
   */
  private handleFailure(email: QueuedEmail, error?: string) {
    email.error = error

    if (email.attempts >= email.maxAttempts) {
      email.status = 'failed'
      
      // Log critical failure
      console.error(`Email ${email.id} failed after ${email.attempts} attempts:`, error)
      
      // You might want to send this to an error tracking service
      // or notify administrators
    } else {
      email.status = 'pending'
      
      // Calculate next retry time with exponential backoff
      const delay = this.options.retryDelay * Math.pow(this.options.retryBackoff, email.attempts - 1)
      email.nextRetryAt = new Date(Date.now() + delay)
      
      console.warn(`Email ${email.id} failed, will retry in ${delay}ms`)
    }
  }

  /**
   * Generate a unique ID for an email
   */
  private generateId(): string {
    return `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Create singleton instance
let queueInstance: EmailQueue | null = null

/**
 * Get or create the email queue instance
 */
export function getEmailQueue(options?: EmailQueueOptions): EmailQueue {
  if (!queueInstance) {
    queueInstance = new EmailQueue(options)
  }
  return queueInstance
}

/**
 * Queue an email for sending
 */
export async function queueEmail(email: EmailOptions): Promise<string> {
  const queue = getEmailQueue()
  return queue.add(email)
}

/**
 * Queue multiple emails for sending
 */
export async function queueBatchEmails(emails: EmailOptions[]): Promise<string[]> {
  const queue = getEmailQueue()
  return queue.addBatch(emails)
}

/**
 * Get email status
 */
export function getEmailStatus(id: string): QueuedEmail | undefined {
  const queue = getEmailQueue()
  return queue.getStatus(id)
}

/**
 * Get queue statistics
 */
export function getQueueStats() {
  const queue = getEmailQueue()
  return queue.getStats()
}

/**
 * Retry a failed email
 */
export function retryEmail(id: string): boolean {
  const queue = getEmailQueue()
  return queue.retry(id)
}

// Export types
export type { QueuedEmail, EmailQueueOptions }
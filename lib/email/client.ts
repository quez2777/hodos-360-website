import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string | string[]
  subject: string
  react?: React.ReactElement
  html?: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
  tags?: Array<{
    name: string
    value: string
  }>
}

export interface EmailResponse {
  id: string
  success: boolean
  error?: string
}

// Default from email
const DEFAULT_FROM = process.env.EMAIL_FROM || 'HODOS 360 <hello@hodos360.com>'
const DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@hodos360.com'

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    // Validate required fields
    if (!options.to) {
      throw new Error('Email recipient is required')
    }
    if (!options.subject) {
      throw new Error('Email subject is required')
    }
    if (!options.react && !options.html && !options.text) {
      throw new Error('Email content is required (react, html, or text)')
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: options.from || DEFAULT_FROM,
      to: options.to,
      subject: options.subject,
      react: options.react,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || DEFAULT_REPLY_TO,
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
      tags: options.tags,
    })

    if (error) {
      console.error('Resend error:', error)
      return {
        id: '',
        success: false,
        error: error.message || 'Failed to send email',
      }
    }

    return {
      id: data?.id || '',
      success: true,
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Send multiple emails in batch
 */
export async function sendBatchEmails(
  emails: EmailOptions[]
): Promise<EmailResponse[]> {
  try {
    const batchEmails = emails.map((email) => ({
      from: email.from || DEFAULT_FROM,
      to: email.to,
      subject: email.subject,
      react: email.react,
      html: email.html,
      text: email.text,
      replyTo: email.replyTo || DEFAULT_REPLY_TO,
      cc: email.cc,
      bcc: email.bcc,
      attachments: email.attachments,
      tags: email.tags,
    }))

    const { data, error } = await resend.batch.send(batchEmails)

    if (error) {
      console.error('Resend batch error:', error)
      return emails.map(() => ({
        id: '',
        success: false,
        error: error.message || 'Failed to send batch emails',
      }))
    }

    return (data || []).map((item) => ({
      id: item.id,
      success: true,
    }))
  } catch (error) {
    console.error('Batch email send error:', error)
    return emails.map(() => ({
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }))
  }
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitize email content to prevent injection
 */
export function sanitizeEmailContent(content: string): string {
  // Remove potential script tags and dangerous HTML
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
}

/**
 * Format email list for sending
 */
export function formatEmailList(emails: string | string[]): string[] {
  if (typeof emails === 'string') {
    return emails.split(',').map((email) => email.trim()).filter(Boolean)
  }
  return emails
}

export default resend
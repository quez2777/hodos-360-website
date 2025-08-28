import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schemas
const SendEmailSchema = z.object({
  to: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).min(1),
  from: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  subject: z.string().min(1).max(255),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // base64 encoded
    type: z.string(),
    disposition: z.enum(['attachment', 'inline']).default('attachment'),
  })).optional(),
  categories: z.array(z.string()).optional(),
  customArgs: z.record(z.string()).optional(),
  sendAt: z.string().datetime().optional(),
})

const CreateCampaignSchema = z.object({
  title: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  senderName: z.string().min(1).max(100),
  senderEmail: z.string().email(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  templateId: z.string().optional(),
  listIds: z.array(z.string()).optional(),
  segmentIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  customUnsubscribeUrl: z.string().url().optional(),
  suppressionGroupId: z.number().optional(),
  scheduledAt: z.string().datetime().optional(),
})

const CreateContactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  listIds: z.array(z.string()).optional(),
})

const UpdateContactSchema = z.object({
  contactId: z.string().min(1),
  email: z.string().email().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  listIds: z.array(z.string()).optional(),
})

const CreateListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
})

interface SendGridContact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  customFields?: Record<string, any>
  listIds?: string[]
  createdAt: string
  updatedAt: string
}

interface SendGridList {
  id: string
  name: string
  contactCount: number
  createdAt: string
  updatedAt: string
}

interface SendGridCampaign {
  id: string
  title: string
  subject: string
  status: string
  createdAt: string
  updatedAt: string
  sendAt?: string
  stats?: {
    sent: number
    delivered: number
    opens: number
    clicks: number
    bounces: number
    unsubscribes: number
  }
}

interface EmailStats {
  messageId: string
  status: 'delivered' | 'bounced' | 'blocked' | 'opened' | 'clicked'
  timestamp: string
  recipient: string
  event: string
}

class SendGridService {
  private apiKey: string
  private baseUrl = 'https://api.sendgrid.com/v3'

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY!
  }

  async sendEmail(emailData: z.infer<typeof SendEmailSchema>): Promise<{ messageId: string; status: string }> {
    try {
      const payload: any = {
        personalizations: [{
          to: emailData.to,
          subject: emailData.subject,
          dynamic_template_data: emailData.templateData,
          custom_args: emailData.customArgs,
          send_at: emailData.sendAt ? Math.floor(new Date(emailData.sendAt).getTime() / 1000) : undefined,
        }],
        from: emailData.from,
        categories: emailData.categories,
      }

      if (emailData.templateId) {
        payload.template_id = emailData.templateId
      } else {
        payload.content = []
        if (emailData.textContent) {
          payload.content.push({
            type: 'text/plain',
            value: emailData.textContent,
          })
        }
        if (emailData.htmlContent) {
          payload.content.push({
            type: 'text/html',
            value: emailData.htmlContent,
          })
        }
      }

      if (emailData.attachments) {
        payload.attachments = emailData.attachments.map(att => ({
          content: att.content,
          filename: att.filename,
          type: att.type,
          disposition: att.disposition,
        }))
      }

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`SendGrid API error: ${error.message || response.status}`)
      }

      const messageId = response.headers.get('X-Message-Id') || 'unknown'
      
      return {
        messageId,
        status: 'sent',
      }
    } catch (error) {
      console.error('SendGrid send email error:', error)
      throw new Error('Failed to send email via SendGrid')
    }
  }

  async createCampaign(campaignData: z.infer<typeof CreateCampaignSchema>): Promise<SendGridCampaign> {
    try {
      const payload = {
        title: campaignData.title,
        subject: campaignData.subject,
        sender_id: await this.getOrCreateSender(campaignData.senderEmail, campaignData.senderName),
        list_ids: campaignData.listIds,
        segment_ids: campaignData.segmentIds,
        categories: campaignData.categories,
        custom_unsubscribe_url: campaignData.customUnsubscribeUrl,
        suppression_group_id: campaignData.suppressionGroupId,
        html_content: campaignData.htmlContent,
        plain_content: campaignData.textContent,
      }

      const response = await fetch(`${this.baseUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`SendGrid API error: ${error.message || response.status}`)
      }

      const campaign = await response.json()

      // Schedule campaign if scheduledAt is provided
      if (campaignData.scheduledAt) {
        await this.scheduleCampaign(campaign.id, campaignData.scheduledAt)
      }

      return {
        id: campaign.id,
        title: campaign.title,
        subject: campaign.subject,
        status: campaign.status,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        sendAt: campaignData.scheduledAt,
      }
    } catch (error) {
      console.error('SendGrid create campaign error:', error)
      throw new Error('Failed to create SendGrid campaign')
    }
  }

  async scheduleCampaign(campaignId: string, sendAt: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns/${campaignId}/schedules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          send_at: Math.floor(new Date(sendAt).getTime() / 1000),
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`SendGrid API error: ${error.message || response.status}`)
      }
    } catch (error) {
      console.error('SendGrid schedule campaign error:', error)
      throw new Error('Failed to schedule SendGrid campaign')
    }
  }

  async createContact(contactData: z.infer<typeof CreateContactSchema>): Promise<SendGridContact> {
    try {
      const payload = {
        contacts: [{
          email: contactData.email,
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          custom_fields: contactData.customFields,
          list_ids: contactData.listIds,
        }],
      }

      const response = await fetch(`${this.baseUrl}/marketing/contacts`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`SendGrid API error: ${error.message || response.status}`)
      }

      const result = await response.json()
      const contactId = result.job_id // SendGrid returns a job ID for bulk operations

      // Wait a moment and then fetch the contact
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return await this.getContactByEmail(contactData.email)
    } catch (error) {
      console.error('SendGrid create contact error:', error)
      throw new Error('Failed to create SendGrid contact')
    }
  }

  async updateContact(contactData: z.infer<typeof UpdateContactSchema>): Promise<SendGridContact> {
    try {
      const payload = {
        contacts: [{
          id: contactData.contactId,
          email: contactData.email,
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          custom_fields: contactData.customFields,
          list_ids: contactData.listIds,
        }],
      }

      const response = await fetch(`${this.baseUrl}/marketing/contacts`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`SendGrid API error: ${error.message || response.status}`)
      }

      // Wait a moment and then fetch the updated contact
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return await this.getContact(contactData.contactId)
    } catch (error) {
      console.error('SendGrid update contact error:', error)
      throw new Error('Failed to update SendGrid contact')
    }
  }

  async getContact(contactId: string): Promise<SendGridContact> {
    try {
      const response = await fetch(`${this.baseUrl}/marketing/contacts/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`SendGrid API error: ${response.status}`)
      }

      const contact = await response.json()
      
      return {
        id: contact.id,
        email: contact.email,
        firstName: contact.first_name,
        lastName: contact.last_name,
        customFields: contact.custom_fields,
        listIds: contact.list_ids,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
      }
    } catch (error) {
      console.error('SendGrid get contact error:', error)
      throw new Error('Failed to get SendGrid contact')
    }
  }

  async getContactByEmail(email: string): Promise<SendGridContact> {
    try {
      const response = await fetch(`${this.baseUrl}/marketing/contacts/search/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: [email],
        }),
      })

      if (!response.ok) {
        throw new Error(`SendGrid API error: ${response.status}`)
      }

      const result = await response.json()
      const contact = result.result?.[email]

      if (!contact) {
        throw new Error('Contact not found')
      }

      return {
        id: contact.contact.id,
        email: contact.contact.email,
        firstName: contact.contact.first_name,
        lastName: contact.contact.last_name,
        customFields: contact.contact.custom_fields,
        listIds: contact.contact.list_ids,
        createdAt: contact.contact.created_at,
        updatedAt: contact.contact.updated_at,
      }
    } catch (error) {
      console.error('SendGrid get contact by email error:', error)
      throw new Error('Failed to get SendGrid contact by email')
    }
  }

  async createList(listData: z.infer<typeof CreateListSchema>): Promise<SendGridList> {
    try {
      const response = await fetch(`${this.baseUrl}/marketing/lists`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: listData.name,
          description: listData.description,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`SendGrid API error: ${error.message || response.status}`)
      }

      const list = await response.json()

      return {
        id: list.id,
        name: list.name,
        contactCount: list.contact_count || 0,
        createdAt: list.created_at,
        updatedAt: list.updated_at,
      }
    } catch (error) {
      console.error('SendGrid create list error:', error)
      throw new Error('Failed to create SendGrid list')
    }
  }

  async getEmailStats(messageIds: string[]): Promise<EmailStats[]> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `msg_id IN (${messageIds.map(id => `"${id}"`).join(',')})`,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(`SendGrid API error: ${error.message || response.status}`)
      }

      const result = await response.json()

      return result.messages?.map((msg: any) => ({
        messageId: msg.msg_id,
        status: msg.status,
        timestamp: msg.last_event_time,
        recipient: msg.to_email,
        event: msg.events?.[0]?.event_name || 'sent',
      })) || []
    } catch (error) {
      console.error('SendGrid get email stats error:', error)
      throw new Error('Failed to get SendGrid email stats')
    }
  }

  private async getOrCreateSender(email: string, name: string): Promise<number> {
    try {
      // First, try to get existing senders
      const response = await fetch(`${this.baseUrl}/senders`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      })

      if (response.ok) {
        const senders = await response.json()
        const existingSender = senders.find((s: any) => s.from.email === email)
        if (existingSender) {
          return existingSender.id
        }
      }

      // Create new sender if not found
      const createResponse = await fetch(`${this.baseUrl}/senders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: name,
          from: { email, name },
          reply_to: { email, name },
        }),
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create sender')
      }

      const newSender = await createResponse.json()
      return newSender.id
    } catch (error) {
      console.error('SendGrid sender error:', error)
      // Return a default sender ID or throw error
      throw new Error('Failed to get or create sender')
    }
  }
}

// GET: Retrieve email data (contacts, lists, campaigns, stats)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'contacts' | 'lists' | 'campaigns' | 'stats'
    const id = searchParams.get('id')
    const email = searchParams.get('email')
    const messageIds = searchParams.get('messageIds')?.split(',')

    const sendgridService = new SendGridService()

    switch (type) {
      case 'contact': {
        if (id) {
          const contact = await sendgridService.getContact(id)
          return NextResponse.json({
            success: true,
            contact,
          })
        } else if (email) {
          const contact = await sendgridService.getContactByEmail(email)
          return NextResponse.json({
            success: true,
            contact,
          })
        } else {
          return NextResponse.json(
            { error: 'Contact ID or email is required' },
            { status: 400 }
          )
        }
      }

      case 'stats': {
        if (!messageIds || messageIds.length === 0) {
          return NextResponse.json(
            { error: 'Message IDs are required' },
            { status: 400 }
          )
        }

        const stats = await sendgridService.getEmailStats(messageIds)
        return NextResponse.json({
          success: true,
          stats,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: contact or stats' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('SendGrid GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve email data' },
      { status: 500 }
    )
  }
}

// POST: Send emails, create campaigns, contacts, or lists
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    const sendgridService = new SendGridService()

    switch (type) {
      case 'email': {
        const validatedData = SendEmailSchema.parse(body)
        
        // Ensure at least one content type is provided
        if (!validatedData.htmlContent && !validatedData.textContent && !validatedData.templateId) {
          return NextResponse.json(
            { error: 'Either htmlContent, textContent, or templateId is required' },
            { status: 400 }
          )
        }

        const result = await sendgridService.sendEmail(validatedData)

        // Save email to database for tracking
        await saveEmailToDatabase(session.user.id, {
          messageId: result.messageId,
          to: validatedData.to,
          subject: validatedData.subject,
          status: result.status,
        })

        return NextResponse.json({
          success: true,
          messageId: result.messageId,
          status: result.status,
        })
      }

      case 'campaign': {
        const validatedData = CreateCampaignSchema.parse(body)

        const campaign = await sendgridService.createCampaign(validatedData)

        // Save campaign to database
        await saveCampaignToDatabase(session.user.id, campaign)

        return NextResponse.json({
          success: true,
          campaign,
        })
      }

      case 'contact': {
        const validatedData = CreateContactSchema.parse(body)

        const contact = await sendgridService.createContact(validatedData)

        // Save contact to database
        await saveContactToDatabase(session.user.id, contact)

        return NextResponse.json({
          success: true,
          contact,
        })
      }

      case 'list': {
        const validatedData = CreateListSchema.parse(body)

        const list = await sendgridService.createList(validatedData)

        // Save list to database
        await saveListToDatabase(session.user.id, list)

        return NextResponse.json({
          success: true,
          list,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: email, campaign, contact, or list' },
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

    console.error('SendGrid POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process email request' },
      { status: 500 }
    )
  }
}

// PUT: Update contacts
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    const sendgridService = new SendGridService()

    switch (type) {
      case 'contact': {
        const validatedData = UpdateContactSchema.parse(body)

        const contact = await sendgridService.updateContact(validatedData)

        // Update contact in database
        await updateContactInDatabase(session.user.id, contact)

        return NextResponse.json({
          success: true,
          contact,
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: contact' },
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

    console.error('SendGrid PUT error:', error)
    return NextResponse.json(
      { error: 'Failed to update email data' },
      { status: 500 }
    )
  }
}

// Database helper functions
async function saveEmailToDatabase(userId: string, emailData: any): Promise<void> {
  // TODO: Implement saving email to database for tracking
}

async function saveCampaignToDatabase(userId: string, campaign: SendGridCampaign): Promise<void> {
  // TODO: Implement saving campaign to database
}

async function saveContactToDatabase(userId: string, contact: SendGridContact): Promise<void> {
  // TODO: Implement saving contact to database
}

async function saveListToDatabase(userId: string, list: SendGridList): Promise<void> {
  // TODO: Implement saving list to database
}

async function updateContactInDatabase(userId: string, contact: SendGridContact): Promise<void> {
  // TODO: Implement updating contact in database
}
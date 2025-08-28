import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schemas
const CreateLeadSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  customFields: z.record(z.string()).optional(),
  provider: z.enum(['salesforce', 'hubspot']),
})

const UpdateLeadSchema = z.object({
  leadId: z.string().min(1),
  provider: z.enum(['salesforce', 'hubspot']),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  customFields: z.record(z.string()).optional(),
})

const SyncLeadsSchema = z.object({
  provider: z.enum(['salesforce', 'hubspot']),
  syncDirection: z.enum(['import', 'export', 'bidirectional']).default('bidirectional'),
  lastSyncDate: z.string().datetime().optional(),
  batchSize: z.number().min(1).max(1000).default(100),
})

const CreateOpportunitySchema = z.object({
  name: z.string().min(1).max(255),
  leadId: z.string().optional(),
  accountId: z.string().optional(),
  amount: z.number().positive().optional(),
  stage: z.string(),
  closeDate: z.string().datetime(),
  description: z.string().optional(),
  provider: z.enum(['salesforce', 'hubspot']),
})

interface CRMAuth {
  accessToken: string
  refreshToken?: string
  instanceUrl?: string
  expiresAt: number
}

interface CRMLead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  title?: string
  source?: string
  status?: string
  description?: string
  provider: 'salesforce' | 'hubspot'
  originalId: string
  createdAt: string
  updatedAt: string
  customFields?: Record<string, any>
}

interface CRMOpportunity {
  id: string
  name: string
  amount?: number
  stage: string
  closeDate: string
  description?: string
  leadId?: string
  accountId?: string
  provider: 'salesforce' | 'hubspot'
  originalId: string
  createdAt: string
  updatedAt: string
}

class SalesforceService {
  private accessToken: string
  private refreshToken?: string
  private instanceUrl: string

  constructor(auth: CRMAuth) {
    this.accessToken = auth.accessToken
    this.refreshToken = auth.refreshToken
    this.instanceUrl = auth.instanceUrl || 'https://login.salesforce.com'
  }

  async createLead(lead: z.infer<typeof CreateLeadSchema>): Promise<CRMLead> {
    try {
      const salesforceFields = {
        FirstName: lead.firstName,
        LastName: lead.lastName,
        Email: lead.email,
        Phone: lead.phone,
        Company: lead.company || `${lead.firstName} ${lead.lastName} Law Firm`,
        Title: lead.title,
        LeadSource: lead.source,
        Description: lead.description,
        ...lead.customFields,
      }

      const response = await fetch(`${this.instanceUrl}/services/data/v59.0/sobjects/Lead`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesforceFields),
      })

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.createLead(lead)
        }
        const error = await response.json()
        throw new Error(`Salesforce API error: ${error.message || response.status}`)
      }

      const result = await response.json()
      
      // Fetch the created lead to return complete data
      return await this.getLead(result.id)
    } catch (error) {
      console.error('Salesforce create lead error:', error)
      throw new Error('Failed to create Salesforce lead')
    }
  }

  async updateLead(leadData: z.infer<typeof UpdateLeadSchema>): Promise<CRMLead> {
    try {
      const updateFields: any = {}
      
      if (leadData.firstName) updateFields.FirstName = leadData.firstName
      if (leadData.lastName) updateFields.LastName = leadData.lastName
      if (leadData.email) updateFields.Email = leadData.email
      if (leadData.phone) updateFields.Phone = leadData.phone
      if (leadData.company) updateFields.Company = leadData.company
      if (leadData.title) updateFields.Title = leadData.title
      if (leadData.source) updateFields.LeadSource = leadData.source
      if (leadData.description) updateFields.Description = leadData.description
      if (leadData.status) updateFields.Status = leadData.status
      if (leadData.customFields) Object.assign(updateFields, leadData.customFields)

      const response = await fetch(
        `${this.instanceUrl}/services/data/v59.0/sobjects/Lead/${leadData.leadId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateFields),
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.updateLead(leadData)
        }
        const error = await response.json()
        throw new Error(`Salesforce API error: ${error.message || response.status}`)
      }

      // Fetch the updated lead to return complete data
      return await this.getLead(leadData.leadId)
    } catch (error) {
      console.error('Salesforce update lead error:', error)
      throw new Error('Failed to update Salesforce lead')
    }
  }

  async getLead(leadId: string): Promise<CRMLead> {
    try {
      const response = await fetch(
        `${this.instanceUrl}/services/data/v59.0/sobjects/Lead/${leadId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.getLead(leadId)
        }
        throw new Error(`Salesforce API error: ${response.status}`)
      }

      const lead = await response.json()
      
      return {
        id: lead.Id,
        firstName: lead.FirstName,
        lastName: lead.LastName,
        email: lead.Email,
        phone: lead.Phone,
        company: lead.Company,
        title: lead.Title,
        source: lead.LeadSource,
        status: lead.Status,
        description: lead.Description,
        provider: 'salesforce',
        originalId: lead.Id,
        createdAt: lead.CreatedDate,
        updatedAt: lead.LastModifiedDate,
      }
    } catch (error) {
      console.error('Salesforce get lead error:', error)
      throw new Error('Failed to get Salesforce lead')
    }
  }

  async syncLeads(params: z.infer<typeof SyncLeadsSchema>): Promise<CRMLead[]> {
    try {
      let query = `SELECT Id, FirstName, LastName, Email, Phone, Company, Title, LeadSource, Status, Description, CreatedDate, LastModifiedDate FROM Lead`
      
      if (params.lastSyncDate) {
        query += ` WHERE LastModifiedDate > ${params.lastSyncDate}`
      }
      
      query += ` ORDER BY LastModifiedDate DESC LIMIT ${params.batchSize}`

      const response = await fetch(
        `${this.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.syncLeads(params)
        }
        throw new Error(`Salesforce API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.records?.map((lead: any) => ({
        id: lead.Id,
        firstName: lead.FirstName,
        lastName: lead.LastName,
        email: lead.Email,
        phone: lead.Phone,
        company: lead.Company,
        title: lead.Title,
        source: lead.LeadSource,
        status: lead.Status,
        description: lead.Description,
        provider: 'salesforce' as const,
        originalId: lead.Id,
        createdAt: lead.CreatedDate,
        updatedAt: lead.LastModifiedDate,
      })) || []
    } catch (error) {
      console.error('Salesforce sync leads error:', error)
      throw new Error('Failed to sync Salesforce leads')
    }
  }

  async createOpportunity(opp: z.infer<typeof CreateOpportunitySchema>): Promise<CRMOpportunity> {
    try {
      const salesforceFields = {
        Name: opp.name,
        Amount: opp.amount,
        StageName: opp.stage,
        CloseDate: opp.closeDate.split('T')[0], // Salesforce expects YYYY-MM-DD
        Description: opp.description,
        AccountId: opp.accountId,
      }

      const response = await fetch(`${this.instanceUrl}/services/data/v59.0/sobjects/Opportunity`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesforceFields),
      })

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.createOpportunity(opp)
        }
        const error = await response.json()
        throw new Error(`Salesforce API error: ${error.message || response.status}`)
      }

      const result = await response.json()
      
      // Fetch the created opportunity to return complete data
      const oppResponse = await fetch(
        `${this.instanceUrl}/services/data/v59.0/sobjects/Opportunity/${result.id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )
      
      const opportunity = await oppResponse.json()
      
      return {
        id: opportunity.Id,
        name: opportunity.Name,
        amount: opportunity.Amount,
        stage: opportunity.StageName,
        closeDate: opportunity.CloseDate,
        description: opportunity.Description,
        accountId: opportunity.AccountId,
        provider: 'salesforce',
        originalId: opportunity.Id,
        createdAt: opportunity.CreatedDate,
        updatedAt: opportunity.LastModifiedDate,
      }
    } catch (error) {
      console.error('Salesforce create opportunity error:', error)
      throw new Error('Failed to create Salesforce opportunity')
    }
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('Authentication expired. Please reconnect your Salesforce account.')
    }

    try {
      const response = await fetch(`${this.instanceUrl}/services/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: process.env.SALESFORCE_CLIENT_ID!,
          client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
          refresh_token: this.refreshToken,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh Salesforce access token')
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.instanceUrl = data.instance_url
    } catch (error) {
      console.error('Salesforce token refresh error:', error)
      throw new Error('Authentication expired. Please reconnect your Salesforce account.')
    }
  }
}

class HubSpotService {
  private accessToken: string

  constructor(auth: CRMAuth) {
    this.accessToken = auth.accessToken
  }

  async createLead(lead: z.infer<typeof CreateLeadSchema>): Promise<CRMLead> {
    try {
      const hubspotProperties = {
        firstname: lead.firstName,
        lastname: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        jobtitle: lead.title,
        hs_lead_source: lead.source,
        about_us: lead.description,
        ...lead.customFields,
      }

      const properties = Object.entries(hubspotProperties)
        .filter(([_, value]) => value !== undefined)
        .reduce((acc, [key, value]) => {
          acc[key] = value
          return acc
        }, {} as Record<string, any>)

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HubSpot API error: ${error.message || response.status}`)
      }

      const result = await response.json()
      
      return {
        id: result.id,
        firstName: result.properties.firstname || '',
        lastName: result.properties.lastname || '',
        email: result.properties.email || '',
        phone: result.properties.phone,
        company: result.properties.company,
        title: result.properties.jobtitle,
        source: result.properties.hs_lead_source,
        description: result.properties.about_us,
        provider: 'hubspot',
        originalId: result.id,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (error) {
      console.error('HubSpot create lead error:', error)
      throw new Error('Failed to create HubSpot contact')
    }
  }

  async updateLead(leadData: z.infer<typeof UpdateLeadSchema>): Promise<CRMLead> {
    try {
      const updateProperties: any = {}
      
      if (leadData.firstName) updateProperties.firstname = leadData.firstName
      if (leadData.lastName) updateProperties.lastname = leadData.lastName
      if (leadData.email) updateProperties.email = leadData.email
      if (leadData.phone) updateProperties.phone = leadData.phone
      if (leadData.company) updateProperties.company = leadData.company
      if (leadData.title) updateProperties.jobtitle = leadData.title
      if (leadData.source) updateProperties.hs_lead_source = leadData.source
      if (leadData.description) updateProperties.about_us = leadData.description
      if (leadData.status) updateProperties.hs_lead_status = leadData.status
      if (leadData.customFields) Object.assign(updateProperties, leadData.customFields)

      const response = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${leadData.leadId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ properties: updateProperties }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HubSpot API error: ${error.message || response.status}`)
      }

      const result = await response.json()
      
      return {
        id: result.id,
        firstName: result.properties.firstname || '',
        lastName: result.properties.lastname || '',
        email: result.properties.email || '',
        phone: result.properties.phone,
        company: result.properties.company,
        title: result.properties.jobtitle,
        source: result.properties.hs_lead_source,
        status: result.properties.hs_lead_status,
        description: result.properties.about_us,
        provider: 'hubspot',
        originalId: result.id,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (error) {
      console.error('HubSpot update lead error:', error)
      throw new Error('Failed to update HubSpot contact')
    }
  }

  async syncLeads(params: z.infer<typeof SyncLeadsSchema>): Promise<CRMLead[]> {
    try {
      let url = `https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email,phone,company,jobtitle,hs_lead_source,hs_lead_status,about_us,createdate,lastmodifieddate&limit=${params.batchSize}`
      
      if (params.lastSyncDate) {
        const timestamp = new Date(params.lastSyncDate).getTime()
        url += `&filters=${encodeURIComponent(JSON.stringify([{
          propertyName: 'lastmodifieddate',
          operator: 'GT',
          value: timestamp
        }]))}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HubSpot API error: ${error.message || response.status}`)
      }

      const data = await response.json()
      
      return data.results?.map((contact: any) => ({
        id: contact.id,
        firstName: contact.properties.firstname || '',
        lastName: contact.properties.lastname || '',
        email: contact.properties.email || '',
        phone: contact.properties.phone,
        company: contact.properties.company,
        title: contact.properties.jobtitle,
        source: contact.properties.hs_lead_source,
        status: contact.properties.hs_lead_status,
        description: contact.properties.about_us,
        provider: 'hubspot' as const,
        originalId: contact.id,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      })) || []
    } catch (error) {
      console.error('HubSpot sync leads error:', error)
      throw new Error('Failed to sync HubSpot contacts')
    }
  }

  async createOpportunity(opp: z.infer<typeof CreateOpportunitySchema>): Promise<CRMOpportunity> {
    try {
      const properties = {
        dealname: opp.name,
        amount: opp.amount?.toString(),
        dealstage: opp.stage,
        closedate: new Date(opp.closeDate).getTime().toString(),
        description: opp.description,
      }

      const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ properties }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`HubSpot API error: ${error.message || response.status}`)
      }

      const result = await response.json()
      
      return {
        id: result.id,
        name: result.properties.dealname || '',
        amount: result.properties.amount ? parseFloat(result.properties.amount) : undefined,
        stage: result.properties.dealstage || '',
        closeDate: new Date(parseInt(result.properties.closedate)).toISOString(),
        description: result.properties.description,
        provider: 'hubspot',
        originalId: result.id,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      }
    } catch (error) {
      console.error('HubSpot create opportunity error:', error)
      throw new Error('Failed to create HubSpot deal')
    }
  }
}

// GET: Sync leads/contacts from CRM providers
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'salesforce' | 'hubspot'
    const lastSyncDate = searchParams.get('lastSyncDate')
    const batchSize = parseInt(searchParams.get('batchSize') || '100')

    if (!provider || !['salesforce', 'hubspot'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    // Get user's CRM tokens from database
    const userTokens = await getUserCRMTokens(session.user.id, provider)
    if (!userTokens) {
      return NextResponse.json(
        { error: 'CRM not connected. Please authenticate first.' },
        { status: 400 }
      )
    }

    const syncParams: z.infer<typeof SyncLeadsSchema> = {
      provider,
      syncDirection: 'import' as const,
      lastSyncDate: lastSyncDate || undefined,
      batchSize,
    }

    let leads: CRMLead[] = []

    if (provider === 'salesforce') {
      const salesforceService = new SalesforceService(userTokens)
      leads = await salesforceService.syncLeads(syncParams)
    } else if (provider === 'hubspot') {
      const hubspotService = new HubSpotService(userTokens)
      leads = await hubspotService.syncLeads(syncParams)
    }

    return NextResponse.json({
      success: true,
      leads,
      count: leads.length,
    })
  } catch (error) {
    console.error('CRM sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync CRM leads' },
      { status: 500 }
    )
  }
}

// POST: Create new lead/contact
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Check if this is an opportunity creation request
    if (body.type === 'opportunity') {
      const validatedData = CreateOpportunitySchema.parse(body)
      
      // Get user's CRM tokens from database
      const userTokens = await getUserCRMTokens(session.user.id, validatedData.provider)
      if (!userTokens) {
        return NextResponse.json(
          { error: 'CRM not connected. Please authenticate first.' },
          { status: 400 }
        )
      }

      let createdOpportunity: CRMOpportunity

      if (validatedData.provider === 'salesforce') {
        const salesforceService = new SalesforceService(userTokens)
        createdOpportunity = await salesforceService.createOpportunity(validatedData)
      } else {
        const hubspotService = new HubSpotService(userTokens)
        createdOpportunity = await hubspotService.createOpportunity(validatedData)
      }

      // Save opportunity to database for tracking
      await saveOpportunityToDatabase(session.user.id, createdOpportunity)

      return NextResponse.json({
        success: true,
        opportunity: createdOpportunity,
      })
    } else {
      // Handle lead creation
      const validatedData = CreateLeadSchema.parse(body)

      // Get user's CRM tokens from database
      const userTokens = await getUserCRMTokens(session.user.id, validatedData.provider)
      if (!userTokens) {
        return NextResponse.json(
          { error: 'CRM not connected. Please authenticate first.' },
          { status: 400 }
        )
      }

      let createdLead: CRMLead

      if (validatedData.provider === 'salesforce') {
        const salesforceService = new SalesforceService(userTokens)
        createdLead = await salesforceService.createLead(validatedData)
      } else {
        const hubspotService = new HubSpotService(userTokens)
        createdLead = await hubspotService.createLead(validatedData)
      }

      // Save lead to database for tracking
      await saveLeadToDatabase(session.user.id, createdLead)

      return NextResponse.json({
        success: true,
        lead: createdLead,
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('CRM create error:', error)
    return NextResponse.json(
      { error: 'Failed to create CRM record' },
      { status: 500 }
    )
  }
}

// PUT: Update existing lead/contact
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateLeadSchema.parse(body)

    // Get user's CRM tokens from database
    const userTokens = await getUserCRMTokens(session.user.id, validatedData.provider)
    if (!userTokens) {
      return NextResponse.json(
        { error: 'CRM not connected. Please authenticate first.' },
        { status: 400 }
      )
    }

    let updatedLead: CRMLead

    if (validatedData.provider === 'salesforce') {
      const salesforceService = new SalesforceService(userTokens)
      updatedLead = await salesforceService.updateLead(validatedData)
    } else {
      const hubspotService = new HubSpotService(userTokens)
      updatedLead = await hubspotService.updateLead(validatedData)
    }

    // Update lead in database
    await updateLeadInDatabase(session.user.id, updatedLead)

    return NextResponse.json({
      success: true,
      lead: updatedLead,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('CRM update error:', error)
    return NextResponse.json(
      { error: 'Failed to update CRM lead' },
      { status: 500 }
    )
  }
}

// Database helper functions
async function getUserCRMTokens(
  userId: string, 
  provider: 'salesforce' | 'hubspot'
): Promise<CRMAuth | null> {
  // TODO: Implement database lookup for user's CRM tokens
  // This would typically query your user_integrations table
  return null
}

async function saveLeadToDatabase(userId: string, lead: CRMLead): Promise<void> {
  // TODO: Implement saving lead to database for tracking and sync
}

async function updateLeadInDatabase(userId: string, lead: CRMLead): Promise<void> {
  // TODO: Implement updating lead in database
}

async function saveOpportunityToDatabase(userId: string, opportunity: CRMOpportunity): Promise<void> {
  // TODO: Implement saving opportunity to database for tracking
}
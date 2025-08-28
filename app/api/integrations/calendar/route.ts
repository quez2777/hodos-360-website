import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'

// Validation schemas
const CreateEventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  attendees: z.array(z.string().email()).optional(),
  location: z.string().optional(),
  provider: z.enum(['google', 'outlook']),
})

const SyncEventsSchema = z.object({
  provider: z.enum(['google', 'outlook']),
  calendarId: z.string().optional(),
  syncDirection: z.enum(['import', 'export', 'bidirectional']).default('bidirectional'),
})

const UpdateEventSchema = z.object({
  eventId: z.string().min(1),
  provider: z.enum(['google', 'outlook']),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  attendees: z.array(z.string().email()).optional(),
  location: z.string().optional(),
})

interface GoogleCalendarAuth {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface OutlookCalendarAuth {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDateTime: string
  endDateTime: string
  attendees?: string[]
  location?: string
  provider: 'google' | 'outlook'
  originalId: string
}

class GoogleCalendarService {
  private accessToken: string
  private refreshToken: string

  constructor(auth: GoogleCalendarAuth) {
    this.accessToken = auth.accessToken
    this.refreshToken = auth.refreshToken
  }

  async createEvent(event: z.infer<typeof CreateEventSchema>): Promise<CalendarEvent> {
    try {
      const googleEvent = {
        summary: event.title,
        description: event.description,
        start: {
          dateTime: event.startDateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleEvent),
      })

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.createEvent(event)
        }
        throw new Error(`Google Calendar API error: ${response.status}`)
      }

      const createdEvent = await response.json()
      
      return {
        id: createdEvent.id,
        title: createdEvent.summary,
        description: createdEvent.description,
        startDateTime: createdEvent.start.dateTime,
        endDateTime: createdEvent.end.dateTime,
        attendees: createdEvent.attendees?.map((a: any) => a.email),
        location: createdEvent.location,
        provider: 'google',
        originalId: createdEvent.id,
      }
    } catch (error) {
      console.error('Google Calendar create event error:', error)
      throw new Error('Failed to create Google Calendar event')
    }
  }

  async updateEvent(eventData: z.infer<typeof UpdateEventSchema>): Promise<CalendarEvent> {
    try {
      const updateFields: any = {}
      
      if (eventData.title) updateFields.summary = eventData.title
      if (eventData.description) updateFields.description = eventData.description
      if (eventData.startDateTime) {
        updateFields.start = { dateTime: eventData.startDateTime, timeZone: 'UTC' }
      }
      if (eventData.endDateTime) {
        updateFields.end = { dateTime: eventData.endDateTime, timeZone: 'UTC' }
      }
      if (eventData.attendees) {
        updateFields.attendees = eventData.attendees.map(email => ({ email }))
      }
      if (eventData.location) updateFields.location = eventData.location

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventData.eventId}`,
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
          return this.updateEvent(eventData)
        }
        throw new Error(`Google Calendar API error: ${response.status}`)
      }

      const updatedEvent = await response.json()
      
      return {
        id: updatedEvent.id,
        title: updatedEvent.summary,
        description: updatedEvent.description,
        startDateTime: updatedEvent.start.dateTime,
        endDateTime: updatedEvent.end.dateTime,
        attendees: updatedEvent.attendees?.map((a: any) => a.email),
        location: updatedEvent.location,
        provider: 'google',
        originalId: updatedEvent.id,
      }
    } catch (error) {
      console.error('Google Calendar update event error:', error)
      throw new Error('Failed to update Google Calendar event')
    }
  }

  async syncEvents(calendarId = 'primary'): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${new Date().toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.syncEvents(calendarId)
        }
        throw new Error(`Google Calendar API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.items?.map((event: any) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description,
        startDateTime: event.start.dateTime || event.start.date,
        endDateTime: event.end.dateTime || event.end.date,
        attendees: event.attendees?.map((a: any) => a.email),
        location: event.location,
        provider: 'google' as const,
        originalId: event.id,
      })) || []
    } catch (error) {
      console.error('Google Calendar sync error:', error)
      throw new Error('Failed to sync Google Calendar events')
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh Google access token')
      }

      const data = await response.json()
      this.accessToken = data.access_token
    } catch (error) {
      console.error('Google token refresh error:', error)
      throw new Error('Authentication expired. Please reconnect your Google Calendar.')
    }
  }
}

class OutlookCalendarService {
  private accessToken: string
  private refreshToken: string

  constructor(auth: OutlookCalendarAuth) {
    this.accessToken = auth.accessToken
    this.refreshToken = auth.refreshToken
  }

  async createEvent(event: z.infer<typeof CreateEventSchema>): Promise<CalendarEvent> {
    try {
      const outlookEvent = {
        subject: event.title,
        body: {
          contentType: 'text',
          content: event.description || '',
        },
        start: {
          dateTime: event.startDateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.endDateTime,
          timeZone: 'UTC',
        },
        attendees: event.attendees?.map(email => ({
          emailAddress: { address: email, name: email },
        })),
        location: event.location ? { displayName: event.location } : undefined,
      }

      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(outlookEvent),
      })

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.createEvent(event)
        }
        throw new Error(`Outlook Calendar API error: ${response.status}`)
      }

      const createdEvent = await response.json()
      
      return {
        id: createdEvent.id,
        title: createdEvent.subject,
        description: createdEvent.body?.content,
        startDateTime: createdEvent.start.dateTime,
        endDateTime: createdEvent.end.dateTime,
        attendees: createdEvent.attendees?.map((a: any) => a.emailAddress.address),
        location: createdEvent.location?.displayName,
        provider: 'outlook',
        originalId: createdEvent.id,
      }
    } catch (error) {
      console.error('Outlook Calendar create event error:', error)
      throw new Error('Failed to create Outlook Calendar event')
    }
  }

  async updateEvent(eventData: z.infer<typeof UpdateEventSchema>): Promise<CalendarEvent> {
    try {
      const updateFields: any = {}
      
      if (eventData.title) updateFields.subject = eventData.title
      if (eventData.description) {
        updateFields.body = { contentType: 'text', content: eventData.description }
      }
      if (eventData.startDateTime) {
        updateFields.start = { dateTime: eventData.startDateTime, timeZone: 'UTC' }
      }
      if (eventData.endDateTime) {
        updateFields.end = { dateTime: eventData.endDateTime, timeZone: 'UTC' }
      }
      if (eventData.attendees) {
        updateFields.attendees = eventData.attendees.map(email => ({
          emailAddress: { address: email, name: email },
        }))
      }
      if (eventData.location) {
        updateFields.location = { displayName: eventData.location }
      }

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/events/${eventData.eventId}`,
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
          return this.updateEvent(eventData)
        }
        throw new Error(`Outlook Calendar API error: ${response.status}`)
      }

      const updatedEvent = await response.json()
      
      return {
        id: updatedEvent.id,
        title: updatedEvent.subject,
        description: updatedEvent.body?.content,
        startDateTime: updatedEvent.start.dateTime,
        endDateTime: updatedEvent.end.dateTime,
        attendees: updatedEvent.attendees?.map((a: any) => a.emailAddress.address),
        location: updatedEvent.location?.displayName,
        provider: 'outlook',
        originalId: updatedEvent.id,
      }
    } catch (error) {
      console.error('Outlook Calendar update event error:', error)
      throw new Error('Failed to update Outlook Calendar event')
    }
  }

  async syncEvents(): Promise<CalendarEvent[]> {
    try {
      const startTime = new Date().toISOString()
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/events?$filter=start/dateTime ge '${startTime}'&$top=100`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 401) {
          await this.refreshAccessToken()
          return this.syncEvents()
        }
        throw new Error(`Outlook Calendar API error: ${response.status}`)
      }

      const data = await response.json()
      
      return data.value?.map((event: any) => ({
        id: event.id,
        title: event.subject || 'Untitled Event',
        description: event.body?.content,
        startDateTime: event.start.dateTime,
        endDateTime: event.end.dateTime,
        attendees: event.attendees?.map((a: any) => a.emailAddress.address),
        location: event.location?.displayName,
        provider: 'outlook' as const,
        originalId: event.id,
      })) || []
    } catch (error) {
      console.error('Outlook Calendar sync error:', error)
      throw new Error('Failed to sync Outlook Calendar events')
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.OUTLOOK_CLIENT_ID!,
          client_secret: process.env.OUTLOOK_CLIENT_SECRET!,
          refresh_token: this.refreshToken,
          grant_type: 'refresh_token',
          scope: 'https://graph.microsoft.com/calendars.readwrite offline_access',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to refresh Outlook access token')
      }

      const data = await response.json()
      this.accessToken = data.access_token
    } catch (error) {
      console.error('Outlook token refresh error:', error)
      throw new Error('Authentication expired. Please reconnect your Outlook Calendar.')
    }
  }
}

// GET: Sync events from calendar providers
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const provider = searchParams.get('provider') as 'google' | 'outlook'
    const calendarId = searchParams.get('calendarId')

    if (!provider || !['google', 'outlook'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    // Get user's calendar tokens from database
    const userTokens = await getUserCalendarTokens(session.user.id, provider)
    if (!userTokens) {
      return NextResponse.json(
        { error: 'Calendar not connected. Please authenticate first.' },
        { status: 400 }
      )
    }

    let events: CalendarEvent[] = []

    if (provider === 'google') {
      const googleService = new GoogleCalendarService(userTokens)
      events = await googleService.syncEvents(calendarId || 'primary')
    } else if (provider === 'outlook') {
      const outlookService = new OutlookCalendarService(userTokens)
      events = await outlookService.syncEvents()
    }

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    })
  } catch (error) {
    console.error('Calendar sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync calendar events' },
      { status: 500 }
    )
  }
}

// POST: Create new calendar event
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreateEventSchema.parse(body)

    // Get user's calendar tokens from database
    const userTokens = await getUserCalendarTokens(session.user.id, validatedData.provider)
    if (!userTokens) {
      return NextResponse.json(
        { error: 'Calendar not connected. Please authenticate first.' },
        { status: 400 }
      )
    }

    let createdEvent: CalendarEvent

    if (validatedData.provider === 'google') {
      const googleService = new GoogleCalendarService(userTokens)
      createdEvent = await googleService.createEvent(validatedData)
    } else {
      const outlookService = new OutlookCalendarService(userTokens)
      createdEvent = await outlookService.createEvent(validatedData)
    }

    // Save event to database for tracking
    await saveEventToDatabase(session.user.id, createdEvent)

    return NextResponse.json({
      success: true,
      event: createdEvent,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Calendar create event error:', error)
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    )
  }
}

// PUT: Update existing calendar event
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdateEventSchema.parse(body)

    // Get user's calendar tokens from database
    const userTokens = await getUserCalendarTokens(session.user.id, validatedData.provider)
    if (!userTokens) {
      return NextResponse.json(
        { error: 'Calendar not connected. Please authenticate first.' },
        { status: 400 }
      )
    }

    let updatedEvent: CalendarEvent

    if (validatedData.provider === 'google') {
      const googleService = new GoogleCalendarService(userTokens)
      updatedEvent = await googleService.updateEvent(validatedData)
    } else {
      const outlookService = new OutlookCalendarService(userTokens)
      updatedEvent = await outlookService.updateEvent(validatedData)
    }

    // Update event in database
    await updateEventInDatabase(session.user.id, updatedEvent)

    return NextResponse.json({
      success: true,
      event: updatedEvent,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Calendar update event error:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    )
  }
}

// Database helper functions (implement based on your DB setup)
async function getUserCalendarTokens(
  userId: string, 
  provider: 'google' | 'outlook'
): Promise<GoogleCalendarAuth | OutlookCalendarAuth | null> {
  // TODO: Implement database lookup for user's calendar tokens
  // This would typically query your user_integrations table
  // Return null if not found or tokens are expired beyond refresh
  return null
}

async function saveEventToDatabase(userId: string, event: CalendarEvent): Promise<void> {
  // TODO: Implement saving event to database for tracking and sync
  // This helps maintain a local copy for offline access and conflict resolution
}

async function updateEventInDatabase(userId: string, event: CalendarEvent): Promise<void> {
  // TODO: Implement updating event in database
  // Update the local copy to match the external calendar
}
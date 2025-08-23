# HODOS 360 API Routes Documentation

## Base URL
```
https://api.hodos360.com/v1
```

## Authentication
All API requests require authentication using Bearer tokens in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Rate Limiting
- Standard: 100 requests per minute
- Premium: 500 requests per minute  
- Enterprise: Custom limits

Rate limit headers:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## 1. Authentication & User Management

### Authentication Endpoints

#### POST /auth/register
Register a new user account
```json
Request:
{
  "email": "john.doe@lawfirm.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "firmId": "firm_123",
  "role": "ASSOCIATE",
  "barNumber": "123456",
  "jurisdiction": ["CA", "NY"]
}

Response: 201 Created
{
  "success": true,
  "data": {
    "user": { ...User },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### POST /auth/login
Authenticate user and receive tokens
```json
Request:
{
  "email": "john.doe@lawfirm.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "user": { ...User },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### POST /auth/logout
Invalidate user session
```json
Request:
{
  "refreshToken": "eyJ..."
}

Response: 200 OK
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST /auth/refresh
Refresh access token
```json
Request:
{
  "refreshToken": "eyJ..."
}

Response: 200 OK
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

#### POST /auth/forgot-password
Request password reset
```json
Request:
{
  "email": "john.doe@lawfirm.com"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset email sent"
}
```

#### POST /auth/reset-password
Reset password with token
```json
Request:
{
  "token": "reset_token_123",
  "password": "NewSecurePassword123!"
}

Response: 200 OK
{
  "success": true,
  "message": "Password reset successfully"
}
```

#### POST /auth/verify-email
Verify email address
```json
Request:
{
  "token": "verification_token_123"
}

Response: 200 OK
{
  "success": true,
  "message": "Email verified successfully"
}
```

#### POST /auth/2fa/enable
Enable two-factor authentication
```json
Response: 200 OK
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,..."
  }
}
```

#### POST /auth/2fa/verify
Verify 2FA code
```json
Request:
{
  "code": "123456"
}

Response: 200 OK
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

### User Management Endpoints

#### GET /users/me
Get current user profile
```json
Response: 200 OK
{
  "success": true,
  "data": { ...User }
}
```

#### PATCH /users/me
Update current user profile
```json
Request:
{
  "firstName": "John",
  "lastName": "Smith",
  "specializations": ["Corporate Law", "M&A"]
}

Response: 200 OK
{
  "success": true,
  "data": { ...User }
}
```

#### GET /users
Get all users in firm (Admin only)
```json
Query Parameters:
- page: number
- pageSize: number
- role: UserRole
- search: string

Response: 200 OK
{
  "success": true,
  "data": [...User[]],
  "metadata": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalCount": 100
  }
}
```

#### GET /users/:id
Get user by ID
```json
Response: 200 OK
{
  "success": true,
  "data": { ...User }
}
```

#### POST /users
Create new user (Admin only)
```json
Request:
{
  "email": "new.user@lawfirm.com",
  "firstName": "New",
  "lastName": "User",
  "role": "PARALEGAL",
  "sendInvite": true
}

Response: 201 Created
{
  "success": true,
  "data": { ...User }
}
```

#### PATCH /users/:id
Update user (Admin only)
```json
Request:
{
  "role": "PARTNER",
  "specializations": ["Tax Law"]
}

Response: 200 OK
{
  "success": true,
  "data": { ...User }
}
```

#### DELETE /users/:id
Delete user (Admin only)
```json
Response: 204 No Content
```

### Firm Management Endpoints

#### GET /firms/current
Get current firm details
```json
Response: 200 OK
{
  "success": true,
  "data": { ...Firm }
}
```

#### PATCH /firms/current
Update firm details (Admin only)
```json
Request:
{
  "name": "Smith & Associates",
  "practiceAreas": ["Corporate Law", "IP Law"],
  "settings": {
    "timezone": "America/New_York",
    "security": {
      "requireTwoFactor": true
    }
  }
}

Response: 200 OK
{
  "success": true,
  "data": { ...Firm }
}
```

#### GET /firms/current/subscription
Get subscription details
```json
Response: 200 OK
{
  "success": true,
  "data": { ...Subscription }
}
```

#### POST /firms/current/subscription/upgrade
Upgrade subscription plan
```json
Request:
{
  "plan": "ENTERPRISE",
  "seats": 50,
  "addons": ["AI_ADVANCED", "CUSTOM_TRAINING"]
}

Response: 200 OK
{
  "success": true,
  "data": { ...Subscription }
}
```

---

## 2. AI Services

### Document Analysis

#### POST /ai/documents/upload
Upload document for analysis
```json
Request: multipart/form-data
- file: binary
- type: DocumentType
- caseId?: string
- clientId?: string
- confidentialityLevel: ConfidentialityLevel

Response: 201 Created
{
  "success": true,
  "data": { ...Document }
}
```

#### POST /ai/documents/:id/analyze
Analyze uploaded document
```json
Request:
{
  "analysisType": ["summary", "risks", "obligations", "clauses"],
  "customPrompts": ["Extract all monetary amounts", "Identify jurisdiction"]
}

Response: 202 Accepted
{
  "success": true,
  "data": {
    "analysisId": "analysis_123",
    "status": "processing",
    "estimatedTime": 30
  }
}
```

#### GET /ai/documents/:id/analysis
Get document analysis results
```json
Response: 200 OK
{
  "success": true,
  "data": { ...DocumentAnalysis }
}
```

#### POST /ai/documents/compare
Compare multiple documents
```json
Request:
{
  "documentIds": ["doc_123", "doc_456"],
  "comparisonType": "clause_differences"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "differences": [...],
    "similarities": [...],
    "recommendations": [...]
  }
}
```

### Case Research

#### POST /ai/research/cases
Search for relevant cases
```json
Request:
{
  "query": "negligence personal injury slip and fall",
  "jurisdiction": ["CA", "9th Circuit"],
  "dateRange": {
    "start": "2020-01-01",
    "end": "2023-12-31"
  },
  "practiceArea": "Personal Injury",
  "maxResults": 50
}

Response: 200 OK
{
  "success": true,
  "data": { ...CaseResearch }
}
```

#### POST /ai/research/statutes
Search statutes and regulations
```json
Request:
{
  "query": "data privacy regulations",
  "jurisdiction": ["CA", "Federal"],
  "includeRegulations": true
}

Response: 200 OK
{
  "success": true,
  "data": {
    "statutes": [...],
    "regulations": [...],
    "analysis": { ...ResearchAnalysis }
  }
}
```

#### POST /ai/research/brief
Generate legal brief outline
```json
Request:
{
  "caseId": "case_123",
  "type": "motion_to_dismiss",
  "arguments": ["lack of jurisdiction", "failure to state claim"],
  "researchIds": ["research_123", "research_456"]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "outline": {...},
    "suggestedCases": [...],
    "arguments": [...]
  }
}
```

### Contract Generation

#### GET /ai/contracts/templates
List available contract templates
```json
Query Parameters:
- type: string
- jurisdiction: string
- search: string

Response: 200 OK
{
  "success": true,
  "data": [...ContractTemplate[]],
  "metadata": { ...ResponseMetadata }
}
```

#### POST /ai/contracts/generate
Generate contract from template
```json
Request:
{
  "templateId": "template_123",
  "variables": {
    "partyA": "ABC Corporation",
    "partyB": "XYZ Inc.",
    "effectiveDate": "2024-01-01",
    "term": "2 years",
    "amount": 100000
  },
  "customClauses": ["arbitration", "non-compete"]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "documentId": "doc_789",
    "content": "...",
    "format": "docx",
    "downloadUrl": "https://..."
  }
}
```

#### POST /ai/contracts/review
Review contract for issues
```json
Request:
{
  "documentId": "doc_123",
  "reviewType": ["risks", "missing_clauses", "unfavorable_terms"],
  "clientPosition": "buyer"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "risks": [...Risk[]],
    "recommendations": [...],
    "missingClauses": [...],
    "negotiationPoints": [...]
  }
}
```

### AI Chat

#### POST /ai/chat/sessions
Create new chat session
```json
Request:
{
  "type": "DOCUMENT_REVIEW",
  "context": {
    "documentIds": ["doc_123"],
    "caseId": "case_456"
  }
}

Response: 201 Created
{
  "success": true,
  "data": { ...ChatSession }
}
```

#### POST /ai/chat/sessions/:id/messages
Send message to chat session
```json
Request:
{
  "content": "What are the main risks in this contract?",
  "attachments": [
    {
      "type": "DOCUMENT",
      "id": "doc_789"
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "data": { ...ChatMessage }
}
```

#### GET /ai/chat/sessions
List chat sessions
```json
Query Parameters:
- type: ChatType
- status: string
- search: string

Response: 200 OK
{
  "success": true,
  "data": [...ChatSession[]],
  "metadata": { ...ResponseMetadata }
}
```

---

## 3. Client Management

### Client CRUD

#### GET /clients
List all clients
```json
Query Parameters:
- status: ClientStatus
- type: INDIVIDUAL | BUSINESS
- tags: string[]
- search: string
- page: number
- pageSize: number

Response: 200 OK
{
  "success": true,
  "data": [...Client[]],
  "metadata": { ...ResponseMetadata }
}
```

#### GET /clients/:id
Get client details
```json
Response: 200 OK
{
  "success": true,
  "data": { ...Client }
}
```

#### POST /clients
Create new client
```json
Request:
{
  "type": "INDIVIDUAL",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@email.com",
  "phone": "+1234567890",
  "address": { ...Address },
  "source": "REFERRAL",
  "referredBy": "John Smith"
}

Response: 201 Created
{
  "success": true,
  "data": { ...Client }
}
```

#### PATCH /clients/:id
Update client
```json
Request:
{
  "status": "ACTIVE",
  "tags": ["VIP", "Corporate"],
  "notes": "Preferred contact time: mornings"
}

Response: 200 OK
{
  "success": true,
  "data": { ...Client }
}
```

#### DELETE /clients/:id
Archive client
```json
Response: 204 No Content
```

### Intake Management

#### POST /intake
Create new intake
```json
Request:
{
  "type": "PERSONAL_INJURY",
  "data": {
    "incidentDate": "2024-01-15",
    "injuryDescription": "Slip and fall at grocery store",
    "medicalTreatment": true,
    "propertyDamage": false
  }
}

Response: 201 Created
{
  "success": true,
  "data": { ...Intake }
}
```

#### GET /intake
List intake requests
```json
Query Parameters:
- status: IntakeStatus
- type: IntakeType
- assignedTo: string
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": [...Intake[]],
  "metadata": { ...ResponseMetadata }
}
```

#### PATCH /intake/:id
Update intake status
```json
Request:
{
  "status": "ACCEPTED",
  "assignedTo": "user_123",
  "notes": [
    {
      "content": "Strong case, proceed with engagement",
      "isInternal": true
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "data": { ...Intake }
}
```

### Case Management

#### POST /cases
Create new case
```json
Request:
{
  "clientId": "client_123",
  "title": "Doe v. ABC Corp",
  "type": "Personal Injury",
  "practiceArea": "Personal Injury",
  "assignedAttorneys": ["user_123"],
  "court": {
    "name": "Superior Court of California",
    "jurisdiction": "Los Angeles County"
  }
}

Response: 201 Created
{
  "success": true,
  "data": { ...Case }
}
```

#### GET /cases
List cases
```json
Query Parameters:
- status: CaseStatus
- priority: Priority
- assignedTo: string
- clientId: string
- search: string

Response: 200 OK
{
  "success": true,
  "data": [...Case[]],
  "metadata": { ...ResponseMetadata }
}
```

#### GET /cases/:id
Get case details
```json
Response: 200 OK
{
  "success": true,
  "data": { ...Case }
}
```

#### PATCH /cases/:id
Update case
```json
Request:
{
  "status": "DISCOVERY",
  "priority": "HIGH",
  "opposingCounsel": [
    {
      "name": "John Attorney",
      "firm": "Big Law Firm",
      "email": "john@biglawfirm.com"
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "data": { ...Case }
}
```

#### POST /cases/:id/documents
Add document to case
```json
Request:
{
  "documentId": "doc_123",
  "type": "EVIDENCE",
  "description": "Surveillance footage"
}

Response: 200 OK
{
  "success": true,
  "message": "Document added to case"
}
```

#### POST /cases/:id/notes
Add note to case
```json
Request:
{
  "content": "Client provided additional witness information",
  "isInternal": false,
  "attachments": ["doc_456"]
}

Response: 201 Created
{
  "success": true,
  "data": { ...CaseNote }
}
```

#### POST /cases/:id/dates
Add important date
```json
Request:
{
  "type": "DEADLINE",
  "description": "Discovery deadline",
  "date": "2024-03-15",
  "reminder": {
    "enabled": true,
    "daysBefore": 7,
    "time": "09:00"
  }
}

Response: 201 Created
{
  "success": true,
  "data": { ...CaseDate }
}
```

### Communication Tracking

#### POST /communications
Log communication
```json
Request:
{
  "type": "EMAIL",
  "direction": "OUTBOUND",
  "subject": "Case Update",
  "content": "Dear client...",
  "from": {
    "type": "USER",
    "id": "user_123",
    "name": "John Attorney"
  },
  "to": [
    {
      "type": "CLIENT",
      "id": "client_456",
      "name": "Jane Doe"
    }
  ],
  "caseId": "case_789"
}

Response: 201 Created
{
  "success": true,
  "data": { ...Communication }
}
```

#### GET /communications
List communications
```json
Query Parameters:
- type: CommunicationType
- caseId: string
- clientId: string
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": [...Communication[]],
  "metadata": { ...ResponseMetadata }
}
```

---

## 4. Marketing Automation

### SEO Analysis

#### POST /marketing/seo/analyze
Analyze website SEO
```json
Request:
{
  "url": "https://lawfirm.com",
  "competitors": [
    "https://competitor1.com",
    "https://competitor2.com"
  ],
  "keywords": ["personal injury lawyer", "car accident attorney"]
}

Response: 202 Accepted
{
  "success": true,
  "data": {
    "analysisId": "seo_123",
    "status": "processing",
    "estimatedTime": 300
  }
}
```

#### GET /marketing/seo/analysis/:id
Get SEO analysis results
```json
Response: 200 OK
{
  "success": true,
  "data": { ...SEOAnalysis }
}
```

#### GET /marketing/seo/keywords
Get keyword rankings
```json
Query Parameters:
- domain: string
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": {
    "keywords": [...KeywordAnalysis[]],
    "summary": {
      "totalKeywords": 150,
      "avgPosition": 12.5,
      "topTen": 45
    }
  }
}
```

#### POST /marketing/seo/recommendations/:id/implement
Mark recommendation as implemented
```json
Response: 200 OK
{
  "success": true,
  "message": "Recommendation marked as implemented"
}
```

### Campaign Management

#### POST /marketing/campaigns
Create marketing campaign
```json
Request:
{
  "name": "Q1 2024 Lead Generation",
  "type": "MULTI_CHANNEL",
  "goals": [
    {
      "type": "LEADS",
      "target": 100,
      "deadline": "2024-03-31"
    }
  ],
  "targetAudience": {
    "demographics": {
      "ageRange": { "min": 25, "max": 65 },
      "locations": [
        {
          "type": "CITY",
          "value": "Los Angeles"
        }
      ]
    },
    "interests": ["legal services", "personal injury"]
  },
  "budget": {
    "total": 10000,
    "currency": "USD",
    "type": "TOTAL"
  },
  "channels": [
    {
      "type": "GOOGLE",
      "enabled": true,
      "budget": 5000
    },
    {
      "type": "FACEBOOK",
      "enabled": true,
      "budget": 3000
    }
  ]
}

Response: 201 Created
{
  "success": true,
  "data": { ...Campaign }
}
```

#### GET /marketing/campaigns
List campaigns
```json
Query Parameters:
- status: CampaignStatus
- type: CampaignType
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": [...Campaign[]],
  "metadata": { ...ResponseMetadata }
}
```

#### PATCH /marketing/campaigns/:id
Update campaign
```json
Request:
{
  "status": "PAUSED",
  "budget": {
    "total": 15000
  }
}

Response: 200 OK
{
  "success": true,
  "data": { ...Campaign }
}
```

#### GET /marketing/campaigns/:id/performance
Get campaign performance metrics
```json
Query Parameters:
- dateRange: start,end
- granularity: day|week|month

Response: 200 OK
{
  "success": true,
  "data": {
    "overall": { ...CampaignPerformance },
    "timeline": [
      {
        "date": "2024-01-01",
        "metrics": { ...CampaignPerformance }
      }
    ],
    "channels": {
      "GOOGLE": { ...CampaignPerformance },
      "FACEBOOK": { ...CampaignPerformance }
    }
  }
}
```

### Lead Management

#### POST /marketing/leads
Create new lead
```json
Request:
{
  "contactInfo": {
    "name": "John Prospect",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "source": {
    "type": "CAMPAIGN",
    "campaign": "campaign_123",
    "medium": "cpc",
    "content": "ad_variant_a"
  },
  "interests": ["personal injury", "car accident"]
}

Response: 201 Created
{
  "success": true,
  "data": { ...Lead }
}
```

#### GET /marketing/leads
List leads
```json
Query Parameters:
- status: LeadStatus
- source: string
- assignedTo: string
- score: min,max
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": [...Lead[]],
  "metadata": { ...ResponseMetadata }
}
```

#### PATCH /marketing/leads/:id
Update lead
```json
Request:
{
  "status": "QUALIFIED",
  "score": 85,
  "assignedTo": "user_123"
}

Response: 200 OK
{
  "success": true,
  "data": { ...Lead }
}
```

#### POST /marketing/leads/:id/convert
Convert lead to client
```json
Request:
{
  "intakeId": "intake_123",
  "notes": "Qualified lead ready for consultation"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "clientId": "client_789",
    "message": "Lead successfully converted to client"
  }
}
```

#### POST /marketing/leads/:id/interactions
Log lead interaction
```json
Request:
{
  "type": "PHONE",
  "description": "Initial consultation call",
  "outcome": "Interested in services",
  "nextAction": "Schedule in-person consultation"
}

Response: 201 Created
{
  "success": true,
  "data": { ...LeadInteraction }
}
```

---

## 5. Video Agents

### Session Management

#### POST /video/sessions
Create video session
```json
Request:
{
  "type": "CONSULTATION",
  "participants": [
    {
      "type": "USER",
      "id": "user_123",
      "role": "Attorney"
    },
    {
      "type": "CLIENT",
      "id": "client_456",
      "role": "Client"
    }
  ],
  "scheduledFor": "2024-02-01T10:00:00Z",
  "metadata": {
    "purpose": "Initial consultation",
    "caseId": "case_789"
  }
}

Response: 201 Created
{
  "success": true,
  "data": { ...VideoSession }
}
```

#### GET /video/sessions
List video sessions
```json
Query Parameters:
- type: VideoSessionType
- status: VideoSessionStatus
- participantId: string
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": [...VideoSession[]],
  "metadata": { ...ResponseMetadata }
}
```

#### GET /video/sessions/:id
Get session details
```json
Response: 200 OK
{
  "success": true,
  "data": { ...VideoSession }
}
```

#### POST /video/sessions/:id/start
Start video session
```json
Response: 200 OK
{
  "success": true,
  "data": {
    "sessionUrl": "https://video.hodos360.com/session/abc123",
    "token": "participant_token_xyz"
  }
}
```

#### POST /video/sessions/:id/end
End video session
```json
Response: 200 OK
{
  "success": true,
  "data": {
    "duration": 1800,
    "recordingUrl": "https://storage.hodos360.com/recordings/session_123.mp4"
  }
}
```

### Transcript Processing

#### GET /video/sessions/:id/transcript
Get session transcript
```json
Response: 200 OK
{
  "success": true,
  "data": { ...Transcript }
}
```

#### POST /video/transcripts/:id/analyze
Analyze transcript
```json
Request:
{
  "analysisType": ["sentiment", "key_points", "action_items"],
  "customPrompts": ["Identify legal issues discussed"]
}

Response: 200 OK
{
  "success": true,
  "data": {
    "sentiment": { ...SentimentAnalysis },
    "keyPoints": [...],
    "actionItems": [...ActionItem[]],
    "customAnalysis": {
      "legalIssues": [...]
    }
  }
}
```

### Appointment Scheduling

#### POST /video/appointments
Create appointment
```json
Request:
{
  "type": "CONSULTATION",
  "title": "Initial Consultation - John Doe",
  "participantIds": ["user_123", "client_456"],
  "location": {
    "type": "VIDEO"
  },
  "startTime": "2024-02-01T10:00:00Z",
  "endTime": "2024-02-01T11:00:00Z",
  "reminders": [
    {
      "type": "EMAIL",
      "timeBefore": 1440 // 24 hours
    },
    {
      "type": "SMS",
      "timeBefore": 60 // 1 hour
    }
  ]
}

Response: 201 Created
{
  "success": true,
  "data": { ...Appointment }
}
```

#### GET /video/appointments
List appointments
```json
Query Parameters:
- type: AppointmentType
- status: AppointmentStatus
- participantId: string
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": [...Appointment[]],
  "metadata": { ...ResponseMetadata }
}
```

#### PATCH /video/appointments/:id
Update appointment
```json
Request:
{
  "status": "RESCHEDULED",
  "startTime": "2024-02-02T14:00:00Z",
  "endTime": "2024-02-02T15:00:00Z"
}

Response: 200 OK
{
  "success": true,
  "data": { ...Appointment }
}
```

#### POST /video/appointments/:id/cancel
Cancel appointment
```json
Request:
{
  "reason": "Client requested reschedule",
  "notifyParticipants": true
}

Response: 200 OK
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

#### GET /video/appointments/availability
Check availability
```json
Query Parameters:
- participantIds: string[] (comma-separated)
- duration: number (minutes)
- dateRange: start,end

Response: 200 OK
{
  "success": true,
  "data": {
    "slots": [
      {
        "start": "2024-02-01T09:00:00Z",
        "end": "2024-02-01T10:00:00Z"
      },
      {
        "start": "2024-02-01T14:00:00Z",
        "end": "2024-02-01T15:00:00Z"
      }
    ]
  }
}
```

---

## 6. Webhooks

### Webhook Management

#### POST /webhooks
Register webhook
```json
Request:
{
  "url": "https://yourapp.com/webhooks/hodos",
  "events": [
    "client.created",
    "case.updated",
    "document.analyzed"
  ],
  "headers": {
    "X-Custom-Header": "value"
  }
}

Response: 201 Created
{
  "success": true,
  "data": {
    "id": "webhook_123",
    "secret": "whsec_abc123...",
    ...Webhook
  }
}
```

#### GET /webhooks
List webhooks
```json
Response: 200 OK
{
  "success": true,
  "data": [...Webhook[]]
}
```

#### PATCH /webhooks/:id
Update webhook
```json
Request:
{
  "active": false,
  "events": ["client.created", "client.updated"]
}

Response: 200 OK
{
  "success": true,
  "data": { ...Webhook }
}
```

#### DELETE /webhooks/:id
Delete webhook
```json
Response: 204 No Content
```

#### POST /webhooks/:id/test
Test webhook
```json
Request:
{
  "event": "client.created"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "status": "sent",
    "response": {
      "statusCode": 200,
      "body": "OK"
    }
  }
}
```

---

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "timestamp": "2024-01-27T10:30:00Z"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

---

## Webhook Events

### Event Payload Format
```json
{
  "event": "client.created",
  "firmId": "firm_123",
  "timestamp": "2024-01-27T10:30:00Z",
  "data": {
    // Event-specific data
  },
  "signature": "sha256=abc123..."
}
```

### Webhook Signature Verification
Verify webhook authenticity using HMAC-SHA256:
```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${hash}` === signature;
}
```

---

## SDK Examples

### JavaScript/TypeScript
```typescript
import { HodosClient } from '@hodos360/sdk';

const client = new HodosClient({
  apiKey: 'your_api_key',
  firmId: 'firm_123'
});

// Create a new client
const newClient = await client.clients.create({
  type: 'INDIVIDUAL',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@email.com'
});

// Analyze a document
const analysis = await client.ai.analyzeDocument(documentId, {
  analysisType: ['summary', 'risks', 'obligations']
});

// Search cases
const cases = await client.ai.searchCases({
  query: 'breach of contract',
  jurisdiction: ['CA'],
  maxResults: 20
});
```

### Python
```python
from hodos360 import HodosClient

client = HodosClient(
    api_key="your_api_key",
    firm_id="firm_123"
)

# Create a new case
new_case = client.cases.create(
    client_id="client_456",
    title="Smith v. ABC Corp",
    type="Contract Dispute",
    practice_area="Business Law"
)

# Generate a contract
contract = client.ai.generate_contract(
    template_id="template_789",
    variables={
        "party_a": "ABC Corp",
        "party_b": "XYZ Inc",
        "amount": 50000
    }
)
```

---

## Best Practices

1. **Authentication**: Always use HTTPS and keep your API keys secure
2. **Rate Limiting**: Implement exponential backoff for rate limit errors
3. **Pagination**: Use cursor-based pagination for large datasets
4. **Webhooks**: Verify webhook signatures and implement idempotency
5. **Error Handling**: Always check the `success` field and handle errors gracefully
6. **Bulk Operations**: Use batch endpoints when available for better performance
7. **Caching**: Cache frequently accessed data like user profiles and firm settings

---

## Support

- Email: api-support@hodos360.com
- Documentation: https://docs.hodos360.com
- Status Page: https://status.hodos360.com
- Developer Forum: https://developers.hodos360.com/forum
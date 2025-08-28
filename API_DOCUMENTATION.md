<metadata>
purpose: Comprehensive API documentation for HODOS 360 legal tech platform
type: REST API documentation
language: TypeScript/Next.js
dependencies: NextAuth, Prisma, OpenAI, Stripe, SendGrid
last-updated: 2025-08-28T00:00:00Z
</metadata>

<overview>
HODOS 360 provides a comprehensive API suite for AI-powered legal technology solutions. The platform offers three flagship products through unified APIs: HODOS (law firm management), HODOS Marketing Platform (AI SEO and marketing), and HODOS VIDEO Agents (video/voice AI for reception and sales). All APIs follow RESTful principles with consistent JSON responses, comprehensive error handling, and built-in security middleware.
</overview>

# HODOS 360 API Documentation

## 🚀 Getting Started

### Base URL
```
Production: https://hodos360.com/api
Development: http://localhost:3000/api
```

### API Version
Current version: `v1` (default, included in all endpoints)

### Response Format
All API responses follow this consistent structure:
```json
{
  "success": true|false,
  "data": {}, // Present on successful requests
  "error": "string", // Present on failed requests
  "message": "string", // Optional descriptive message
  "pagination": {}, // Present on paginated responses
  "metadata": {} // Additional context information
}
```

## 🔐 Authentication

<authentication>
<method name="oauth2">
  <provider>NextAuth with Google, GitHub, Microsoft</provider>
  <flow>Authorization Code Flow</flow>
  <scope>openid, profile, email</scope>
  <endpoint>/api/auth/signin</endpoint>
</method>

<method name="api-key">
  <header>Authorization: Bearer {api_key}</header>
  <format>hk_live_xxxxxxxxxxxx | hk_test_xxxxxxxxxxxx</format>
  <rate-limit>Based on subscription tier</rate-limit>
</method>

<method name="session">
  <type>HTTP-only cookie</type>
  <name>next-auth.session-token</name>
  <expiry>30 days</expiry>
</method>
</authentication>

### Authentication Setup

1. **OAuth Authentication**
```bash
# Redirect to OAuth provider
GET /api/auth/signin/google

# Handle callback
GET /api/auth/callback/google?code={code}&state={state}

# Get session
GET /api/auth/session
```

2. **API Key Authentication**
```javascript
const response = await fetch('/api/cases', {
  headers: {
    'Authorization': 'Bearer hk_live_xxxxxxxxxxxx',
    'Content-Type': 'application/json'
  }
})
```

## 🛡️ Security & Middleware

<security>
<middleware name="rate-limiting">
  <tiers>
    <tier name="starter" limit="100" window="hour"/>
    <tier name="professional" limit="1000" window="hour"/>
    <tier name="enterprise" limit="10000" window="hour"/>
  </tiers>
  <headers>
    <header name="X-RateLimit-Limit">Request limit per window</header>
    <header name="X-RateLimit-Remaining">Requests remaining</header>
    <header name="X-RateLimit-Reset">Window reset time</header>
  </headers>
</middleware>

<middleware name="security-headers">
  <header name="X-Frame-Options">DENY</header>
  <header name="X-Content-Type-Options">nosniff</header>
  <header name="X-XSS-Protection">1; mode=block</header>
  <header name="Strict-Transport-Security">max-age=31536000</header>
</middleware>

<middleware name="rbac">
  <roles>attorney, paralegal, admin, client</roles>
  <permissions>read, write, admin, billing</permissions>
</middleware>
</security>

## 📊 Core APIs

<functions>
<function name="listCases">
  <signature>GET /api/cases</signature>
  <purpose>Retrieve cases with filtering and pagination</purpose>
  <parameters>
    <param name="page" type="number" required="false">Page number (default: 1)</param>
    <param name="limit" type="number" required="false">Items per page (1-100, default: 10)</param>
    <param name="status" type="string" required="false">Filter by status (open|pending|closed|archived)</param>
    <param name="caseType" type="string" required="false">Filter by case type</param>
    <param name="priority" type="string" required="false">Filter by priority (low|medium|high|urgent)</param>
    <param name="clientId" type="string" required="false">Filter by client ID</param>
    <param name="search" type="string" required="false">Search in title and description</param>
  </parameters>
  <returns>Paginated list of cases with client information and document counts</returns>
  <examples>
    <example>
      <input>GET /api/cases?status=open&page=1&limit=5</input>
      <output>{
  "success": true,
  "data": [
    {
      "id": "case_123",
      "title": "Personal Injury - Smith vs ABC Corp",
      "description": "Workplace injury case",
      "caseType": "personal_injury",
      "status": "open",
      "priority": "high",
      "startDate": "2025-01-15T00:00:00Z",
      "endDate": null,
      "client": {
        "id": "client_456",
        "firstName": "John",
        "lastName": "Smith",
        "email": "john.smith@email.com",
        "company": null
      },
      "_count": { "documents": 15 },
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-20T14:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "totalCount": 25,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}</output>
    </example>
  </examples>
  <errors>
    <error type="ValidationError">Invalid pagination parameters</error>
    <error type="AuthenticationError">User not authenticated</error>
  </errors>
</function>

<function name="createCase">
  <signature>POST /api/cases</signature>
  <purpose>Create a new case with validation</purpose>
  <parameters>
    <param name="title" type="string" required="true">Case title (max 255 characters)</param>
    <param name="description" type="string" required="false">Case description</param>
    <param name="caseType" type="string" required="true">Type of case (max 100 characters)</param>
    <param name="status" type="string" required="false">Initial status (default: open)</param>
    <param name="priority" type="string" required="false">Priority level (default: medium)</param>
    <param name="startDate" type="string" required="false">Case start date (ISO 8601)</param>
    <param name="endDate" type="string" required="false">Case end date (ISO 8601)</param>
    <param name="clientId" type="string" required="true">Associated client ID</param>
  </parameters>
  <returns>Created case object with client information</returns>
  <examples>
    <example>
      <input>POST /api/cases
{
  "title": "Contract Dispute - XYZ vs DEF",
  "description": "Breach of contract regarding software licensing",
  "caseType": "contract_dispute",
  "priority": "high",
  "clientId": "client_789"
}</input>
      <output>{
  "success": true,
  "message": "Case created successfully",
  "data": {
    "id": "case_new123",
    "title": "Contract Dispute - XYZ vs DEF",
    "description": "Breach of contract regarding software licensing",
    "caseType": "contract_dispute",
    "status": "open",
    "priority": "high",
    "startDate": "2025-08-28T00:00:00Z",
    "endDate": null,
    "client": {
      "id": "client_789",
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "jane.doe@company.com",
      "company": "XYZ Corporation"
    },
    "_count": { "documents": 0 },
    "createdAt": "2025-08-28T12:00:00Z",
    "updatedAt": "2025-08-28T12:00:00Z"
  }
}</output>
    </example>
  </examples>
  <errors>
    <error type="ValidationError">Missing required fields or invalid data types</error>
    <error type="NotFoundError">Client not found or access denied</error>
    <error type="BusinessLogicError">End date cannot be before start date</error>
  </errors>
</function>

<function name="listClients">
  <signature>GET /api/clients</signature>
  <purpose>Retrieve clients with filtering and search capabilities</purpose>
  <parameters>
    <param name="page" type="number" required="false">Page number (default: 1)</param>
    <param name="limit" type="number" required="false">Items per page (1-100, default: 10)</param>
    <param name="search" type="string" required="false">Search in name, email, company</param>
    <param name="status" type="string" required="false">Filter by status (active|inactive)</param>
  </parameters>
  <returns>Paginated list of clients with case counts</returns>
</function>

<function name="createClient">
  <signature>POST /api/clients</signature>
  <purpose>Create a new client record</purpose>
  <parameters>
    <param name="firstName" type="string" required="true">Client first name</param>
    <param name="lastName" type="string" required="true">Client last name</param>
    <param name="email" type="string" required="true">Client email address</param>
    <param name="phone" type="string" required="false">Client phone number</param>
    <param name="company" type="string" required="false">Client company</param>
    <param name="address" type="object" required="false">Client address object</param>
  </parameters>
  <returns>Created client object</returns>
</function>

<function name="listDocuments">
  <signature>GET /api/documents</signature>
  <purpose>Retrieve documents with filtering by case, type, and metadata</purpose>
  <parameters>
    <param name="caseId" type="string" required="false">Filter by case ID</param>
    <param name="type" type="string" required="false">Filter by document type</param>
    <param name="page" type="number" required="false">Page number</param>
    <param name="limit" type="number" required="false">Items per page</param>
  </parameters>
  <returns>Paginated list of documents with metadata and download URLs</returns>
</function>

<function name="uploadDocument">
  <signature>POST /api/documents</signature>
  <purpose>Upload document with automatic processing and metadata extraction</purpose>
  <parameters>
    <param name="file" type="file" required="true">Document file (PDF, DOC, DOCX)</param>
    <param name="caseId" type="string" required="false">Associated case ID</param>
    <param name="type" type="string" required="false">Document type classification</param>
    <param name="tags" type="array" required="false">Document tags</param>
  </parameters>
  <returns>Document object with extracted metadata and processing status</returns>
</function>
</functions>

## 🤖 AI Service APIs

<functions>
<function name="aiChat">
  <signature>POST /api/ai/chat</signature>
  <purpose>General AI chat with context-specific prompts and streaming support</purpose>
  <parameters>
    <param name="message" type="string" required="true">User message (1-4000 characters)</param>
    <param name="sessionId" type="string" required="false">Continue existing conversation</param>
    <param name="context" type="string" required="false">AI context (general|legal|marketing|video)</param>
    <param name="stream" type="boolean" required="false">Enable streaming response (default: false)</param>
  </parameters>
  <returns>AI response with session management and metadata</returns>
  <examples>
    <example>
      <input>POST /api/ai/chat
{
  "message": "Help me draft a contract for software licensing",
  "context": "legal",
  "stream": false
}</input>
      <output>{
  "success": true,
  "data": {
    "message": "I'd be happy to help you draft a software licensing contract. Here are the key components you should include:\n\n1. **License Grant**\n   - Define the scope of the license (exclusive vs non-exclusive)\n   - Specify permitted uses and restrictions\n   - Geographic limitations if applicable\n\n2. **License Terms**\n   - Duration of the license\n   - Renewal options\n   - Termination conditions\n\n...",
    "sessionId": "sess_abc123",
    "timestamp": "2025-08-28T12:00:00Z",
    "metadata": {
      "context": "legal",
      "responseTime": 1200,
      "tokenUsage": 350
    }
  }
}</output>
    </example>
  </examples>
  <errors>
    <error type="ValidationError">Message too long or invalid context</error>
    <error type="AIError">AI service temporarily unavailable</error>
    <error type="RateLimitError">Too many requests</error>
  </errors>
</function>

<function name="legalResearch">
  <signature>POST /api/ai/legal/research</signature>
  <purpose>Comprehensive legal research with case law, statutes, and analysis</purpose>
  <parameters>
    <param name="query" type="string" required="true">Research query (1-1000 characters)</param>
    <param name="jurisdiction" type="string" required="false">Legal jurisdiction</param>
    <param name="practiceArea" type="string" required="false">Practice area (civil|criminal|corporate|family|immigration|employment|tax|intellectual_property)</param>
    <param name="caseType" type="string" required="false">Research focus (precedent|statute|regulation|comprehensive)</param>
    <param name="depth" type="string" required="false">Analysis depth (summary|detailed|comprehensive)</param>
    <param name="stream" type="boolean" required="false">Enable streaming response</param>
  </parameters>
  <returns>Comprehensive legal research report with cases, statutes, analysis, and sources</returns>
  <examples>
    <example>
      <input>POST /api/ai/legal/research
{
  "query": "employment contract non-compete clauses enforceability",
  "jurisdiction": "California",
  "practiceArea": "employment",
  "depth": "detailed"
}</input>
      <output>{
  "success": true,
  "data": {
    "query": "employment contract non-compete clauses enforceability",
    "jurisdiction": "California",
    "practiceArea": "employment",
    "cases": [
      {
        "title": "Edwards v. Arthur Andersen LLP",
        "citation": "44 Cal. 4th 937 (2008)",
        "court": "California Supreme Court",
        "year": 2008,
        "relevance": 0.95,
        "summary": "California Supreme Court held that Business and Professions Code Section 16600 invalidates non-compete agreements...",
        "keyHoldings": [
          "Section 16600 prohibits restraints on trade",
          "Narrow exceptions exist for trade secrets"
        ]
      }
    ],
    "statutes": [
      {
        "title": "Business and Professions Code Section 16600",
        "section": "16600",
        "jurisdiction": "California",
        "summary": "Prohibits contracts that restrain trade or business",
        "relevantText": "Except as provided in this chapter, every contract by which anyone is restrained from engaging in a lawful profession, trade, or business of any kind is to that extent void."
      }
    ],
    "analysis": {
      "overview": "California has some of the strongest anti-non-compete laws in the United States...",
      "keyLegalPrinciples": [
        "California strongly favors employee mobility",
        "Non-compete clauses are generally void"
      ],
      "practicalApplications": [
        "Focus on trade secret protection instead",
        "Use non-solicitation agreements where appropriate"
      ],
      "potentialIssues": [
        "Multi-state enforcement complications",
        "Choice of law clauses may be challenged"
      ],
      "recommendations": [
        "Draft narrow trade secret provisions",
        "Consider garden leave alternatives"
      ]
    },
    "sources": [
      {
        "type": "case",
        "title": "Edwards v. Arthur Andersen LLP",
        "citation": "44 Cal. 4th 937 (2008)",
        "reliability": 0.98
      }
    ],
    "metadata": {
      "searchTerms": ["employment", "contract", "non-compete", "enforceability"],
      "processingTime": 2500,
      "tokenUsage": 1250,
      "confidenceScore": 0.92
    }
  }
}</output>
    </example>
  </examples>
</function>

<function name="generateLegalBrief">
  <signature>POST /api/ai/legal/brief</signature>
  <purpose>Generate professional legal briefs with proper formatting and citations</purpose>
  <parameters>
    <param name="caseDetails" type="object" required="true">Case information and arguments</param>
    <param name="briefType" type="string" required="false">Type of brief (motion|appeal|summary|research)</param>
    <param name="format" type="string" required="false">Output format (markdown|docx|pdf)</param>
  </parameters>
  <returns>Generated legal brief with proper structure and citations</returns>
</function>

<function name="analyzeContract">
  <signature>POST /api/ai/legal/contract</signature>
  <purpose>Analyze contracts for risks, obligations, and key terms</purpose>
  <parameters>
    <param name="document" type="file" required="true">Contract document</param>
    <param name="analysisType" type="string" required="false">Analysis focus (risks|obligations|terms|all)</param>
  </parameters>
  <returns>Comprehensive contract analysis with risk assessment and recommendations</returns>
</function>

<function name="generateMarketingContent">
  <signature>POST /api/ai/marketing/content</signature>
  <purpose>Generate SEO-optimized marketing content for law firms</purpose>
  <parameters>
    <param name="contentType" type="string" required="true">Content type (blog|social|email|landing)</param>
    <param name="practiceArea" type="string" required="true">Legal practice area</param>
    <param name="keywords" type="array" required="false">Target keywords</param>
    <param name="tone" type="string" required="false">Content tone (professional|friendly|authoritative)</param>
    <param name="length" type="string" required="false">Content length (short|medium|long)</param>
  </parameters>
  <returns>Generated marketing content with SEO optimization suggestions</returns>
</function>

<function name="researchKeywords">
  <signature>POST /api/ai/marketing/keywords</signature>
  <purpose>Research and analyze keywords for legal marketing campaigns</purpose>
  <parameters>
    <param name="practiceArea" type="string" required="true">Legal practice area</param>
    <param name="location" type="string" required="false">Geographic location</param>
    <param name="competitors" type="array" required="false">Competitor websites</param>
  </parameters>
  <returns>Keyword research with search volume, competition, and recommendations</returns>
</function>

<function name="generateVideoScript">
  <signature>POST /api/ai/video/script</signature>
  <purpose>Generate video scripts for law firm marketing and client communication</purpose>
  <parameters>
    <param name="videoType" type="string" required="true">Video type (intro|testimonial|educational|promotional)</param>
    <param name="duration" type="number" required="false">Target duration in seconds</param>
    <param name="practiceArea" type="string" required="false">Legal practice area</param>
    <param name="audience" type="string" required="false">Target audience</param>
  </parameters>
  <returns>Video script with timing, visual cues, and production notes</returns>
</function>
</functions>

## 🔗 Integration APIs

<functions>
<function name="calendarIntegration">
  <signature>GET|POST /api/integrations/calendar</signature>
  <purpose>Manage calendar integrations with Google, Outlook, and other providers</purpose>
  <parameters>
    <param name="provider" type="string" required="true">Calendar provider (google|outlook|apple)</param>
    <param name="action" type="string" required="true">Action (connect|sync|create|update|delete)</param>
  </parameters>
  <returns>Calendar integration status and synchronized events</returns>
</function>

<function name="crmIntegration">
  <signature>GET|POST /api/integrations/crm</signature>
  <purpose>Integrate with CRM systems for client data synchronization</purpose>
  <parameters>
    <param name="provider" type="string" required="true">CRM provider (salesforce|hubspot|pipedrive)</param>
    <param name="syncType" type="string" required="false">Sync type (full|incremental|realtime)</param>
  </parameters>
  <returns>CRM integration status and synchronized data</returns>
</function>

<function name="emailIntegration">
  <signature>POST /api/integrations/email</signature>
  <purpose>Send emails through integrated email services</purpose>
  <parameters>
    <param name="to" type="array" required="true">Recipient email addresses</param>
    <param name="subject" type="string" required="true">Email subject</param>
    <param name="content" type="string" required="true">Email content (HTML or text)</param>
    <param name="template" type="string" required="false">Email template ID</param>
  </parameters>
  <returns>Email delivery status and tracking information</returns>
</function>

<function name="paymentIntegration">
  <signature>POST /api/integrations/payment</signature>
  <purpose>Process payments through Stripe and other payment providers</purpose>
  <parameters>
    <param name="amount" type="number" required="true">Payment amount in cents</param>
    <param name="currency" type="string" required="false">Currency code (default: USD)</param>
    <param name="clientId" type="string" required="true">Client making payment</param>
    <param name="invoiceId" type="string" required="false">Associated invoice</param>
  </parameters>
  <returns>Payment intent and processing status</returns>
</function>

<function name="storageIntegration">
  <signature>GET|POST /api/integrations/storage</signature>
  <purpose>Manage cloud storage integrations for document management</purpose>
  <parameters>
    <param name="provider" type="string" required="true">Storage provider (aws|google|azure|dropbox)</param>
    <param name="action" type="string" required="true">Action (upload|download|list|delete)</param>
    <param name="path" type="string" required="false">File or folder path</param>
  </parameters>
  <returns>Storage operation result and file metadata</returns>
</function>
</functions>

## 📈 Analytics APIs

<functions>
<function name="dashboardMetrics">
  <signature>GET /api/analytics/dashboard</signature>
  <purpose>Retrieve comprehensive dashboard metrics and KPIs</purpose>
  <parameters>
    <param name="timeRange" type="string" required="false">Time range (day|week|month|quarter|year)</param>
    <param name="metrics" type="array" required="false">Specific metrics to include</param>
  </parameters>
  <returns>Dashboard metrics with charts data and trends</returns>
  <examples>
    <example>
      <input>GET /api/analytics/dashboard?timeRange=month</input>
      <output>{
  "success": true,
  "data": {
    "summary": {
      "totalCases": 150,
      "activeCases": 89,
      "newCases": 12,
      "closedCases": 8,
      "totalRevenue": 125000,
      "averageCaseValue": 8333
    },
    "trends": {
      "casesOverTime": [
        { "date": "2025-08-01", "cases": 145 },
        { "date": "2025-08-15", "cases": 148 },
        { "date": "2025-08-28", "cases": 150 }
      ],
      "revenueOverTime": [
        { "date": "2025-08-01", "revenue": 120000 },
        { "date": "2025-08-15", "revenue": 122500 },
        { "date": "2025-08-28", "revenue": 125000 }
      ]
    },
    "casesByStatus": {
      "open": 45,
      "pending": 44,
      "closed": 53,
      "archived": 8
    },
    "casesByType": {
      "personal_injury": 35,
      "contract_dispute": 28,
      "employment": 20,
      "real_estate": 15,
      "other": 52
    }
  }
}</output>
    </example>
  </examples>
</function>

<function name="financialAnalytics">
  <signature>GET /api/analytics/financial</signature>
  <purpose>Detailed financial analytics and reporting</purpose>
  <parameters>
    <param name="startDate" type="string" required="false">Start date (ISO 8601)</param>
    <param name="endDate" type="string" required="false">End date (ISO 8601)</param>
    <param name="breakdown" type="string" required="false">Breakdown type (client|case|practice_area)</param>
  </parameters>
  <returns>Financial metrics, revenue analysis, and profitability data</returns>
</function>

<function name="performanceAnalytics">
  <signature>GET /api/analytics/performance</signature>
  <purpose>Performance metrics for cases, attorneys, and firm efficiency</purpose>
  <parameters>
    <param name="type" type="string" required="false">Analytics type (cases|attorneys|efficiency)</param>
    <param name="period" type="string" required="false">Time period for analysis</param>
  </parameters>
  <returns>Performance metrics with comparisons and benchmarks</returns>
</function>
</functions>

## 🔄 Real-time APIs

<functions>
<function name="realtimeUpdates">
  <signature>GET /api/realtime (Server-Sent Events)</signature>
  <purpose>Real-time updates for case changes, notifications, and system events</purpose>
  <parameters>
    <param name="types" type="array" required="false">Event types to subscribe to</param>
    <param name="caseIds" type="array" required="false">Specific cases to monitor</param>
  </parameters>
  <returns>Server-sent events stream with real-time updates</returns>
  <examples>
    <example>
      <input>GET /api/realtime?types=case_update,notification</input>
      <output>data: {"type": "case_update", "caseId": "case_123", "field": "status", "value": "closed", "timestamp": "2025-08-28T12:00:00Z"}

data: {"type": "notification", "message": "New document uploaded to case", "caseId": "case_456", "timestamp": "2025-08-28T12:01:00Z"}</output>
    </example>
  </examples>
</function>
</functions>

## 🏥 System APIs

<functions>
<function name="healthCheck">
  <signature>GET /api/health</signature>
  <purpose>Comprehensive system health monitoring with service status</purpose>
  <parameters>
    <param name="detailed" type="boolean" required="false">Include detailed service health</param>
    <param name="metrics" type="boolean" required="false">Include system metrics</param>
    <param name="service" type="string" required="false">Check specific service</param>
  </parameters>
  <returns>System health status with service monitoring and alerts</returns>
  <examples>
    <example>
      <input>GET /api/health?detailed=true&metrics=true</input>
      <output>{
  "overall": {
    "status": "healthy",
    "timestamp": "2025-08-28T12:00:00Z",
    "uptime": 86400000,
    "version": "1.0.0",
    "environment": "production"
  },
  "services": [
    {
      "name": "database",
      "status": "up",
      "responseTime": 45,
      "lastCheck": "2025-08-28T12:00:00Z",
      "metadata": {
        "userCount": 1250,
        "connectionPool": {
          "activeConnections": 5,
          "idleConnections": 10,
          "maxConnections": 20
        }
      }
    },
    {
      "name": "external-apis",
      "status": "up",
      "responseTime": 120,
      "lastCheck": "2025-08-28T12:00:00Z",
      "metadata": {
        "totalServices": 3,
        "failedServices": 0,
        "successRate": 100
      }
    }
  ],
  "metrics": {
    "memory": {
      "used": 4294967296,
      "total": 8589934592,
      "percentage": 50
    },
    "cpu": {
      "usage": 25
    }
  }
}</output>
    </example>
  </examples>
</function>

<function name="generateReports">
  <signature>POST /api/reports</signature>
  <purpose>Generate custom reports for cases, clients, and business metrics</purpose>
  <parameters>
    <param name="reportType" type="string" required="true">Report type (case|client|financial|performance)</param>
    <param name="format" type="string" required="false">Output format (pdf|xlsx|csv|json)</param>
    <param name="filters" type="object" required="false">Report filters and parameters</param>
    <param name="template" type="string" required="false">Report template ID</param>
  </parameters>
  <returns>Generated report with download link and metadata</returns>
</function>
</functions>

## 📡 Server-Sent Events (SSE)

### Real-time Event Types
- `case_update`: Case status or field changes
- `document_upload`: New documents added
- `notification`: System notifications
- `payment_received`: Payment confirmations
- `task_completed`: Background task completion
- `user_activity`: User login/logout events

### Connection Example
```javascript
const eventSource = new EventSource('/api/realtime?types=case_update,notification');

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};

eventSource.onerror = function(event) {
  console.error('SSE connection error:', event);
};
```

## ❌ Error Handling

<errors>
<error code="400" type="ValidationError">
  <description>Request validation failed</description>
  <response>{
  "success": false,
  "error": "Invalid request data",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}</response>
</error>

<error code="401" type="AuthenticationError">
  <description>Authentication required or failed</description>
  <response>{
  "success": false,
  "error": "Unauthorized",
  "message": "Authentication required"
}</response>
</error>

<error code="403" type="AuthorizationError">
  <description>Insufficient permissions</description>
  <response>{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions for this resource"
}</response>
</error>

<error code="404" type="NotFoundError">
  <description>Resource not found</description>
  <response>{
  "success": false,
  "error": "Not Found",
  "message": "The requested resource was not found"
}</response>
</error>

<error code="429" type="RateLimitError">
  <description>Rate limit exceeded</description>
  <response>{
  "success": false,
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}</response>
  <headers>
    <header name="X-RateLimit-Limit">1000</header>
    <header name="X-RateLimit-Remaining">0</header>
    <header name="X-RateLimit-Reset">1698876000</header>
  </headers>
</error>

<error code="500" type="InternalServerError">
  <description>Server error</description>
  <response>{
  "success": false,
  "error": "Internal server error",
  "message": "Please try again later"
}</response>
</error>

<error code="503" type="ServiceUnavailableError">
  <description>Service temporarily unavailable</description>
  <response>{
  "success": false,
  "error": "Service unavailable",
  "message": "The service is temporarily unavailable"
}</response>
</error>
</errors>

## 🧪 Testing Guide

### Environment Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local

# Start development server
npm run dev

# Run tests
npm test
```

### Test API Key
```
Test API Key: hk_test_sk_1234567890abcdef
Rate Limit: 100 requests/hour
```

### cURL Examples
```bash
# Health check
curl -X GET "http://localhost:3000/api/health"

# List cases with authentication
curl -X GET "http://localhost:3000/api/cases?page=1&limit=5" \
  -H "Authorization: Bearer hk_test_sk_1234567890abcdef"

# Create a new case
curl -X POST "http://localhost:3000/api/cases" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hk_test_sk_1234567890abcdef" \
  -d '{
    "title": "Test Case",
    "caseType": "consultation",
    "clientId": "client_test_123"
  }'

# AI Chat
curl -X POST "http://localhost:3000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hk_test_sk_1234567890abcdef" \
  -d '{
    "message": "What are the key elements of a contract?",
    "context": "legal"
  }'

# Legal Research
curl -X POST "http://localhost:3000/api/ai/legal/research" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer hk_test_sk_1234567890abcdef" \
  -d '{
    "query": "breach of contract remedies",
    "practiceArea": "contract",
    "depth": "detailed"
  }'
```

### JavaScript SDK Example
```javascript
class HodosAPI {
  constructor(apiKey, baseURL = 'https://hodos360.com/api') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Cases
  async listCases(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/cases${query ? '?' + query : ''}`);
  }

  async createCase(caseData) {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData)
    });
  }

  // AI Services
  async chatWithAI(message, options = {}) {
    return this.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, ...options })
    });
  }

  async legalResearch(query, options = {}) {
    return this.request('/ai/legal/research', {
      method: 'POST',
      body: JSON.stringify({ query, ...options })
    });
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }
}

// Usage
const api = new HodosAPI('hk_live_your_api_key');

// List cases
const cases = await api.listCases({ status: 'open', limit: 10 });

// Create a case
const newCase = await api.createCase({
  title: 'New Client Consultation',
  caseType: 'consultation',
  clientId: 'client_123'
});

// AI Chat
const chatResponse = await api.chatWithAI(
  'Help me draft a privacy policy',
  { context: 'legal' }
);

// Legal Research
const research = await api.legalResearch(
  'GDPR compliance requirements',
  { practiceArea: 'corporate', depth: 'comprehensive' }
);
```

## 🔄 Webhook Configuration

### Supported Events
- `case.created` - New case created
- `case.updated` - Case status or details changed
- `case.closed` - Case marked as closed
- `document.uploaded` - New document added
- `payment.received` - Payment processed
- `client.created` - New client added

### Webhook Setup
```javascript
// Register webhook endpoint
curl -X POST "https://hodos360.com/api/webhooks" \
  -H "Authorization: Bearer hk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/hodos",
    "events": ["case.created", "document.uploaded"],
    "secret": "your_webhook_secret"
  }'
```

### Webhook Payload Example
```json
{
  "event": "case.created",
  "timestamp": "2025-08-28T12:00:00Z",
  "data": {
    "id": "case_123",
    "title": "New Personal Injury Case",
    "status": "open",
    "client": {
      "id": "client_456",
      "name": "John Smith"
    }
  }
}
```

## 📚 API Versioning

### Current Version: v1
All endpoints default to version 1. Future versions will be supported via:
- Header: `Accept: application/vnd.hodos.v2+json`
- URL: `/api/v2/cases`

### Deprecation Policy
- 6 months notice for breaking changes
- 12 months support for deprecated versions
- Migration guides provided

## 🚚 Migration Guide

### From Beta to v1
1. Update authentication headers
2. Handle new error response format
3. Update pagination parameter names
4. Test new validation rules

### Breaking Changes
- Authentication now requires `Bearer` prefix
- Error responses include structured `details` field
- Pagination uses `page`/`limit` instead of `offset`/`limit`

## 📞 Support

### API Support
- Email: api-support@hodos360.com
- Documentation: https://docs.hodos360.com
- Status Page: https://status.hodos360.com

### Rate Limits
- **Starter**: 100 requests/hour
- **Professional**: 1,000 requests/hour  
- **Enterprise**: 10,000 requests/hour
- **Custom**: Contact sales for higher limits

### SLA Guarantees
- **Professional**: 99.9% uptime
- **Enterprise**: 99.95% uptime
- **Response Time**: < 500ms for 95% of requests

---

*Last updated: 2025-08-28 | Version: 1.0.0*
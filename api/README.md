# HODOS 360 API Architecture

## Overview

The HODOS 360 API is a comprehensive RESTful API designed to power our AI-driven legal technology platform. It provides secure, scalable endpoints for authentication, AI services, client management, marketing automation, and video agent functionality.

## Architecture Components

### 1. Type Definitions (`/api/types/index.ts`)
Complete TypeScript interfaces for all API entities including:
- User and authentication types
- AI service types (documents, research, chat)
- Client management types
- Marketing automation types
- Video agent types
- Common API response formats

### 2. Services (`/api/services/`)
Business logic layer implementing core functionality:
- **auth.service.ts**: Authentication, authorization, session management
- **ai-document.service.ts**: Document upload, analysis, AI processing
- Additional services for each domain (to be implemented)

### 3. Middleware (`/api/middleware/`)
Request processing middleware:
- **auth.middleware.ts**: JWT validation, role-based access control
- **rate-limit.middleware.ts**: Token bucket rate limiting with Redis
- Additional middleware for validation, logging, etc. (to be implemented)

### 4. Routes (`/api/routes/`)
RESTful endpoint definitions organized by domain:
- Authentication & user management
- AI services (documents, research, contracts, chat)
- Client management (intake, cases, communications)
- Marketing automation (SEO, campaigns, leads)
- Video agents (sessions, transcripts, appointments)

## Key Features

### Security
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- API key authentication for integrations
- Request signing for webhooks
- Rate limiting per user/tier
- Input validation and sanitization

### Performance
- Redis-based caching
- Efficient pagination with cursor support
- Bulk operations for better throughput
- Async job processing for heavy operations
- Connection pooling for databases

### Scalability
- Microservices-ready architecture
- Horizontal scaling support
- Queue-based job processing
- Distributed rate limiting
- Multi-tenant isolation

### Developer Experience
- Comprehensive TypeScript types
- OpenAPI/Swagger documentation
- SDK support (JavaScript, Python)
- Webhook integrations
- GraphQL gateway (optional)

## Implementation Roadmap

### Phase 1: Foundation
- [x] Type definitions
- [x] Authentication service
- [x] AI document service
- [x] Auth middleware
- [x] Rate limiting middleware
- [ ] Database models and ORM setup
- [ ] Redis and queue configuration

### Phase 2: Core Services
- [ ] User management service
- [ ] Firm management service
- [ ] Case management service
- [ ] Client management service
- [ ] Communication tracking service

### Phase 3: AI Integration
- [ ] OpenAI integration service
- [ ] Document analysis pipeline
- [ ] Case research service
- [ ] Contract generation service
- [ ] Chat service with context

### Phase 4: Marketing & Video
- [ ] SEO analysis service
- [ ] Campaign management service
- [ ] Lead tracking service
- [ ] Video session service
- [ ] Transcript processing service

### Phase 5: Infrastructure
- [ ] Webhook delivery system
- [ ] File storage service (S3)
- [ ] Email service integration
- [ ] SMS service integration
- [ ] Analytics and monitoring

## Getting Started

### Prerequisites
```bash
# Required services
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- S3-compatible storage
```

### Environment Variables
```env
# Authentication
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/hodos

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# AI Services
OPENAI_API_KEY=your-openai-key

# Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=hodos-documents

# Email
SENDGRID_API_KEY=your-sendgrid-key
```

### Installation
```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed

# Start development server
npm run dev
```

### Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Generate test coverage
npm run test:coverage
```

## API Usage Examples

### Authentication Flow
```typescript
// 1. Register user
POST /api/v1/auth/register
{
  "email": "lawyer@firm.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "firmId": "firm_123",
  "role": "ASSOCIATE"
}

// 2. Login
POST /api/v1/auth/login
{
  "email": "lawyer@firm.com",
  "password": "SecurePassword123!"
}

// Response
{
  "success": true,
  "data": {
    "user": { ...userObject },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}

// 3. Use access token
GET /api/v1/users/me
Authorization: Bearer eyJ...
```

### Document Analysis Flow
```typescript
// 1. Upload document
POST /api/v1/ai/documents/upload
Content-Type: multipart/form-data
Authorization: Bearer eyJ...

file: contract.pdf
type: CONTRACT
confidentialityLevel: CONFIDENTIAL

// 2. Analyze document
POST /api/v1/ai/documents/{id}/analyze
{
  "analysisType": ["summary", "risks", "obligations"],
  "customPrompts": ["Extract payment terms"]
}

// 3. Get results
GET /api/v1/ai/documents/{id}/analysis
```

## Best Practices

### Error Handling
All errors follow a consistent format:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... },
    "timestamp": "2024-01-27T10:00:00Z"
  }
}
```

### Pagination
Use cursor-based pagination for large datasets:
```
GET /api/v1/clients?cursor=eyJ...&pageSize=20
```

### Rate Limiting
Check rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-27T10:05:00Z
```

### Webhooks
Verify webhook signatures:
```typescript
const signature = req.headers['x-hodos-signature'];
const isValid = verifyWebhookSignature(payload, signature, secret);
```

## Support

- Documentation: https://docs.hodos360.com
- API Status: https://status.hodos360.com
- Support: api-support@hodos360.com
- Developer Forum: https://developers.hodos360.com
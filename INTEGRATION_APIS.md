# HODOS 360 Integration APIs

This document provides an overview of the third-party integration APIs created for the HODOS 360 platform.

## 📋 Overview

Five comprehensive integration APIs have been implemented to connect HODOS 360 with essential third-party services:

1. **Calendar Integration** - Google Calendar & Outlook synchronization
2. **CRM Integration** - Salesforce & HubSpot connectors
3. **Payment Processing** - Stripe integration with full payment lifecycle
4. **Email Service** - SendGrid integration for marketing and transactional emails
5. **Storage Integration** - AWS S3 for document management and backups

## 🚀 Quick Start

### Environment Variables Required

```env
# Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret

# CRM Integration
SALESFORCE_CLIENT_ID=your_salesforce_client_id
SALESFORCE_CLIENT_SECRET=your_salesforce_client_secret

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key

# Storage Integration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# Base Configuration
NEXTAUTH_URL=http://localhost:3000
```

### Testing the APIs

Run the comprehensive test suite:

```bash
npx ts-node scripts/test-integrations.ts
```

## 📚 API Documentation

### 1. Calendar Integration (`/api/integrations/calendar`)

**Purpose**: Synchronize and manage calendar events across Google Calendar and Outlook.

#### Endpoints:

- `GET` - Sync calendar events from provider
- `POST` - Create new calendar event
- `PUT` - Update existing calendar event

#### Example Usage:

```typescript
// Sync Google Calendar events
const response = await fetch('/api/integrations/calendar?provider=google')

// Create new event
const event = {
  title: 'Client Meeting',
  description: 'Initial consultation',
  startDateTime: '2024-01-15T10:00:00Z',
  endDateTime: '2024-01-15T11:00:00Z',
  attendees: ['client@example.com'],
  provider: 'google'
}
await fetch('/api/integrations/calendar', {
  method: 'POST',
  body: JSON.stringify(event)
})
```

#### Features:
- ✅ Two-way synchronization
- ✅ Event creation and updates
- ✅ Attendee management
- ✅ Automatic token refresh
- ✅ Error handling and retry logic

---

### 2. CRM Integration (`/api/integrations/crm`)

**Purpose**: Manage leads and opportunities in Salesforce and HubSpot.

#### Endpoints:

- `GET` - Sync leads/contacts from CRM
- `POST` - Create new lead or opportunity
- `PUT` - Update existing lead

#### Example Usage:

```typescript
// Create new lead
const lead = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@lawfirm.com',
  company: 'Doe Legal Services',
  provider: 'salesforce'
}
await fetch('/api/integrations/crm', {
  method: 'POST',
  body: JSON.stringify(lead)
})

// Create opportunity
const opportunity = {
  type: 'opportunity',
  name: 'Personal Injury Case',
  amount: 75000,
  stage: 'Qualified',
  closeDate: '2024-06-15T00:00:00Z',
  provider: 'salesforce'
}
await fetch('/api/integrations/crm', {
  method: 'POST',
  body: JSON.stringify(opportunity)
})
```

#### Features:
- ✅ Lead management and conversion
- ✅ Opportunity tracking
- ✅ Custom field support
- ✅ Bidirectional sync
- ✅ Salesforce & HubSpot support

---

### 3. Payment Processing (`/api/integrations/payment`)

**Purpose**: Handle payments, subscriptions, and invoicing through Stripe.

#### Endpoints:

- `GET` - Retrieve payment data (customers, subscriptions, invoices)
- `POST` - Create payments, subscriptions, or checkout sessions
- `PUT` - Update subscriptions or process refunds
- `DELETE` - Cancel subscriptions or delete customers

#### Example Usage:

```typescript
// Create subscription
const subscription = {
  type: 'subscription',
  email: 'client@lawfirm.com',
  priceId: 'price_monthly_plan',
  trialDays: 14
}
await fetch('/api/integrations/payment', {
  method: 'POST',
  body: JSON.stringify(subscription)
})

// Process refund
const refund = {
  type: 'refund',
  paymentIntentId: 'pi_1234567890',
  amount: 5000, // $50.00
  reason: 'requested_by_customer'
}
await fetch('/api/integrations/payment', {
  method: 'PUT',
  body: JSON.stringify(refund)
})
```

#### Features:
- ✅ Subscription management
- ✅ One-time payments
- ✅ Invoice generation
- ✅ Refund processing
- ✅ Webhook support
- ✅ Customer portal integration

---

### 4. Email Service (`/api/integrations/email`)

**Purpose**: Send transactional emails and manage marketing campaigns via SendGrid.

#### Endpoints:

- `GET` - Retrieve email statistics and contact information
- `POST` - Send emails, create campaigns, or manage contacts
- `PUT` - Update contact information

#### Example Usage:

```typescript
// Send transactional email
const email = {
  type: 'email',
  to: [{ email: 'client@example.com', name: 'John Doe' }],
  from: { email: 'noreply@hodos360.com', name: 'HODOS 360' },
  subject: 'Welcome to HODOS 360',
  htmlContent: '<h1>Welcome!</h1><p>Thank you for choosing HODOS 360.</p>'
}
await fetch('/api/integrations/email', {
  method: 'POST',
  body: JSON.stringify(email)
})

// Create marketing campaign
const campaign = {
  type: 'campaign',
  title: 'Monthly Newsletter',
  subject: 'Legal Tech Updates',
  senderEmail: 'newsletter@hodos360.com',
  htmlContent: '<h1>This Month in Legal Tech</h1>...'
}
await fetch('/api/integrations/email', {
  method: 'POST',
  body: JSON.stringify(campaign)
})
```

#### Features:
- ✅ Transactional email sending
- ✅ Marketing campaign management
- ✅ Contact list management
- ✅ Email template support
- ✅ Delivery tracking and analytics
- ✅ Scheduled sending

---

### 5. Storage Integration (`/api/integrations/storage`)

**Purpose**: Manage document storage, backups, and file operations with AWS S3.

#### Endpoints:

- `GET` - List files, get file info, or download files
- `POST` - Upload files, create presigned URLs, or initiate backups
- `PUT` - Move or rename files
- `DELETE` - Delete files

#### Example Usage:

```typescript
// Upload file
const formData = new FormData()
formData.append('file', fileBlob)
formData.append('folder', 'client-documents')
await fetch('/api/integrations/storage', {
  method: 'POST',
  body: formData
})

// Create presigned upload URL
const presignedData = {
  operation: 'presigned-url',
  fileName: 'contract.pdf',
  contentType: 'application/pdf',
  operation_type: 'upload',
  folder: 'contracts'
}
const response = await fetch('/api/integrations/storage', {
  method: 'POST',
  body: JSON.stringify(presignedData)
})

// Create backup
const backup = {
  operation: 'backup',
  sourceKeys: ['documents/file1.pdf', 'documents/file2.docx'],
  backupFolder: 'monthly-backups',
  compressionLevel: 'standard'
}
await fetch('/api/integrations/storage', {
  method: 'POST',
  body: JSON.stringify(backup)
})
```

#### Features:
- ✅ File upload and download
- ✅ Multipart upload for large files
- ✅ Presigned URL generation
- ✅ Automated backups
- ✅ File organization and management
- ✅ Access control and permissions

## 🔐 Security Features

All APIs implement comprehensive security measures:

### Authentication & Authorization
- JWT-based authentication required for all endpoints
- User-specific access control
- Session validation on every request

### Input Validation
- Zod schema validation for all request data
- Type-safe parameter handling
- Sanitization of user inputs

### Error Handling
- Structured error responses
- Detailed logging for debugging
- Graceful failure modes
- Rate limiting protection

### Data Protection
- Encrypted data transmission
- Secure token storage
- PII data handling compliance
- Audit trail logging

## 📊 Monitoring & Analytics

### Built-in Tracking
Each API automatically tracks:
- Request/response metrics
- Error rates and types
- Performance timings
- Usage statistics
- Integration health status

### Database Integration
All APIs include helper functions for:
- Storing integration metadata
- Tracking sync status
- Maintaining audit logs
- Caching frequently accessed data

## 🛠️ Development & Testing

### Running Tests
```bash
# Run full integration test suite
npx ts-node scripts/test-integrations.ts

# Test specific integration
npm run test -- --grep "Calendar"
```

### Development Environment
```bash
# Start development server
npm run dev

# Check TypeScript compilation
npm run type-check

# Lint code
npm run lint
```

### Debugging
Enable detailed logging by setting:
```env
NODE_ENV=development
DEBUG=hodos:integrations
```

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] API keys and secrets added to secure storage
- [ ] Database migration scripts executed
- [ ] Webhook endpoints configured
- [ ] Rate limiting rules applied
- [ ] Monitoring alerts set up
- [ ] Error tracking enabled
- [ ] Performance metrics configured
- [ ] Security headers implemented
- [ ] SSL certificates installed

## 📞 Support & Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Verify JWT token is valid
   - Check user permissions
   - Ensure session hasn't expired

2. **Integration API Errors**
   - Verify third-party API credentials
   - Check rate limiting status
   - Review error logs for details

3. **File Upload Issues**
   - Confirm S3 bucket permissions
   - Check file size limits
   - Verify content type restrictions

### Getting Help

For additional support:
- Check the error logs in `/logs/integrations`
- Review API documentation for each service
- Contact the HODOS 360 development team

---

**Created**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
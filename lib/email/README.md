# HODOS 360 Email Service

A production-ready email service for HODOS 360 using Resend and React Email templates.

## Features

- **React Email Templates**: Beautiful, responsive email templates using React components
- **Email Queue**: Robust queue system with retry logic and exponential backoff
- **Error Handling**: Comprehensive error handling with notifications
- **Type Safety**: Full TypeScript support
- **Batch Sending**: Support for sending multiple emails efficiently
- **Email Validation**: Built-in email validation and content sanitization

## Setup

1. **Install Dependencies**
   ```bash
   npm install resend @react-email/components
   ```

2. **Configure Environment Variables**
   Copy `.env.local.example` to `.env.local` and add your Resend API key:
   ```
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM="HODOS 360 <hello@hodos360.com>"
   EMAIL_REPLY_TO=support@hodos360.com
   ```

3. **Verify Domain**
   Add your domain to Resend and verify it to send emails from your domain.

## Usage

### Sending a Single Email

```typescript
import { sendEmail } from '@/lib/email/client'
import { ContactEmail } from '@/lib/email/templates/contact'

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to HODOS 360',
  react: ContactEmail({ 
    firstName: 'John',
    lastName: 'Doe',
    // ... other props
  })
})
```

### Using the Email Queue

```typescript
import { queueEmail } from '@/lib/email/queue'

// Queue an email for sending with retry logic
const emailId = await queueEmail({
  to: 'user@example.com',
  subject: 'Your Demo is Scheduled',
  react: DemoScheduledEmail({ /* props */ })
})

// Check email status
const status = getEmailStatus(emailId)
```

## Email Templates

### Available Templates

1. **ContactEmail** - Internal notification for contact form submissions
2. **DemoScheduledEmail** - Demo confirmation sent to users
3. **WelcomeEmail** - Welcome email for new subscribers/contacts

### Creating New Templates

1. Create a new file in `/lib/email/templates/`
2. Use React Email components:

```typescript
import { Html, Head, Body, Container, Text, Button } from '@react-email/components'

export const MyTemplate = ({ name }: { name: string }) => (
  <Html>
    <Head />
    <Body>
      <Container>
        <Text>Hello {name}!</Text>
        <Button href="https://hodos360.com">Visit HODOS 360</Button>
      </Container>
    </Body>
  </Html>
)
```

## Email Queue Configuration

The email queue can be configured with these options:

```typescript
const queue = getEmailQueue({
  maxRetries: 3,          // Maximum retry attempts
  retryDelay: 1000,       // Base delay in ms
  retryBackoff: 2,        // Exponential backoff multiplier
  batchSize: 10,          // Emails to process per batch
  processInterval: 5000   // Queue processing interval
})
```

## API Endpoints

### POST /api/contact
Handles contact form submissions:
- Sends internal notification to sales team
- Sends welcome email to user
- Validates and sanitizes input

### POST /api/demo
Handles demo requests:
- Schedules demo slot
- Sends confirmation to user
- Notifies sales team

### POST /api/newsletter
Handles newsletter subscriptions:
- Adds to mailing list
- Sends welcome email
- Handles duplicate subscriptions

## Error Handling

All endpoints include:
- Input validation
- Email format validation
- Content sanitization
- Error notifications to tech team
- User-friendly error messages

## Production Considerations

1. **Rate Limiting**: Implement rate limiting on API endpoints
2. **Authentication**: Add authentication for sensitive operations
3. **Monitoring**: Set up monitoring for email delivery rates
4. **Analytics**: Track email opens, clicks, and conversions
5. **Compliance**: Ensure GDPR/CAN-SPAM compliance

## Testing

Test emails locally using the Resend test API key or preview templates:

```bash
# Preview email templates
npm run email:dev

# Send test emails
npm run email:test
```

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check Resend API key and domain verification
2. **Queue not processing**: Ensure Node.js process stays alive
3. **Templates not rendering**: Check React Email component imports

### Debug Mode

Enable debug logging:
```typescript
process.env.EMAIL_DEBUG = 'true'
```

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)
- [Email Best Practices](https://resend.com/docs/best-practices)
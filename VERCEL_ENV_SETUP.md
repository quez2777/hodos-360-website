# Vercel Environment Variables Setup

## Required Environment Variables for Deployment

Add these environment variables in your Vercel project settings:

### Database (Required)
```
DATABASE_URL=your_postgres_connection_string
```

### Authentication (Required)
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
```

### Optional Services (Can be added later)

#### Stripe (for payments)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Email Services
```
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@yourdomain.com
```

#### Sentry (for error tracking)
```
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_auth_token
```

#### OpenAI (for AI features)
```
OPENAI_API_KEY=sk-...
```

## Setup Steps

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the required variables above
4. For `NEXTAUTH_SECRET`, generate with:
   ```bash
   openssl rand -base64 32
   ```
5. Deploy will automatically trigger when variables are added

## Notes

- The build will complete even without optional services
- Stripe, email, and AI features will only work when their respective keys are added
- Database connection is required for full functionality
- Use PostgreSQL (Supabase, Neon, or any PostgreSQL provider)
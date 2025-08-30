# HODOS 360 Production Deployment Checklist

<metadata>
purpose: Complete production deployment checklist for HODOS 360
type: deployment-guide
dependencies: [Vercel, Supabase, GHL, Stripe, SendGrid, Google OAuth, GitHub OAuth, AWS S3]
last-updated: 2025-01-29
</metadata>

<overview>
Comprehensive step-by-step checklist for deploying HODOS 360 to production with all services, integrations, and configurations properly set up and verified.
</overview>

## 🎯 Pre-Deployment Overview

**Estimated Time**: 4-6 hours for complete setup
**Skills Required**: Basic command line, API configuration, DNS management
**Cost**: ~$200-500/month depending on usage and services chosen

---

## 📋 1. SERVICE SETUP CHECKLIST

### 1.1 Database Setup
- [ ] **Supabase Account Created**
  - Go to https://supabase.com
  - Create new organization: "HODOS 360 LLC"
  - Create project: "hodos-360-production"
  - Note: Project URL and anon key
  - Enable Row Level Security (RLS)

- [ ] **Alternative: Neon Database**
  - Go to https://neon.tech
  - Create account with business email
  - Create database: "hodos_360_prod"
  - Copy connection string
  - Enable connection pooling

- [ ] **Database Connection Verified**
  ```bash
  # Test connection locally first
  DATABASE_URL="your_connection_string" npx prisma db push
  ```

### 1.2 Hosting Platform
- [ ] **Vercel Account Created**
  - Sign up at https://vercel.com
  - Connect GitHub account
  - Create team: "HODOS 360"
  - Upgrade to Pro plan ($20/month)
  - Add team members

- [ ] **Repository Connected**
  - Import GitHub repo to Vercel
  - Set build command: `npm run build`
  - Set output directory: `.next`
  - Enable automatic deployments from main branch

### 1.3 Domain & SSL
- [ ] **Domain Purchased**
  - Primary: `hodos360.com`
  - Alternative: `hodos360.ai` or `gethodos.com`
  - Register through Namecheap/GoDaddy
  - Enable domain privacy

- [ ] **DNS Configured**
  - Add Vercel nameservers to domain
  - Configure A/CNAME records
  - Set up www redirect
  - Verify SSL certificate is active

- [ ] **SSL Certificate Active**
  - Automatic through Vercel
  - Verify HTTPS redirect works
  - Check SSL rating at SSLLabs

### 1.4 Email Service
- [ ] **SendGrid Account Created** (Recommended)
  - Sign up at https://sendgrid.com
  - Verify business email domain
  - Create API key with send permissions
  - Set up domain authentication
  - Configure DKIM/SPF records

- [ ] **Alternative: Resend Account**
  - Go to https://resend.com
  - Create account
  - Verify domain ownership
  - Generate API key
  - Test email delivery

### 1.5 Authentication Services
- [ ] **Google OAuth Configured**
  - Go to Google Cloud Console
  - Create new project: "HODOS 360"
  - Enable Google+ API
  - Create OAuth 2.0 credentials
  - Add authorized redirect URIs:
    - `https://yourdomain.com/api/auth/callback/google`
  - Download client ID and secret

- [ ] **GitHub OAuth Configured**
  - Go to GitHub Settings > Developer settings
  - Create new OAuth App
  - Application name: "HODOS 360"
  - Homepage URL: `https://yourdomain.com`
  - Authorization callback URL: 
    - `https://yourdomain.com/api/auth/callback/github`
  - Copy client ID and secret

### 1.6 Analytics & Monitoring
- [ ] **Google Analytics Setup**
  - Create GA4 property
  - Get measurement ID (G-XXXXXXXXXX)
  - Configure conversion goals
  - Set up enhanced ecommerce

- [ ] **Sentry Account Created**
  - Sign up at https://sentry.io
  - Create project: "hodos-360-frontend"
  - Get DSN key
  - Configure error tracking
  - Set up performance monitoring

---

## 🔧 2. GHL (GOHIGHLEVEL) CONFIGURATION

### 2.1 Account Setup
- [ ] **GHL Account Active**
  - Sign up for agency account ($497/month)
  - Verify business information
  - Complete profile setup
  - Add team members

- [ ] **Location Created**
  - Create sub-account: "HODOS 360 Internal"
  - Configure business hours
  - Set timezone: US/Eastern
  - Add business logo and branding

### 2.2 API Configuration
- [ ] **API Key Generated**
  - Go to Settings > API
  - Generate location API key
  - Copy and store securely
  - Set proper permissions
  - Test API connectivity

- [ ] **Webhook Endpoints Configured**
  - Contact webhook: `https://yourdomain.com/api/webhooks/ghl/contact`
  - Opportunity webhook: `https://yourdomain.com/api/webhooks/ghl/opportunity`
  - Calendar webhook: `https://yourdomain.com/api/webhooks/ghl/calendar`
  - Test webhook delivery

### 2.3 Pipeline Configuration
- [ ] **Main Pipeline Created**
  - Stages: New Lead → Qualified → Demo Scheduled → Proposal Sent → Closed Won/Lost
  - Configure stage automation
  - Set up notifications
  - Create custom fields

- [ ] **Marketing Pipeline Created**
  - Stages: Subscriber → Engaged → MQL → Sales Qualified → Customer
  - Set up lead scoring
  - Configure nurture sequences

- [ ] **Video Agents Pipeline Created**  
  - Stages: Interest → Demo → Trial → Implementation → Active
  - Set up trial tracking
  - Configure success metrics

### 2.4 Calendar Setup
- [ ] **Demo Calendar Created**
  - Name: "HODOS Product Demo"
  - Duration: 30 minutes
  - Buffer time: 15 minutes
  - Availability: Business hours
  - Connect team member calendars

- [ ] **Consultation Calendar Created**
  - Name: "Strategy Consultation"
  - Duration: 60 minutes
  - Qualification questions added
  - Follow-up automation configured

- [ ] **Support Calendar Created**
  - Name: "Technical Support"
  - Duration: 30 minutes
  - Internal team assignment
  - Priority handling rules

### 2.5 Campaign Automation
- [ ] **Welcome Campaign Built**
  - Trigger: New contact created
  - Email sequence: 5 emails over 2 weeks
  - SMS sequence: 3 messages
  - Include product introductions

- [ ] **Nurture Campaign Built**
  - Trigger: Downloaded resources
  - Educational content series
  - Case studies and testimonials
  - Demo booking prompts

- [ ] **Demo Follow-up Campaign**
  - Trigger: Demo completed
  - Proposal delivery automation
  - Follow-up reminders
  - Win/loss surveys

---

## 💳 3. STRIPE PAYMENT SETUP

### 3.1 Account Configuration
- [ ] **Stripe Account Created**
  - Business account for "HODOS 360 LLC"
  - Complete business verification
  - Add bank account details
  - Enable live payments

- [ ] **Tax Settings Configured**
  - Set up tax collection
  - Configure tax rates by location
  - Enable automatic tax calculation
  - Set up tax reporting

### 3.2 Product Setup
- [ ] **HODOS Core Product Created**
  - Name: "HODOS - AI Law Firm Management"
  - Pricing tiers:
    - Starter: $297/month
    - Professional: $597/month  
    - Enterprise: $1,197/month
  - Feature descriptions added
  - Trial period: 14 days

- [ ] **Marketing Platform Product Created**
  - Name: "HODOS Marketing Platform"
  - Pricing: $497/month
  - Add-on for existing customers: $397/month
  - SEO and PPC features included

- [ ] **Video Agents Product Created**
  - Name: "HODOS VIDEO Agents"
  - Pricing tiers:
    - Reception: $197/month
    - Intake: $297/month
    - Sales: $397/month
    - Complete Suite: $697/month

### 3.3 Integration Setup
- [ ] **Webhook Endpoint Added**
  - URL: `https://yourdomain.com/api/webhooks/stripe`
  - Events: customer.subscription.created, invoice.payment_succeeded, etc.
  - Test webhook delivery
  - Configure retry logic

- [ ] **Payment Methods Enabled**
  - Credit/debit cards
  - ACH payments (for US)
  - Digital wallets (Apple Pay, Google Pay)
  - International payment methods

### 3.4 Security & Compliance
- [ ] **PCI Compliance Verified**
  - Use Stripe Elements for card collection
  - Never store card details locally
  - Implement 3D Secure authentication
  - Regular security audits

---

## 🔐 4. ENVIRONMENT VARIABLES

### 4.1 Required Production Variables
Copy this template to Vercel environment variables:

```bash
# === DATABASE ===
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host:port/database?sslmode=require"

# === AUTHENTICATION ===
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate_secure_random_string_32_chars_minimum"
AUTH_GOOGLE_ID="your_google_oauth_client_id"
AUTH_GOOGLE_SECRET="your_google_oauth_client_secret"
AUTH_GITHUB_ID="your_github_oauth_client_id"
AUTH_GITHUB_SECRET="your_github_oauth_client_secret"

# === EMAIL SERVICE ===
SENDGRID_API_KEY="SG.your_sendgrid_api_key_here"
# OR for Resend:
RESEND_API_KEY="re_your_resend_api_key_here"
EMAIL_FROM="HODOS 360 <noreply@yourdomain.com>"
EMAIL_REPLY_TO="support@yourdomain.com"

# === NOTIFICATION EMAILS ===
CONTACT_NOTIFICATION_EMAIL="sales@yourdomain.com"
DEMO_NOTIFICATION_EMAIL="demos@yourdomain.com"
NEWSLETTER_NOTIFICATION_EMAIL="marketing@yourdomain.com"
ERROR_NOTIFICATION_EMAIL="tech@yourdomain.com"

# === GHL INTEGRATION ===
GHL_API_KEY="your_ghl_location_api_key"
GHL_LOCATION_ID="your_ghl_location_id"
GHL_WEBHOOK_SECRET="your_webhook_secret_for_verification"

# === STRIPE PAYMENTS ===
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# === AWS S3 STORAGE ===
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_S3_BUCKET_NAME="hodos-360-production-files"

# === AI SERVICES ===
OPENAI_API_KEY="sk-your_openai_api_key_here"
OPENAI_ORG_ID="org-your_organization_id"

# === ANALYTICS & MONITORING ===
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
SENTRY_DSN="https://your_sentry_dsn_here@sentry.io/project_id"
SENTRY_AUTH_TOKEN="your_sentry_auth_token"

# === SECURITY ===
DOCUMENT_ENCRYPTION_KEY="your_32_character_encryption_key_here"
VIRUSTOTAL_API_KEY="your_virustotal_api_key_optional"
RATE_LIMIT_SECRET="your_rate_limiting_secret_key"

# === APPLICATION ===
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com/api"
```

### 4.2 Environment Variable Security
- [ ] **All secrets generated with high entropy**
  ```bash
  # Generate secure secrets
  openssl rand -hex 32
  ```
- [ ] **No hardcoded values in code**
- [ ] **Different keys for staging vs production**
- [ ] **Regular key rotation scheduled**
- [ ] **Access logging enabled**

---

## 🚀 5. DEPLOYMENT COMMANDS

### 5.1 Local Testing
```bash
# Install dependencies
npm ci

# Generate database client
npx prisma generate

# Set up environment
cp .env.example .env.local
# Fill in your local test values

# Run database migrations
npx prisma db push

# Seed initial data
npm run db:seed

# Run tests
npm test

# Start development server
npm run dev

# Test production build locally
npm run build
npm run start
```

### 5.2 Pre-Deployment Validation
```bash
# Run comprehensive checks
npm run predeploy

# Type checking
npm run type-check

# Code quality checks
npm run lint

# Bundle analysis
npm run analyze

# Test API endpoints
npm run test:apis

# Email system test
npm run email:test
```

### 5.3 Staging Deployment
```bash
# Deploy to staging environment
npm run deploy:staging

# Verify staging deployment
npm run deploy:check

# Run integration tests against staging
npm run test:integration:staging
```

### 5.4 Production Deployment
```bash
# Final pre-production checks
npm run predeploy

# Deploy to production
npm run deploy

# Post-deployment verification
npm run postdeploy

# Monitor for 15 minutes
npm run monitor:production
```

### 5.5 Database Migration Commands
```bash
# Generate migration for schema changes
npx prisma migrate dev --name add_new_feature

# Apply migrations to production
npx prisma migrate deploy

# Reset database (DANGER - only in emergency)
npx prisma migrate reset --force

# Backup before major changes
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## ✅ 6. POST-DEPLOYMENT VERIFICATION

### 6.1 Automated Checks
- [ ] **Health Endpoints Responding**
  - GET `/api/health` returns 200
  - Database connectivity verified
  - All integrations responding

- [ ] **Authentication Working**
  - Google OAuth flow complete
  - GitHub OAuth flow complete
  - Session management working
  - Logout functionality working

- [ ] **Email System Functional**
  - Test contact form submission
  - Verify demo booking emails
  - Newsletter signup working
  - Error notifications sending

### 6.2 Integration Verification
- [ ] **GHL Integration Active**
  - Contact sync working
  - Pipeline updates triggering
  - Calendar bookings syncing
  - Webhooks receiving data

- [ ] **Stripe Payments Working**
  - Test subscription creation
  - Webhook events processing
  - Invoice generation working
  - Cancellation flow tested

- [ ] **Analytics Tracking**
  - Google Analytics reporting data
  - Conversion goals tracking
  - User behavior recording
  - Error tracking active

### 6.3 Performance Validation
- [ ] **Speed Tests Passed**
  - Lighthouse score > 90
  - First Contentful Paint < 2s
  - Time to Interactive < 3s
  - Cumulative Layout Shift < 0.1

- [ ] **Load Testing Completed**
  - 100 concurrent users handled
  - API response times < 500ms
  - Database queries optimized
  - CDN serving static assets

### 6.4 Security Verification
- [ ] **SSL Configuration**
  - HTTPS enforced globally
  - Security headers present
  - SSL Labs rating A+
  - Mixed content warnings resolved

- [ ] **API Security Active**
  - Rate limiting working
  - Authentication required
  - Input validation active
  - CORS properly configured

---

## 🔍 7. MONITORING & ALERTS

### 7.1 Error Tracking
- [ ] **Sentry Configured**
  - Frontend errors capturing
  - API errors capturing  
  - Performance monitoring active
  - Release tracking enabled

- [ ] **Log Aggregation**
  - Vercel logs accessible
  - Database slow queries logged
  - Security events tracked
  - Business metrics recorded

### 7.2 Uptime Monitoring
- [ ] **Status Page Created**
  - Public status page live
  - Component status tracking
  - Incident communication plan
  - Historical uptime data

- [ ] **Alert Configuration**
  - Email alerts for downtime
  - Slack integration for critical errors
  - SMS alerts for billing issues
  - Weekly performance reports

### 7.3 Business Metrics
- [ ] **Conversion Tracking**
  - Demo booking conversions
  - Trial-to-paid conversions
  - Customer lifetime value
  - Churn rate monitoring

---

## 🆘 8. TROUBLESHOOTING GUIDE

### 8.1 Common Issues

**Build Failures**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm ci
npm run build
```

**Database Connection Issues**
```bash
# Test database connection
npx prisma db pull
npx prisma generate
```

**Environment Variable Problems**
```bash
# Verify environment variables
vercel env ls
vercel env pull .env.local
```

### 8.2 Emergency Procedures

**Site Down Emergency**
1. Check Vercel status page
2. Verify DNS resolution
3. Check database connectivity
4. Review recent deployments
5. Rollback if necessary

**Payment Processing Issues**
1. Check Stripe dashboard
2. Verify webhook endpoints
3. Review error logs
4. Test with small amount
5. Contact Stripe support if needed

**Email Delivery Problems**
1. Check SendGrid/Resend status
2. Verify domain authentication
3. Review bounce rates
4. Check spam folder
5. Test with different providers

---

## 📞 9. SUPPORT CONTACTS

### 9.1 Technical Support
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support  
- **Stripe Support**: https://support.stripe.com
- **SendGrid Support**: https://support.sendgrid.com

### 9.2 Emergency Contacts
- **Technical Lead**: [Your Email]
- **Business Owner**: [Business Email]
- **Hosting Provider**: Vercel Emergency Line
- **Payment Processor**: Stripe Emergency Contact

---

## ✅ 10. FINAL DEPLOYMENT APPROVAL

### 10.1 Business Approval
- [ ] **Legal Review Complete**
  - Privacy policy updated
  - Terms of service current
  - GDPR compliance verified
  - Accessibility standards met

- [ ] **Marketing Approval**
  - Content reviewed and approved
  - Brand guidelines followed
  - SEO optimization complete
  - Social media links verified

### 10.2 Technical Sign-off
- [ ] **Performance Standards Met**
- [ ] **Security Requirements Satisfied**
- [ ] **Monitoring & Alerts Active**
- [ ] **Backup & Recovery Tested**
- [ ] **Documentation Updated**

### 10.3 Go-Live Checklist
- [ ] **DNS propagation complete** (24-48 hours)
- [ ] **SSL certificate active and validated**
- [ ] **All integrations tested end-to-end**
- [ ] **Team trained on new systems**
- [ ] **Support documentation distributed**
- [ ] **Launch announcement prepared**

---

**🎉 DEPLOYMENT COMPLETE!**

**Next Steps:**
1. Monitor performance for first 24 hours
2. Schedule weekly health checks
3. Plan monthly optimization reviews
4. Document lessons learned
5. Prepare for scaling as business grows

---

*Last Updated: January 29, 2025*
*Version: 1.0*
*Contact: [your-tech-team@hodos360.com]*
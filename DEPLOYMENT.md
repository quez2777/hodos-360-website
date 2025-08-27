# HODOS 360 Deployment Guide

This guide covers deploying the HODOS 360 website to Vercel with all necessary configurations and validations.

## Prerequisites

### Required Tools
- Node.js 18+ 
- npm or yarn
- Vercel CLI (`npm i -g vercel`)
- Git

### Required Services
- Vercel account
- PostgreSQL database (recommended: Vercel Postgres, Supabase, or PlanetScale)
- Email service (Resend recommended)
- AWS S3 bucket (for file uploads)

## Environment Variables

### Required Variables
Create these in your Vercel project settings or `.env.production`:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-super-secure-random-string-32-chars-min"

# Application
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Recommended Variables
```bash
# Email Service (Resend)
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="HODOS 360 <hello@hodos360.com>"
EMAIL_REPLY_TO="support@hodos360.com"

# Notification Recipients
CONTACT_NOTIFICATION_EMAIL="sales@hodos360.com"
DEMO_NOTIFICATION_EMAIL="sales@hodos360.com"
NEWSLETTER_NOTIFICATION_EMAIL="marketing@hodos360.com"

# File Storage (AWS S3)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET_NAME="your-bucket-name"

# AI Services (OpenAI)
OPENAI_API_KEY="sk-your-openai-key"

# Security (Optional but recommended)
DOCUMENT_ENCRYPTION_KEY="your-encryption-key-32-chars"
VIRUSTOTAL_API_KEY="your-virustotal-key"
```

## Deployment Process

### Option 1: Automated Deployment (Recommended)

1. **Setup Vercel CLI**
   ```bash
   npx vercel login
   ```

2. **Deploy to Staging**
   ```bash
   npm run deploy:staging
   ```

3. **Deploy to Production**
   ```bash
   npm run deploy
   ```

### Option 2: Manual Deployment

1. **Pre-deployment Validation**
   ```bash
   npm run predeploy
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Post-deployment Verification**
   ```bash
   npm run deploy:check
   ```

### Option 3: GitHub Integration

1. **Connect Repository**
   - Go to Vercel dashboard
   - Import your GitHub repository
   - Configure environment variables
   - Enable automatic deployments

2. **Configure Build Settings**
   - Build Command: `npm run vercel:build`
   - Output Directory: `.next`
   - Install Command: `npm run vercel:install`

## Database Setup

### Using Vercel Postgres (Recommended)

1. **Create Database**
   ```bash
   vercel postgres create hodos-360-db
   ```

2. **Get Connection String**
   ```bash
   vercel env pull .env.production
   ```

3. **Run Migrations**
   ```bash
   npx prisma db push
   ```

### Using External Database

1. **Setup your PostgreSQL instance**
2. **Configure DATABASE_URL** in environment variables
3. **Run database migrations**:
   ```bash
   npx prisma generate
   npx prisma db push

# Build for production
npm run build

# Run production build locally
npm run start
```

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
Create a `.env.local` file based on `.env.example`:

```env
# Required for analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional - Add as needed
SENDGRID_API_KEY=your_key_here
DATABASE_URL=your_database_url
```

### 2. Update Site Configuration
- [ ] Update `COMPANY` object in `/lib/constants.ts` with real company info
- [ ] Replace placeholder social media links
- [ ] Update meta descriptions for SEO
- [ ] Add real team member photos in `/public/images/team/`
- [ ] Update testimonials with real client feedback

### 3. API Integration
Current API routes are placeholders. Connect to real services:
- `/api/contact` - Connect to CRM/Email service
- `/api/newsletter` - Connect to Mailchimp/SendGrid
- `/api/demo` - Connect to Calendly/Calendar API

## 🌐 Deployment Options

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
# Using Vercel CLI
npm i -g vercel
vercel
```

### Netlify
1. Push code to GitHub
2. Create new site from Git
3. Build command: `npm run build`
4. Publish directory: `.next`

### Self-Hosted
```bash
# Build the application
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start npm --name "hodos-360" -- start
```

## 🔒 Security Considerations

1. **API Keys**: Never commit `.env.local` to git
2. **CORS**: Configure allowed origins for API routes
3. **Rate Limiting**: Implement for form submissions
4. **Input Validation**: Already implemented with Zod
5. **SSL**: Ensure HTTPS is enabled on production

## 📊 Post-Deployment

### 1. Analytics Setup
- Verify Google Analytics is tracking
- Set up conversion goals
- Configure event tracking

### 2. Performance Monitoring
- Enable Vercel Analytics
- Set up error tracking (Sentry)
- Monitor Core Web Vitals

### 3. SEO Verification
- Submit sitemap to Google Search Console
- Verify meta tags are rendering
- Test structured data

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### TypeScript Errors
```bash
# Check for type errors
npm run type-check
```

### Missing Dependencies
```bash
# Audit and fix dependencies
npm audit fix
```

## 📱 Mobile App Considerations

The website is fully responsive and can be:
- Added to home screen (PWA-ready)
- Wrapped in a WebView for app stores
- Used as the marketing site for native apps

## 🔄 Continuous Deployment

### GitHub Actions Example
Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test
      # Add deployment step
```

## 📞 Support

For deployment issues:
- Check Next.js docs: https://nextjs.org/docs/deployment
- Vercel support: https://vercel.com/support
- Create an issue: https://github.com/hodos360/website/issues

---

Last updated: January 2025
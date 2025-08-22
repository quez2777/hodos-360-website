# HODOS 360 Website - Deployment Guide

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

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
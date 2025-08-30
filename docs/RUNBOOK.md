# HODOS 360 Production Runbook

## 🚨 Emergency Contacts & Escalation

### Primary Contacts
- **Lead Developer**: [Your Name] - [Phone] - [Email]
- **DevOps Engineer**: [DevOps Contact] - [Phone] - [Email]
- **Product Manager**: [PM Contact] - [Phone] - [Email]

### Escalation Matrix
1. **Level 1** (0-15 mins): Primary on-call developer
2. **Level 2** (15-30 mins): Senior developer + DevOps
3. **Level 3** (30+ mins): Technical lead + Management

### External Support
- **Vercel Support**: support@vercel.com (Platform issues)
- **Supabase Support**: support@supabase.com (Database issues)
- **OpenAI Support**: help@openai.com (AI service issues)

---

## 📊 Monitoring & Alerting

### Primary Monitoring Dashboard
- **URL**: [Your monitoring dashboard URL]
- **Login**: Use company SSO
- **Key Metrics**: Response time, error rate, uptime, conversion rate

### Health Check Endpoints
```bash
# Basic health check
curl https://hodos360.com/api/health

# Detailed health check
curl https://hodos360.com/api/health/detailed

# Specific service status
curl -X POST https://hodos360.com/api/health/detailed \
  -H "Content-Type: application/json" \
  -d '{"action": "force-check"}'
```

### Monitoring Scripts
```bash
# Start continuous monitoring
tsx scripts/monitor-production.ts https://hodos360.com

# Run production tests
tsx scripts/test-production.ts https://hodos360.com

# Post-deployment verification
tsx scripts/post-deploy-verify.ts https://hodos360.com
```

### Alert Thresholds
- **Response Time**: >3 seconds (Warning), >5 seconds (Critical)
- **Error Rate**: >5% (Warning), >10% (Critical)
- **Uptime**: <99% (Warning), <95% (Critical)
- **Database**: Query time >1s (Warning), Connection failure (Critical)

---

## 🔥 Common Issues & Quick Fixes

### 1. Site is Down (HTTP 5xx)

**Symptoms**: Users cannot access the website, health checks failing

**Quick Diagnosis**:
```bash
# Check application status
curl -I https://hodos360.com

# Check health endpoint
curl https://hodos360.com/api/health

# Check Vercel deployment status
vercel ls --prod
```

**Immediate Actions**:
1. Check Vercel deployment status in dashboard
2. Look at recent deployments for potential issues
3. Check database connectivity
4. Review error logs in Vercel/Supabase

**Rollback Procedure**:
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Verify rollback worked
curl https://hodos360.com/api/health
```

### 2. Database Connection Issues

**Symptoms**: Health checks show database down, 500 errors on API endpoints

**Quick Diagnosis**:
```bash
# Check database health
curl https://hodos360.com/api/health/detailed | jq '.services.database'

# Test database connection directly (if possible)
psql $DATABASE_URL -c "SELECT 1;"
```

**Immediate Actions**:
1. Check Supabase dashboard for outages
2. Verify connection string is correct
3. Check connection pool limits
4. Review database resource usage

**Fix Commands**:
```bash
# Restart database connections (if applicable)
# This varies based on your setup

# Check connection pool status
# Monitor active connections in Supabase dashboard
```

### 3. High Response Times

**Symptoms**: Site loads slowly, monitoring shows high response times

**Quick Diagnosis**:
```bash
# Check detailed performance metrics
curl https://hodos360.com/api/health/detailed | jq '.performance'

# Test specific endpoints
time curl https://hodos360.com/api/data/pricing
time curl https://hodos360.com/
```

**Immediate Actions**:
1. Check CDN cache hit rates
2. Review recent code changes
3. Check database query performance
4. Verify third-party service response times

**Optimization Steps**:
1. Clear CDN cache if needed
2. Enable edge caching for static content
3. Optimize database queries
4. Review and optimize images/assets

### 4. API Endpoints Failing

**Symptoms**: Specific API endpoints returning errors, forms not submitting

**Quick Diagnosis**:
```bash
# Test critical endpoints
curl -X POST https://hodos360.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test"}'

curl https://hodos360.com/api/data/pricing
```

**Common Fixes**:
1. **Environment Variables**: Check all required env vars are set
2. **Third-party APIs**: Verify OpenAI, GHL, Stripe API keys
3. **Rate Limits**: Check if hitting API rate limits
4. **Validation**: Review input validation errors

### 5. GHL Integration Issues

**Symptoms**: Lead forms not syncing, webhook failures

**Quick Diagnosis**:
```bash
# Check GHL webhook endpoint
curl -X POST https://hodos360.com/api/integrations/crm \
  -H "Content-Type: application/json" \
  -d '{"type":"test","data":{}}'
```

**Troubleshooting Steps**:
1. Verify GHL webhook URL is correct
2. Check GHL API credentials
3. Review webhook payload format
4. Check GHL account limits

### 6. Stripe Payment Issues

**Symptoms**: Payment processing failures, checkout errors

**Quick Diagnosis**:
```bash
# Test Stripe integration
curl -X POST https://hodos360.com/api/integrations/payment \
  -H "Content-Type: application/json" \
  -d '{"type":"health_check"}'
```

**Common Issues**:
1. **API Keys**: Wrong environment keys (test vs live)
2. **Webhooks**: Webhook endpoint not responding
3. **Account**: Stripe account limits or holds
4. **SSL**: Webhook requires HTTPS

---

## 🛠️ Deployment Procedures

### Pre-Deployment Checklist
```bash
# 1. Run tests locally
npm test
npm run build

# 2. Test production build locally
npm run start

# 3. Run integration tests
tsx scripts/test-apis.ts

# 4. Check environment variables
env | grep -E "(DATABASE_URL|OPENAI_API_KEY|GHL_|STRIPE_)"
```

### Deployment Process
```bash
# 1. Deploy to staging first
vercel --target=staging

# 2. Run post-deployment verification on staging
tsx scripts/post-deploy-verify.ts https://staging.hodos360.com

# 3. If staging passes, deploy to production
vercel --prod

# 4. Run post-deployment verification on production
tsx scripts/post-deploy-verify.ts https://hodos360.com

# 5. Monitor for 15 minutes after deployment
tsx scripts/monitor-production.ts https://hodos360.com
```

### Post-Deployment Monitoring
- Watch error rates for first 15 minutes
- Check conversion funnel metrics
- Verify all forms are working
- Test AI endpoints functionality

---

## 🔒 Security Incident Response

### Suspected Security Breach
1. **Immediate**: Change all API keys and secrets
2. **Document**: Log all suspicious activity
3. **Analyze**: Review access logs and database activity
4. **Notify**: Inform security team and stakeholders

### API Key Compromise
```bash
# 1. Rotate compromised keys immediately
# OpenAI
export OPENAI_API_KEY="new-key"

# GHL
export GHL_API_KEY="new-key"

# Stripe
export STRIPE_SECRET_KEY="new-key"

# 2. Deploy with new keys
vercel --prod

# 3. Verify services work with new keys
tsx scripts/test-production.ts https://hodos360.com
```

### DDoS Attack Response
1. Enable Vercel DDoS protection
2. Implement rate limiting
3. Block suspicious IP ranges
4. Contact Vercel support for additional protection

---

## 📈 Performance Optimization

### Database Query Optimization
```sql
-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, attname, null_frac, avg_width, n_distinct
FROM pg_stats
WHERE tablename = 'your_table';
```

### CDN Cache Optimization
```bash
# Clear Vercel edge cache
curl -X PURGE https://hodos360.com/api/cache

# Check cache status
curl -I https://hodos360.com/ | grep -i cache
```

### Image Optimization
- Use Next.js Image component with optimization
- Implement WebP format where supported
- Compress images before upload
- Use responsive images

---

## 🔧 Maintenance Procedures

### Weekly Maintenance
```bash
# 1. Check system health
tsx scripts/test-production.ts https://hodos360.com

# 2. Review monitoring reports
ls -la monitoring-reports/

# 3. Update dependencies (non-breaking)
npm audit
npm update

# 4. Database maintenance
# Run any cleanup scripts
```

### Monthly Maintenance
```bash
# 1. Full security audit
npm audit --audit-level=moderate

# 2. Performance review
# Analyze monitoring reports
# Check conversion rates
# Review user feedback

# 3. Backup verification
# Ensure database backups are working
# Test restore procedures
```

### Dependency Updates
```bash
# 1. Check for updates
npm outdated

# 2. Update patch versions safely
npm update

# 3. For major updates, test thoroughly
npm install package@latest
npm test
tsx scripts/test-production.ts http://localhost:3000
```

---

## 📊 Key Performance Indicators

### Technical KPIs
- **Uptime**: Target >99.9%
- **Response Time**: Target <2s for 95th percentile
- **Error Rate**: Target <1%
- **Database Query Time**: Target <500ms average

### Business KPIs
- **Conversion Rate**: Contact form submissions
- **Lead Quality**: Form completion rate
- **User Engagement**: Time on site, pages per session
- **SEO Performance**: Organic traffic, search rankings

### Monitoring Commands
```bash
# Check current KPIs
tsx scripts/monitor-production.ts https://hodos360.com

# Generate performance report
tsx scripts/test-production.ts https://hodos360.com

# Business metrics (implement custom script)
# tsx scripts/business-metrics.ts
```

---

## 🚀 Scaling Procedures

### Vertical Scaling (Vercel)
- Upgrade to Vercel Pro/Enterprise
- Increase function memory/timeout limits
- Enable edge regions

### Database Scaling (Supabase)
- Monitor connection pool usage
- Upgrade database tier if needed
- Implement read replicas
- Add database indexes for slow queries

### CDN Optimization
- Enable global edge caching
- Implement ISR (Incremental Static Regeneration)
- Optimize cache headers

---

## 📋 Runbook Maintenance

### Quarterly Reviews
- Update contact information
- Revise procedures based on incidents
- Add new monitoring tools/dashboards
- Update escalation procedures

### After Each Incident
- Document new issues and solutions
- Update troubleshooting procedures
- Revise monitoring thresholds
- Share learnings with team

---

## 📞 Quick Reference Commands

```bash
# Emergency Health Check
curl -f https://hodos360.com/api/health || echo "SITE DOWN!"

# Quick Deployment Status
vercel ls --prod | head -5

# Database Connection Test
curl -s https://hodos360.com/api/health/detailed | jq '.services.database.status'

# Performance Check
time curl -s https://hodos360.com > /dev/null

# Full System Test
tsx scripts/test-production.ts https://hodos360.com

# Start Monitoring
tsx scripts/monitor-production.ts https://hodos360.com 1

# Post-Deploy Verification
tsx scripts/post-deploy-verify.ts https://hodos360.com
```

---

**Last Updated**: [Current Date]  
**Version**: 1.0  
**Next Review**: [Date + 3 months]  

**Remember**: When in doubt, start monitoring and escalate early. It's better to over-communicate during incidents than to work in isolation.
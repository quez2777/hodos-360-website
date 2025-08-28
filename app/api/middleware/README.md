# HODOS 360 API Security Middleware

Comprehensive security middleware suite for the HODOS 360 legal tech platform, implementing enterprise-grade security, authentication, authorization, and compliance features.

## 🛡️ Components Overview

### 1. **Rate Limiting** (`rate-limit.ts`)
- IP-based and user-based rate limiting
- Different limits for different endpoints and user plans
- Redis or in-memory storage options
- Automatic rate limit header injection

### 2. **API Key Authentication** (`api-auth.ts`)
- HMAC-based API key validation
- Multiple permission levels (Read-Only, Standard, Full, Integration, AI Services)
- Automatic key rotation support
- Partner/integration access management

### 3. **RBAC (Role-Based Access Control)** (`rbac.ts`)
- Comprehensive role and permission system
- Firm-level data isolation
- Conditional permissions with dynamic evaluation
- Default roles for legal professionals

### 4. **Security Headers** (`security.ts`)
- CORS configuration with origin validation
- Content Security Policy (CSP) with environment-specific rules
- HSTS, XSS Protection, and other security headers
- Preflight request handling

### 5. **Audit Logging** (`audit.ts`)
- Comprehensive request/response logging
- Compliance-ready (HIPAA, SOC2, PCI)
- Sensitive data sanitization
- Multiple storage backends (Database, File, External)

## 🚀 Quick Start

### 1. Environment Configuration

Add these variables to your `.env.local`:

```bash
# Security
API_KEY_SECRET=your-super-secret-key-here
INTERNAL_SERVICE_TOKEN=internal-service-token

# CORS
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Rate Limiting (optional - uses in-memory if not set)
RATE_LIMIT_REDIS_URL=redis://localhost:6379

# Audit Logging
AUDIT_LOG_STORAGE=database
AUDIT_LOG_ENDPOINT=https://your-log-service.com/api/logs
AUDIT_LOG_TOKEN=your-log-service-token

# CSP Reporting (optional)
CSP_REPORT_URI=https://yourdomain.com/api/csp-report
```

### 2. Integration with Next.js

Update your main `middleware.ts` file:

```typescript
import { middleware as securityMiddleware } from './app/api/middleware'

export default securityMiddleware

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
```

### 3. Database Schema

Add audit log table to your database:

```sql
CREATE TABLE audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  request_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  firm_id VARCHAR(255),
  api_key_id VARCHAR(255),
  ip VARCHAR(45) NOT NULL,
  user_agent TEXT,
  method VARCHAR(10) NOT NULL,
  path VARCHAR(500) NOT NULL,
  query JSON,
  body JSON,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  error TEXT,
  metadata JSON,
  INDEX idx_user_id (user_id),
  INDEX idx_firm_id (firm_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_path (path)
);
```

## 📋 Usage Examples

### Custom Rate Limits

```typescript
import { rateLimitMiddleware } from './app/api/middleware/rate-limit'

// Custom rate limit for specific endpoint
const customRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: false
}
```

### API Key Generation

```typescript
import { ApiKeyUtils } from './app/api/middleware/api-auth'

// Create API key for a firm
const { keyId, secretKey } = await ApiKeyUtils.createApiKey(
  'firm_123',
  'Integration Key',
  [
    { resource: 'cases', action: 'read' },
    { resource: 'documents', action: 'write' }
  ],
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Expires in 1 year
)
```

### Custom RBAC Roles

```typescript
import { RoleUtils } from './app/api/middleware/rbac'

// Create custom role
const customRole = RoleUtils.createCustomRole(
  'firm_123',
  'Senior Paralegal',
  'Enhanced paralegal with case management access',
  [
    { resource: 'cases', action: 'write' },
    { resource: 'clients', action: 'read' },
    { resource: 'documents', action: 'write' },
    { resource: 'billing', action: 'read' }
  ]
)
```

### Audit Event Logging

```typescript
import { AuditUtils } from './app/api/middleware/audit'

// Log specific user action
await AuditUtils.logUserAction(
  'case_created',
  user,
  'cases',
  'case_123',
  { caseType: 'personal_injury', priority: 'high' }
)

// Log data export for compliance
await AuditUtils.logDataExport(
  user,
  'client_data',
  150,
  'CSV'
)
```

## 🔧 Configuration Options

### Rate Limiting Tiers

| Plan | Requests/Minute | AI Requests/Minute |
|------|-----------------|-------------------|
| Trial | 50 | 5 |
| Starter | 100 | 10 |
| Professional | 200 | 20 |
| Enterprise | 500 | 50 |

### Default Roles & Permissions

- **Firm Admin**: Full access to all firm resources
- **Attorney**: Case and client management, limited billing access
- **Paralegal**: Case support, document management
- **Legal Assistant**: Administrative tasks, communication
- **Billing Clerk**: Financial operations, billing reports
- **Client Portal**: Limited access to own cases and documents
- **Read Only**: View-only access for auditors/observers

### Security Headers

**Production CSP Policy:**
```
default-src 'self';
script-src 'self' https://cdn.jsdelivr.net https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: https:;
connect-src 'self' https://api.openai.com https://your-supabase-url.supabase.co;
```

## 📊 Monitoring & Analytics

### Audit Report Generation

```typescript
import { AuditReportGenerator } from './app/api/middleware/audit'

const reportGenerator = new AuditReportGenerator()

// Generate security summary
const report = await reportGenerator.generateSecuritySummary(
  'firm_123',
  new Date('2024-01-01'),
  new Date('2024-12-31')
)
```

### Rate Limit Monitoring

Monitor rate limit usage through logs and metrics:

```typescript
// Check rate limit info from headers
const remaining = response.headers.get('X-RateLimit-Remaining')
const resetTime = response.headers.get('X-RateLimit-Reset')
```

## 🔒 Security Best Practices

### 1. API Key Management
- Rotate API keys regularly (recommended: every 90 days)
- Use different keys for different integrations
- Monitor API key usage for anomalies
- Revoke unused or compromised keys immediately

### 2. Rate Limiting Strategy
- Implement progressive rate limits (stricter for unauthenticated requests)
- Use distributed rate limiting in multi-server environments
- Monitor for rate limit abuse patterns
- Implement temporary bans for persistent violators

### 3. Audit Logging
- Log all authentication attempts (success and failure)
- Track sensitive data access and modifications
- Implement log rotation and retention policies
- Regular audit log analysis for security incidents

### 4. RBAC Implementation
- Follow principle of least privilege
- Regular permission audits
- Implement time-limited elevated access
- Monitor for privilege escalation attempts

## 🚨 Troubleshooting

### Common Issues

**Rate Limit Redis Connection:**
```bash
Error: Redis connection failed
Solution: Check RATE_LIMIT_REDIS_URL and Redis server status
```

**CSP Violations:**
```bash
Error: Content Security Policy violation
Solution: Check browser console and update CSP directives
```

**API Key Validation Fails:**
```bash
Error: Invalid API key signature
Solution: Verify API_KEY_SECRET matches key generation secret
```

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=middleware:*
NODE_ENV=development
```

## 📈 Performance Considerations

- **Rate Limiting**: Redis storage recommended for production
- **Audit Logging**: Use external log service for high-volume applications
- **RBAC**: Cache user permissions for frequently accessed resources
- **Security Headers**: Enable CDN caching for static security headers

## 🔄 Updates & Migration

When updating middleware:

1. Test in development environment first
2. Check for breaking changes in configuration
3. Update environment variables as needed
4. Monitor error rates after deployment
5. Roll back if issues persist

## 📚 Additional Resources

- [Next.js Middleware Documentation](https://nextjs.org/docs/advanced-features/middleware)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Legal Industry Compliance Requirements](./compliance-guide.md)

---

**Created for HODOS 360 LLC** - Revolutionizing legal tech with enterprise-grade security.
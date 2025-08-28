import { NextRequest, NextResponse } from 'next/server'
import { 
  AuditLogEntry,
  AuditLogConfig,
  MiddlewareContext,
  MiddlewareResponse,
  AuthenticatedUser
} from './types'

// Default audit configuration
const DEFAULT_AUDIT_CONFIG: AuditLogConfig = {
  enabled: true,
  logRequests: true,
  logResponses: false, // Can be expensive, enable selectively
  logErrors: true,
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'ssn',
    'credit_card',
    'bank_account',
    'api_key'
  ],
  maxBodySize: 10000, // 10KB max body logging
  storage: process.env.AUDIT_LOG_STORAGE as 'database' | 'file' | 'external' || 'database',
  externalEndpoint: process.env.AUDIT_LOG_ENDPOINT
}

// Compliance standards requirements
const COMPLIANCE_REQUIREMENTS = {
  HIPAA: {
    logAccess: true,
    logModifications: true,
    logFailures: true,
    retentionPeriod: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years in ms
    requiredFields: ['userId', 'timestamp', 'action', 'resource', 'outcome']
  },
  SOC2: {
    logAccess: true,
    logModifications: true,
    logAdminActions: true,
    logFailures: true,
    retentionPeriod: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years in ms
    requiredFields: ['userId', 'timestamp', 'action', 'resource', 'ip', 'outcome']
  },
  PCI: {
    logAccess: true,
    logModifications: true,
    logFailures: true,
    logPaymentData: true,
    retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year in ms
    requiredFields: ['userId', 'timestamp', 'action', 'resource', 'ip', 'outcome']
  }
}

// Audit event types
export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  API_ACCESS = 'API_ACCESS',
  DATA_READ = 'DATA_READ',
  DATA_CREATE = 'DATA_CREATE',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  ADMIN_ACTION = 'ADMIN_ACTION',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  EXPORT_DATA = 'EXPORT_DATA',
  IMPORT_DATA = 'IMPORT_DATA',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

// Data sanitizer for removing sensitive information
class DataSanitizer {
  private sensitiveFields: string[]

  constructor(sensitiveFields: string[]) {
    this.sensitiveFields = sensitiveFields.map(field => field.toLowerCase())
  }

  // Sanitize object by removing or masking sensitive fields
  sanitizeObject(obj: any, maxDepth: number = 5): any {
    if (maxDepth <= 0 || obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, maxDepth - 1))
    }

    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase()
      
      if (this.sensitiveFields.some(field => keyLower.includes(field))) {
        // Mask sensitive fields
        if (typeof value === 'string') {
          sanitized[key] = value.length > 4 
            ? `${value.substring(0, 2)}***${value.substring(value.length - 2)}`
            : '***'
        } else {
          sanitized[key] = '[REDACTED]'
        }
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value, maxDepth - 1)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  // Sanitize request/response body
  sanitizeBody(body: string | any, maxSize: number): any {
    try {
      let parsedBody: any
      
      if (typeof body === 'string') {
        // Truncate if too large
        if (body.length > maxSize) {
          body = body.substring(0, maxSize) + '...[TRUNCATED]'
        }
        
        try {
          parsedBody = JSON.parse(body)
        } catch {
          return body // Return as string if not valid JSON
        }
      } else {
        parsedBody = body
      }
      
      return this.sanitizeObject(parsedBody)
    } catch (error) {
      return '[SANITIZATION_ERROR]'
    }
  }
}

// Audit log storage implementations
abstract class AuditStorage {
  abstract store(entry: AuditLogEntry): Promise<void>
  abstract query(filters: any): Promise<AuditLogEntry[]>
  abstract cleanup(olderThan: Date): Promise<number>
}

class DatabaseAuditStorage extends AuditStorage {
  async store(entry: AuditLogEntry): Promise<void> {
    try {
      // In a real implementation, use your database client (Prisma, etc.)
      console.log('Storing audit log to database:', entry)
      
      // Example with Prisma:
      // await prisma.auditLog.create({ data: entry })
    } catch (error) {
      console.error('Failed to store audit log to database:', error)
      throw error
    }
  }

  async query(filters: any): Promise<AuditLogEntry[]> {
    // Implementation would query database based on filters
    console.log('Querying audit logs from database:', filters)
    return []
  }

  async cleanup(olderThan: Date): Promise<number> {
    // Implementation would delete old audit logs
    console.log('Cleaning up audit logs older than:', olderThan)
    return 0
  }
}

class FileAuditStorage extends AuditStorage {
  private logFile: string

  constructor(logFile: string = './audit.log') {
    super()
    this.logFile = logFile
  }

  async store(entry: AuditLogEntry): Promise<void> {
    try {
      const fs = await import('fs/promises')
      const logLine = JSON.stringify(entry) + '\n'
      await fs.appendFile(this.logFile, logLine)
    } catch (error) {
      console.error('Failed to store audit log to file:', error)
      throw error
    }
  }

  async query(filters: any): Promise<AuditLogEntry[]> {
    try {
      const fs = await import('fs/promises')
      const content = await fs.readFile(this.logFile, 'utf-8')
      const lines = content.split('\n').filter(line => line.trim())
      
      return lines.map(line => {
        try {
          return JSON.parse(line) as AuditLogEntry
        } catch {
          return null
        }
      }).filter(entry => entry !== null) as AuditLogEntry[]
    } catch (error) {
      console.error('Failed to query audit logs from file:', error)
      return []
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    // For file storage, you might implement log rotation
    console.log('File audit storage cleanup not implemented')
    return 0
  }
}

class ExternalAuditStorage extends AuditStorage {
  private endpoint: string

  constructor(endpoint: string) {
    super()
    this.endpoint = endpoint
  }

  async store(entry: AuditLogEntry): Promise<void> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUDIT_LOG_TOKEN}`
        },
        body: JSON.stringify(entry)
      })

      if (!response.ok) {
        throw new Error(`External audit storage failed: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to store audit log externally:', error)
      throw error
    }
  }

  async query(filters: any): Promise<AuditLogEntry[]> {
    try {
      const response = await fetch(`${this.endpoint}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUDIT_LOG_TOKEN}`
        },
        body: JSON.stringify(filters)
      })

      if (!response.ok) {
        throw new Error(`External audit query failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to query audit logs externally:', error)
      return []
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    try {
      const response = await fetch(`${this.endpoint}/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AUDIT_LOG_TOKEN}`
        },
        body: JSON.stringify({ olderThan: olderThan.toISOString() })
      })

      if (!response.ok) {
        throw new Error(`External audit cleanup failed: ${response.statusText}`)
      }

      const result = await response.json()
      return result.deletedCount || 0
    } catch (error) {
      console.error('Failed to cleanup audit logs externally:', error)
      return 0
    }
  }
}

// Main audit logger class
export class AuditLogger {
  private config: AuditLogConfig
  private storage: AuditStorage
  private sanitizer: DataSanitizer

  constructor(config: AuditLogConfig = DEFAULT_AUDIT_CONFIG) {
    this.config = config
    this.sanitizer = new DataSanitizer(config.sensitiveFields)
    
    // Initialize storage based on configuration
    switch (config.storage) {
      case 'file':
        this.storage = new FileAuditStorage()
        break
      case 'external':
        if (!config.externalEndpoint) {
          throw new Error('External endpoint required for external audit storage')
        }
        this.storage = new ExternalAuditStorage(config.externalEndpoint)
        break
      default:
        this.storage = new DatabaseAuditStorage()
    }
  }

  // Create audit log entry
  private createAuditEntry(
    req: NextRequest,
    context: MiddlewareContext,
    eventType: AuditEventType,
    statusCode: number,
    responseTime: number,
    error?: string,
    metadata?: Record<string, any>
  ): AuditLogEntry {
    return {
      id: `audit_${context.requestId}`,
      timestamp: new Date(),
      requestId: context.requestId,
      userId: context.user?.id,
      firmId: context.user?.firmId,
      apiKeyId: context.apiKey?.id,
      ip: context.ip,
      userAgent: context.userAgent,
      method: req.method,
      path: req.nextUrl.pathname,
      query: this.sanitizer.sanitizeObject(
        Object.fromEntries(req.nextUrl.searchParams.entries())
      ),
      body: this.config.logRequests ? 
        this.sanitizer.sanitizeBody(
          req.body || {},
          this.config.maxBodySize
        ) : undefined,
      statusCode,
      responseTime,
      error,
      metadata: metadata ? this.sanitizer.sanitizeObject(metadata) : undefined
    }
  }

  // Log API request
  async logRequest(
    req: NextRequest,
    context: MiddlewareContext,
    statusCode: number,
    responseTime: number,
    error?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) return

    try {
      const eventType = this.determineEventType(req, statusCode, error)
      const entry = this.createAuditEntry(
        req,
        context,
        eventType,
        statusCode,
        responseTime,
        error,
        metadata
      )

      await this.storage.store(entry)
    } catch (auditError) {
      // Never let audit logging break the main application
      console.error('Audit logging failed:', auditError)
    }
  }

  // Determine audit event type based on request
  private determineEventType(req: NextRequest, statusCode: number, error?: string): AuditEventType {
    const path = req.nextUrl.pathname
    const method = req.method

    // Security events
    if (statusCode === 401) return AuditEventType.PERMISSION_DENIED
    if (statusCode === 429) return AuditEventType.RATE_LIMIT_EXCEEDED
    if (statusCode >= 500) return AuditEventType.SYSTEM_ERROR
    if (error) return AuditEventType.SECURITY_VIOLATION

    // Authentication events
    if (path.includes('/auth/login')) {
      return statusCode < 400 ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILURE
    }
    if (path.includes('/auth/logout')) return AuditEventType.LOGOUT

    // Admin events
    if (path.includes('/admin')) return AuditEventType.ADMIN_ACTION

    // Data events
    if (method === 'GET') return AuditEventType.DATA_READ
    if (method === 'POST') return AuditEventType.DATA_CREATE
    if (method === 'PUT' || method === 'PATCH') return AuditEventType.DATA_UPDATE
    if (method === 'DELETE') return AuditEventType.DATA_DELETE

    return AuditEventType.API_ACCESS
  }

  // Log specific security events
  async logSecurityEvent(
    eventType: AuditEventType,
    context: MiddlewareContext,
    details: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) return

    try {
      const entry: AuditLogEntry = {
        id: `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        requestId: context.requestId,
        userId: context.user?.id,
        firmId: context.user?.firmId,
        ip: context.ip,
        userAgent: context.userAgent,
        method: 'SECURITY',
        path: '/security/event',
        statusCode: 0,
        responseTime: 0,
        metadata: {
          eventType,
          ...this.sanitizer.sanitizeObject(details)
        }
      }

      await this.storage.store(entry)
    } catch (auditError) {
      console.error('Security event logging failed:', auditError)
    }
  }

  // Query audit logs
  async queryLogs(filters: {
    userId?: string
    firmId?: string
    startDate?: Date
    endDate?: Date
    eventType?: AuditEventType
    limit?: number
  }): Promise<AuditLogEntry[]> {
    return this.storage.query(filters)
  }

  // Cleanup old logs
  async cleanup(retentionPeriod?: number): Promise<number> {
    const period = retentionPeriod || (365 * 24 * 60 * 60 * 1000) // 1 year default
    const cutoffDate = new Date(Date.now() - period)
    return this.storage.cleanup(cutoffDate)
  }
}

// Global audit logger instance
let auditLoggerInstance: AuditLogger | null = null

function getAuditLogger(): AuditLogger {
  if (!auditLoggerInstance) {
    auditLoggerInstance = new AuditLogger()
  }
  return auditLoggerInstance
}

// Main audit middleware
export async function auditMiddleware(
  req: NextRequest,
  context: MiddlewareContext,
  response?: NextResponse,
  startTime?: number,
  error?: string
): Promise<MiddlewareResponse> {
  try {
    const logger = getAuditLogger()
    
    // Calculate response time
    const responseTime = startTime ? Date.now() - startTime : 0
    const statusCode = response?.status || (error ? 500 : 200)

    // Log the request
    await logger.logRequest(
      req,
      context,
      statusCode,
      responseTime,
      error
    )

    return { success: true }
  } catch (auditError) {
    console.error('Audit middleware error:', auditError)
    // Never fail the request due to audit logging issues
    return { success: true }
  }
}

// Utility functions for specific audit scenarios
export const AuditUtils = {
  // Log user action
  async logUserAction(
    action: string,
    user: AuthenticatedUser,
    resource: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ) {
    const logger = getAuditLogger()
    const context: MiddlewareContext = {
      user,
      requestId: `action_${Date.now()}`,
      timestamp: Date.now(),
      ip: 'internal',
      userAgent: 'system'
    }

    await logger.logSecurityEvent(AuditEventType.API_ACCESS, context, {
      action,
      resource,
      resourceId,
      ...metadata
    })
  },

  // Log data export
  async logDataExport(
    user: AuthenticatedUser,
    dataType: string,
    recordCount: number,
    exportFormat: string
  ) {
    const logger = getAuditLogger()
    const context: MiddlewareContext = {
      user,
      requestId: `export_${Date.now()}`,
      timestamp: Date.now(),
      ip: 'internal',
      userAgent: 'system'
    }

    await logger.logSecurityEvent(AuditEventType.EXPORT_DATA, context, {
      dataType,
      recordCount,
      exportFormat,
      complianceNote: 'Data export tracked for compliance requirements'
    })
  },

  // Log compliance-specific events
  async logComplianceEvent(
    standard: 'HIPAA' | 'SOC2' | 'PCI',
    user: AuthenticatedUser,
    event: string,
    details: Record<string, any>
  ) {
    const logger = getAuditLogger()
    const context: MiddlewareContext = {
      user,
      requestId: `compliance_${Date.now()}`,
      timestamp: Date.now(),
      ip: 'internal',
      userAgent: 'system'
    }

    await logger.logSecurityEvent(AuditEventType.ADMIN_ACTION, context, {
      complianceStandard: standard,
      event,
      ...details
    })
  }
}

// Audit report generator
export class AuditReportGenerator {
  private logger: AuditLogger

  constructor() {
    this.logger = getAuditLogger()
  }

  // Generate security summary report
  async generateSecuritySummary(
    firmId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const logs = await this.logger.queryLogs({
      firmId,
      startDate,
      endDate
    })

    const summary = {
      totalRequests: logs.length,
      successfulRequests: logs.filter(log => log.statusCode < 400).length,
      failedRequests: logs.filter(log => log.statusCode >= 400).length,
      securityViolations: logs.filter(log => 
        log.statusCode === 401 || log.statusCode === 403 || log.statusCode === 429
      ).length,
      topUsers: this.getTopUsers(logs),
      topEndpoints: this.getTopEndpoints(logs),
      errorsByType: this.groupErrorsByType(logs)
    }

    return summary
  }

  private getTopUsers(logs: AuditLogEntry[]): any[] {
    const userCounts: Record<string, number> = {}
    
    logs.forEach(log => {
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1
      }
    })

    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }))
  }

  private getTopEndpoints(logs: AuditLogEntry[]): any[] {
    const endpointCounts: Record<string, number> = {}
    
    logs.forEach(log => {
      const endpoint = `${log.method} ${log.path}`
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1
    })

    return Object.entries(endpointCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))
  }

  private groupErrorsByType(logs: AuditLogEntry[]): any[] {
    const errorCounts: Record<number, number> = {}
    
    logs.filter(log => log.statusCode >= 400).forEach(log => {
      errorCounts[log.statusCode] = (errorCounts[log.statusCode] || 0) + 1
    })

    return Object.entries(errorCounts)
      .map(([statusCode, count]) => ({ statusCode: parseInt(statusCode), count }))
      .sort((a, b) => b.count - a.count)
  }
}


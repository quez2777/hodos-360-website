import { NextRequest, NextResponse } from 'next/server'

// Base middleware types
export interface MiddlewareConfig {
  enabled: boolean
  excludePaths?: string[]
  includePaths?: string[]
}

export interface MiddlewareResponse {
  success: boolean
  error?: string
  data?: any
  statusCode?: number
}

export type MiddlewareHandler = (
  req: NextRequest,
  context?: MiddlewareContext
) => Promise<NextResponse | MiddlewareResponse>

export interface MiddlewareContext {
  user?: AuthenticatedUser
  apiKey?: ApiKeyData
  requestId: string
  timestamp: number
  ip: string
  userAgent: string
}

// Authentication types
export interface AuthenticatedUser {
  id: string
  email: string
  firmId: string
  roles: Role[]
  permissions: Permission[]
  plan: SubscriptionPlan
  isActive: boolean
}

export interface ApiKeyData {
  id: string
  name: string
  firmId: string
  permissions: Permission[]
  rateLimit: RateLimitConfig
  createdAt: Date
  lastUsedAt?: Date
  expiresAt?: Date
}

// Role-based access control types
export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  firmId?: string // null for system roles
}

export interface Permission {
  id: string
  resource: string
  action: string
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  field: string
  operator: 'eq' | 'neq' | 'in' | 'not_in' | 'contains' | 'starts_with'
  value: any
}

export type SubscriptionPlan = 'trial' | 'starter' | 'professional' | 'enterprise'

// Rate limiting types
export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export interface RateLimitStore {
  get(key: string): Promise<number>
  increment(key: string, windowMs: number): Promise<number>
  reset(key: string): Promise<void>
}

// Security headers types
export interface SecurityHeadersConfig {
  cors: CorsConfig
  csp: ContentSecurityPolicyConfig
  hsts: HstsConfig
  xss: boolean
  nosniff: boolean
  frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
}

export interface CorsConfig {
  origin: string[] | string | boolean
  methods: string[]
  allowedHeaders: string[]
  credentials: boolean
  maxAge?: number
  preflightContinue?: boolean
  optionsSuccessStatus?: number
}

export interface ContentSecurityPolicyConfig {
  directives: Record<string, string[] | string>
  reportOnly?: boolean
  reportUri?: string
}

export interface HstsConfig {
  maxAge: number
  includeSubDomains: boolean
  preload: boolean
}

// Audit logging types
export interface AuditLogEntry {
  id: string
  timestamp: Date
  requestId: string
  userId?: string
  firmId?: string
  apiKeyId?: string
  ip: string
  userAgent: string
  method: string
  path: string
  query?: Record<string, any>
  body?: Record<string, any>
  statusCode: number
  responseTime: number
  error?: string
  metadata?: Record<string, any>
}

export interface AuditLogConfig {
  enabled: boolean
  logRequests: boolean
  logResponses: boolean
  logErrors: boolean
  sensitiveFields: string[]
  maxBodySize: number
  storage: 'database' | 'file' | 'external'
  externalEndpoint?: string
}

// Error types
export class MiddlewareError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message)
    this.name = 'MiddlewareError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class RateLimitError extends MiddlewareError {
  public retryAfter: number

  constructor(message: string, retryAfter: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.retryAfter = retryAfter
  }
}

export class AuthenticationError extends MiddlewareError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_FAILED')
  }
}

export class AuthorizationError extends MiddlewareError {
  constructor(message: string) {
    super(message, 403, 'AUTHORIZATION_FAILED')
  }
}

// Utility types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD'

export interface RequestMetadata {
  requestId: string
  timestamp: number
  ip: string
  userAgent: string
  method: HttpMethod
  path: string
  query: Record<string, string | string[]>
  headers: Record<string, string>
}

// Configuration validation
export interface MiddlewareConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Environment configuration
export interface SecurityEnvironment {
  NODE_ENV: 'development' | 'production' | 'test'
  RATE_LIMIT_REDIS_URL?: string
  API_KEY_SECRET: string
  AUDIT_LOG_ENDPOINT?: string
  CORS_ORIGINS: string
  CSP_REPORT_URI?: string
}
import { NextRequest } from 'next/server'
import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { 
  ApiKeyData, 
  AuthenticationError, 
  MiddlewareContext, 
  MiddlewareResponse,
  Permission,
  RateLimitConfig 
} from './types'

// API Key validation and management
export class ApiKeyManager {
  private secretKey: string

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.API_KEY_SECRET || 'default-secret'
    
    if (this.secretKey === 'default-secret' && process.env.NODE_ENV === 'production') {
      throw new Error('API_KEY_SECRET must be set in production')
    }
  }

  // Generate a new API key
  generateApiKey(firmId: string, name: string): { keyId: string; secretKey: string } {
    const keyId = `hodos_${randomBytes(16).toString('hex')}`
    const secretKey = randomBytes(32).toString('hex')
    
    return { keyId, secretKey }
  }

  // Create HMAC signature for API key
  private createSignature(keyId: string, timestamp: string, secretKey: string): string {
    const payload = `${keyId}.${timestamp}`
    return createHmac('sha256', secretKey).update(payload).digest('hex')
  }

  // Verify API key signature
  private verifySignature(
    keyId: string, 
    timestamp: string, 
    signature: string, 
    secretKey: string
  ): boolean {
    const expectedSignature = this.createSignature(keyId, timestamp, secretKey)
    
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // Validate API key format
  validateApiKeyFormat(apiKey: string): { keyId: string; timestamp: string; signature: string } | null {
    // Expected format: keyId.timestamp.signature
    const parts = apiKey.split('.')
    
    if (parts.length !== 3) {
      return null
    }
    
    const [keyId, timestamp, signature] = parts
    
    // Validate keyId format
    if (!keyId.startsWith('hodos_') || keyId.length !== 38) {
      return null
    }
    
    // Validate timestamp (must be within last 5 minutes)
    const timestampNum = parseInt(timestamp, 10)
    if (isNaN(timestampNum)) {
      return null
    }
    
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    
    if (timestampNum < fiveMinutesAgo || timestampNum > now + 60000) {
      return null
    }
    
    // Validate signature format (64 hex characters)
    if (!/^[a-f0-9]{64}$/.test(signature)) {
      return null
    }
    
    return { keyId, timestamp, signature }
  }

  // Mock database operations (replace with actual database calls)
  private async getApiKeyFromDatabase(keyId: string): Promise<ApiKeyData | null> {
    // In a real implementation, this would query your database
    // For now, returning mock data for demonstration
    
    const mockApiKeys: Record<string, ApiKeyData> = {
      'hodos_dev_key_123': {
        id: 'hodos_dev_key_123',
        name: 'Development Key',
        firmId: 'firm_123',
        permissions: [
          { id: 'p1', resource: 'cases', action: 'read', conditions: [] },
          { id: 'p2', resource: 'documents', action: 'write', conditions: [] }
        ],
        rateLimit: {
          windowMs: 60 * 1000,
          max: 100
        },
        createdAt: new Date('2024-01-01'),
        lastUsedAt: new Date(),
        expiresAt: new Date('2025-01-01')
      }
    }
    
    return mockApiKeys[keyId] || null
  }

  private async updateLastUsed(keyId: string): Promise<void> {
    // Update lastUsedAt timestamp in database
    console.log(`Updated last used timestamp for API key: ${keyId}`)
  }

  // Main API key validation method
  async validateApiKey(apiKey: string): Promise<ApiKeyData> {
    // Parse API key
    const parsedKey = this.validateApiKeyFormat(apiKey)
    if (!parsedKey) {
      throw new AuthenticationError('Invalid API key format')
    }
    
    const { keyId, timestamp, signature } = parsedKey
    
    // Get API key data from database
    const apiKeyData = await this.getApiKeyFromDatabase(keyId)
    if (!apiKeyData) {
      throw new AuthenticationError('API key not found')
    }
    
    // Check if key is expired
    if (apiKeyData.expiresAt && apiKeyData.expiresAt < new Date()) {
      throw new AuthenticationError('API key expired')
    }
    
    // Get the secret key from secure storage (in production, this would come from the database)
    const secretKey = process.env[`API_KEY_SECRET_${keyId}`] || 'mock-secret-key'
    
    // Verify signature
    if (!this.verifySignature(keyId, timestamp, signature, secretKey)) {
      throw new AuthenticationError('Invalid API key signature')
    }
    
    // Update last used timestamp
    await this.updateLastUsed(keyId)
    
    return apiKeyData
  }
}

// API Key permission levels
export const API_KEY_PERMISSIONS = {
  // Read-only access
  READ_ONLY: [
    { resource: 'cases', action: 'read' },
    { resource: 'clients', action: 'read' },
    { resource: 'documents', action: 'read' }
  ],
  
  // Standard API access
  STANDARD: [
    { resource: 'cases', action: 'read' },
    { resource: 'cases', action: 'write' },
    { resource: 'clients', action: 'read' },
    { resource: 'clients', action: 'write' },
    { resource: 'documents', action: 'read' },
    { resource: 'documents', action: 'write' }
  ],
  
  // Full API access
  FULL: [
    { resource: '*', action: '*' }
  ],
  
  // Partner/integration specific
  INTEGRATION: [
    { resource: 'webhooks', action: 'read' },
    { resource: 'webhooks', action: 'write' },
    { resource: 'sync', action: 'write' },
    { resource: 'cases', action: 'read' },
    { resource: 'clients', action: 'read' }
  ],
  
  // AI services only
  AI_SERVICES: [
    { resource: 'ai/chat', action: 'write' },
    { resource: 'ai/document', action: 'write' },
    { resource: 'ai/seo', action: 'write' },
    { resource: 'documents', action: 'read' }
  ]
} as const

// Different rate limits for different API key types
export const API_KEY_RATE_LIMITS: Record<string, RateLimitConfig> = {
  READ_ONLY: {
    windowMs: 60 * 1000,
    max: 1000
  },
  STANDARD: {
    windowMs: 60 * 1000,
    max: 500
  },
  FULL: {
    windowMs: 60 * 1000,
    max: 200
  },
  INTEGRATION: {
    windowMs: 60 * 1000,
    max: 100
  },
  AI_SERVICES: {
    windowMs: 60 * 1000,
    max: 50 // AI requests are expensive
  }
}

// API Key authentication middleware
export async function apiKeyAuthMiddleware(
  req: NextRequest,
  context: MiddlewareContext
): Promise<MiddlewareResponse> {
  try {
    // Check for API key in headers
    const apiKey = req.headers.get('x-api-key') || 
                   req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!apiKey) {
      // If no API key provided, continue without API key context
      // Some endpoints might be accessible without API keys
      return { success: true }
    }
    
    const apiKeyManager = new ApiKeyManager()
    
    // Validate API key
    const apiKeyData = await apiKeyManager.validateApiKey(apiKey)
    
    // Add API key data to context
    context.apiKey = apiKeyData
    
    return {
      success: true,
      data: { apiKeyData }
    }
    
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode
      }
    }
    
    console.error('API Key authentication error:', error)
    return {
      success: false,
      error: 'Internal authentication error',
      statusCode: 500
    }
  }
}

// Check if API key has specific permission
export function hasApiKeyPermission(
  apiKey: ApiKeyData, 
  resource: string, 
  action: string
): boolean {
  return apiKey.permissions.some(permission => {
    // Check for wildcard permissions
    if (permission.resource === '*' && permission.action === '*') {
      return true
    }
    
    if (permission.resource === '*' && permission.action === action) {
      return true
    }
    
    if (permission.resource === resource && permission.action === '*') {
      return true
    }
    
    // Exact match
    if (permission.resource === resource && permission.action === action) {
      return true
    }
    
    // Check for resource hierarchy (e.g., 'ai/chat' matches 'ai/*')
    if (permission.resource.endsWith('/*')) {
      const baseResource = permission.resource.slice(0, -2)
      if (resource.startsWith(baseResource) && permission.action === action) {
        return true
      }
    }
    
    return false
  })
}

// Validate API key permissions for endpoint
export function validateApiKeyPermissions(
  req: NextRequest,
  context: MiddlewareContext
): MiddlewareResponse {
  if (!context.apiKey) {
    return { success: true } // No API key, defer to other auth methods
  }
  
  const method = req.method
  const pathname = req.nextUrl.pathname
  
  // Map HTTP methods to actions
  const actionMapping: Record<string, string> = {
    GET: 'read',
    POST: 'write',
    PUT: 'write',
    PATCH: 'write',
    DELETE: 'delete',
    OPTIONS: 'read',
    HEAD: 'read'
  }
  
  const action = actionMapping[method] || 'read'
  
  // Extract resource from pathname
  // Remove /api/ prefix and get the first path segment
  const resource = pathname.replace('/api/', '').split('/')[0]
  
  // Check permission
  if (!hasApiKeyPermission(context.apiKey, resource, action)) {
    return {
      success: false,
      error: `API key does not have permission for ${action} on ${resource}`,
      statusCode: 403
    }
  }
  
  return { success: true }
}

// Generate API key with signature (for client-side use)
export function generateSignedApiKey(keyId: string, secretKey: string): string {
  const timestamp = Date.now().toString()
  const signature = createHmac('sha256', secretKey)
    .update(`${keyId}.${timestamp}`)
    .digest('hex')
  
  return `${keyId}.${timestamp}.${signature}`
}

// API Key management utilities
export const ApiKeyUtils = {
  // Create API key for firm
  async createApiKey(
    firmId: string, 
    name: string, 
    permissions: Permission[],
    expiresAt?: Date
  ): Promise<{ keyId: string; secretKey: string }> {
    const manager = new ApiKeyManager()
    const { keyId, secretKey } = manager.generateApiKey(firmId, name)
    
    // In a real implementation, save to database
    const apiKeyData: ApiKeyData = {
      id: keyId,
      name,
      firmId,
      permissions,
      rateLimit: API_KEY_RATE_LIMITS.STANDARD,
      createdAt: new Date(),
      expiresAt
    }
    
    // Mock database save
    console.log('Created API key:', { keyId, apiKeyData })
    
    return { keyId, secretKey }
  },
  
  // Revoke API key
  async revokeApiKey(keyId: string): Promise<void> {
    // In a real implementation, update database
    console.log('Revoked API key:', keyId)
  },
  
  // List API keys for firm
  async listApiKeys(firmId: string): Promise<ApiKeyData[]> {
    // In a real implementation, query database
    return []
  },
  
  // Update API key permissions
  async updateApiKeyPermissions(keyId: string, permissions: Permission[]): Promise<void> {
    // In a real implementation, update database
    console.log('Updated API key permissions:', { keyId, permissions })
  }
}


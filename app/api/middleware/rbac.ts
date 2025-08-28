import { NextRequest } from 'next/server'
import { 
  AuthenticatedUser,
  Role,
  Permission,
  PermissionCondition,
  AuthorizationError,
  MiddlewareContext,
  MiddlewareResponse 
} from './types'

// System-defined roles (cross-firm)
export const SYSTEM_ROLES: Record<string, Role> = {
  SUPER_ADMIN: {
    id: 'sys_super_admin',
    name: 'Super Administrator',
    description: 'Full system access across all firms',
    permissions: [
      { id: 'p_sys_all', resource: '*', action: '*' }
    ]
  },
  
  HODOS_SUPPORT: {
    id: 'sys_support',
    name: 'HODOS Support',
    description: 'Support access to assist users',
    permissions: [
      { id: 'p_support_read', resource: '*', action: 'read' },
      { id: 'p_support_cases', resource: 'cases', action: 'write' },
      { id: 'p_support_audit', resource: 'audit', action: 'read' }
    ]
  }
}

// Default firm-level roles
export const DEFAULT_FIRM_ROLES: Record<string, Omit<Role, 'firmId'>> = {
  FIRM_ADMIN: {
    id: 'firm_admin',
    name: 'Firm Administrator',
    description: 'Full access to firm resources',
    permissions: [
      { id: 'p_firm_all', resource: 'firm', action: '*' },
      { id: 'p_users_all', resource: 'users', action: '*' },
      { id: 'p_cases_all', resource: 'cases', action: '*' },
      { id: 'p_clients_all', resource: 'clients', action: '*' },
      { id: 'p_documents_all', resource: 'documents', action: '*' },
      { id: 'p_billing_all', resource: 'billing', action: '*' },
      { id: 'p_analytics_all', resource: 'analytics', action: '*' }
    ]
  },
  
  ATTORNEY: {
    id: 'attorney',
    name: 'Attorney',
    description: 'Access to cases and client matters',
    permissions: [
      { id: 'p_cases_write', resource: 'cases', action: 'write' },
      { id: 'p_clients_write', resource: 'clients', action: 'write' },
      { id: 'p_documents_write', resource: 'documents', action: 'write' },
      { id: 'p_analytics_read', resource: 'analytics', action: 'read' },
      { 
        id: 'p_billing_read', 
        resource: 'billing', 
        action: 'read',
        conditions: [
          { field: 'attorneyId', operator: 'eq', value: '{{user.id}}' }
        ]
      }
    ]
  },
  
  PARALEGAL: {
    id: 'paralegal',
    name: 'Paralegal',
    description: 'Support access to cases and documents',
    permissions: [
      { id: 'p_cases_read', resource: 'cases', action: 'read' },
      { id: 'p_clients_read', resource: 'clients', action: 'read' },
      { id: 'p_documents_write', resource: 'documents', action: 'write' },
      { 
        id: 'p_cases_update', 
        resource: 'cases', 
        action: 'write',
        conditions: [
          { field: 'status', operator: 'neq', value: 'closed' },
          { field: 'assignedParalegalId', operator: 'eq', value: '{{user.id}}' }
        ]
      }
    ]
  },
  
  LEGAL_ASSISTANT: {
    id: 'legal_assistant',
    name: 'Legal Assistant',
    description: 'Administrative support access',
    permissions: [
      { id: 'p_clients_read', resource: 'clients', action: 'read' },
      { id: 'p_documents_read', resource: 'documents', action: 'read' },
      { id: 'p_calendar_write', resource: 'calendar', action: 'write' },
      { id: 'p_communication_write', resource: 'communication', action: 'write' }
    ]
  },
  
  BILLING_CLERK: {
    id: 'billing_clerk',
    name: 'Billing Clerk',
    description: 'Billing and financial access',
    permissions: [
      { id: 'p_billing_write', resource: 'billing', action: 'write' },
      { id: 'p_clients_read', resource: 'clients', action: 'read' },
      { id: 'p_cases_billing', resource: 'cases', action: 'read' },
      { id: 'p_reports_billing', resource: 'reports/billing', action: 'read' }
    ]
  },
  
  CLIENT_PORTAL: {
    id: 'client_portal',
    name: 'Client Portal User',
    description: 'Limited client access to own cases',
    permissions: [
      { 
        id: 'p_client_own_cases', 
        resource: 'cases', 
        action: 'read',
        conditions: [
          { field: 'clientId', operator: 'eq', value: '{{user.clientId}}' }
        ]
      },
      { 
        id: 'p_client_own_documents', 
        resource: 'documents', 
        action: 'read',
        conditions: [
          { field: 'clientId', operator: 'eq', value: '{{user.clientId}}' },
          { field: 'visibility', operator: 'eq', value: 'client' }
        ]
      },
      { id: 'p_client_communication', resource: 'communication', action: 'write' }
    ]
  },
  
  READ_ONLY: {
    id: 'read_only',
    name: 'Read Only',
    description: 'View-only access to firm data',
    permissions: [
      { id: 'p_cases_read', resource: 'cases', action: 'read' },
      { id: 'p_clients_read', resource: 'clients', action: 'read' },
      { id: 'p_documents_read', resource: 'documents', action: 'read' },
      { id: 'p_analytics_read', resource: 'analytics', action: 'read' }
    ]
  }
}

// Permission condition evaluator
class PermissionEvaluator {
  private context: MiddlewareContext
  private resourceData?: any

  constructor(context: MiddlewareContext, resourceData?: any) {
    this.context = context
    this.resourceData = resourceData
  }

  // Replace template variables in condition values
  private replaceTemplateVariables(value: any): any {
    if (typeof value !== 'string') return value
    
    // Replace user variables
    if (this.context.user) {
      value = value.replace('{{user.id}}', this.context.user.id)
      value = value.replace('{{user.firmId}}', this.context.user.firmId)
      value = value.replace('{{user.clientId}}', (this.context.user as any).clientId || '')
    }
    
    // Replace other context variables
    value = value.replace('{{context.ip}}', this.context.ip)
    value = value.replace('{{timestamp}}', this.context.timestamp.toString())
    
    return value
  }

  // Evaluate a single condition
  private evaluateCondition(condition: PermissionCondition): boolean {
    if (!this.resourceData) {
      // If no resource data provided, we can't evaluate field conditions
      // This might happen for route-level permissions
      return true
    }
    
    const fieldValue = this.resourceData[condition.field]
    const conditionValue = this.replaceTemplateVariables(condition.value)
    
    switch (condition.operator) {
      case 'eq':
        return fieldValue === conditionValue
        
      case 'neq':
        return fieldValue !== conditionValue
        
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
        
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue)
        
      case 'contains':
        return typeof fieldValue === 'string' && 
               typeof conditionValue === 'string' && 
               fieldValue.includes(conditionValue)
        
      case 'starts_with':
        return typeof fieldValue === 'string' && 
               typeof conditionValue === 'string' && 
               fieldValue.startsWith(conditionValue)
        
      default:
        return false
    }
  }

  // Evaluate all conditions for a permission (AND logic)
  public evaluatePermission(permission: Permission): boolean {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true // No conditions means permission is granted
    }
    
    return permission.conditions.every(condition => 
      this.evaluateCondition(condition)
    )
  }
}

// RBAC Manager class
export class RBACManager {
  // Get all permissions for a user (from roles and direct permissions)
  static getAllUserPermissions(user: AuthenticatedUser): Permission[] {
    const allPermissions: Permission[] = []
    
    // Collect permissions from all user roles
    user.roles.forEach(role => {
      allPermissions.push(...role.permissions)
    })
    
    // Add direct user permissions
    allPermissions.push(...user.permissions)
    
    // Remove duplicates based on resource + action combination
    const uniquePermissions = allPermissions.filter((permission, index, array) => {
      const key = `${permission.resource}:${permission.action}`
      return array.findIndex(p => `${p.resource}:${p.action}` === key) === index
    })
    
    return uniquePermissions
  }

  // Check if user has permission for resource/action
  static hasPermission(
    user: AuthenticatedUser,
    resource: string,
    action: string,
    resourceData?: any,
    context?: MiddlewareContext
  ): boolean {
    const permissions = this.getAllUserPermissions(user)
    const evaluator = context ? new PermissionEvaluator(context, resourceData) : null
    
    for (const permission of permissions) {
      // Check for exact match or wildcard permissions
      if (this.matchesPermission(permission, resource, action)) {
        // If no conditions or no context for evaluation, grant permission
        if (!permission.conditions || !evaluator) {
          return true
        }
        
        // Evaluate conditions
        if (evaluator.evaluatePermission(permission)) {
          return true
        }
      }
    }
    
    return false
  }

  // Check if permission matches resource and action
  private static matchesPermission(permission: Permission, resource: string, action: string): boolean {
    // Wildcard permissions
    if (permission.resource === '*' && permission.action === '*') return true
    if (permission.resource === '*' && permission.action === action) return true
    if (permission.resource === resource && permission.action === '*') return true
    
    // Exact match
    if (permission.resource === resource && permission.action === action) return true
    
    // Hierarchical resource matching (e.g., 'cases/billing' matches 'cases/*')
    if (permission.resource.endsWith('/*')) {
      const baseResource = permission.resource.slice(0, -2)
      if (resource.startsWith(baseResource + '/') && permission.action === action) {
        return true
      }
    }
    
    // Parent resource matching (e.g., 'cases' permission applies to 'cases/123')
    if (resource.startsWith(permission.resource + '/') && permission.action === action) {
      return true
    }
    
    return false
  }

  // Get user's effective permissions (after condition evaluation)
  static getEffectivePermissions(
    user: AuthenticatedUser,
    context: MiddlewareContext,
    resourceData?: any
  ): Permission[] {
    const allPermissions = this.getAllUserPermissions(user)
    const evaluator = new PermissionEvaluator(context, resourceData)
    
    return allPermissions.filter(permission => 
      evaluator.evaluatePermission(permission)
    )
  }
}

// Main RBAC middleware
export async function rbacMiddleware(
  req: NextRequest,
  context: MiddlewareContext
): Promise<MiddlewareResponse> {
  try {
    // Skip RBAC if no authenticated user
    if (!context.user) {
      return { success: true }
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
    const pathParts = pathname.replace('/api/', '').split('/')
    const resource = pathParts[0]
    
    // For specific resource operations (e.g., /api/cases/123)
    let resourceData: any = undefined
    if (pathParts.length > 1 && pathParts[1] !== 'route.ts') {
      // In a real implementation, you might fetch the resource data
      // For now, we'll create mock data with the resource ID
      resourceData = {
        id: pathParts[1],
        firmId: context.user.firmId // Ensure firm-level isolation
      }
    }
    
    // Check permission
    const hasAccess = RBACManager.hasPermission(
      context.user,
      resource,
      action,
      resourceData,
      context
    )
    
    if (!hasAccess) {
      throw new AuthorizationError(
        `Insufficient permissions for ${action} operation on ${resource}`
      )
    }
    
    return { success: true }
    
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        error: error.message,
        statusCode: error.statusCode
      }
    }
    
    console.error('RBAC middleware error:', error)
    return {
      success: false,
      error: 'Authorization check failed',
      statusCode: 500
    }
  }
}

// Utility functions for role management
export const RoleUtils = {
  // Create custom role for firm
  createCustomRole(
    firmId: string,
    name: string,
    description: string,
    permissions: Permission[]
  ): Role {
    return {
      id: `custom_${firmId}_${Date.now()}`,
      name,
      description,
      permissions,
      firmId
    }
  },

  // Check if user has specific role
  hasRole(user: AuthenticatedUser, roleId: string): boolean {
    return user.roles.some(role => role.id === roleId)
  },

  // Get user's roles for specific firm
  getFirmRoles(user: AuthenticatedUser, firmId: string): Role[] {
    return user.roles.filter(role => 
      !role.firmId || role.firmId === firmId
    )
  },

  // Check if user is firm admin
  isFirmAdmin(user: AuthenticatedUser): boolean {
    return this.hasRole(user, 'firm_admin') || 
           this.hasRole(user, 'sys_super_admin')
  },

  // Check if user can manage other users
  canManageUsers(user: AuthenticatedUser): boolean {
    return RBACManager.hasPermission(user, 'users', 'write')
  },

  // Get allowed resources for user
  getAllowedResources(user: AuthenticatedUser): string[] {
    const permissions = RBACManager.getAllUserPermissions(user)
    const resources = new Set<string>()
    
    permissions.forEach(permission => {
      if (permission.resource === '*') {
        resources.add('all')
      } else {
        resources.add(permission.resource)
      }
    })
    
    return Array.from(resources)
  }
}

// Decorator for protecting API routes with specific permissions
export function requirePermission(resource: string, action: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: any[]) {
      const req = args[0] as NextRequest
      const context = args[1] as MiddlewareContext
      
      if (!context.user) {
        throw new AuthorizationError('Authentication required')
      }
      
      if (!RBACManager.hasPermission(context.user, resource, action, undefined, context)) {
        throw new AuthorizationError(`Insufficient permissions for ${action} on ${resource}`)
      }
      
      return originalMethod.apply(this, args)
    }
    
    return descriptor
  }
}

// Firm-level data isolation helper
export function ensureFirmIsolation(
  user: AuthenticatedUser,
  resourceFirmId: string
): boolean {
  // Super admins can access all firms
  if (RoleUtils.hasRole(user, 'sys_super_admin')) {
    return true
  }
  
  // Users can only access their own firm's data
  return user.firmId === resourceFirmId
}


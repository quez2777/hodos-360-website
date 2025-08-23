/**
 * Authentication Middleware
 * Validates JWT tokens and enforces access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, ApiResponse, ApiError } from '../types';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    firmId: string;
    role: UserRole;
  };
}

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

    // Check if token is blacklisted
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      return sendUnauthorized(res, 'Token has been revoked');
    }

    // Attach user to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      firmId: decoded.firmId,
      role: decoded.role
    };

    // Verify user still exists and is active
    const userActive = await verifyUserActive(decoded.userId);
    if (!userActive) {
      return sendUnauthorized(res, 'User account is inactive');
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendUnauthorized(res, 'Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return sendUnauthorized(res, 'Invalid token');
    }
    
    console.error('Auth middleware error:', error);
    return sendUnauthorized(res, 'Authentication failed');
  }
};

/**
 * Require specific role(s) for access
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Require minimum role level (hierarchical)
 */
export const requireMinRole = (minRole: UserRole) => {
  const roleHierarchy: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.FIRM_ADMIN]: 90,
    [UserRole.PARTNER]: 80,
    [UserRole.ASSOCIATE]: 70,
    [UserRole.PARALEGAL]: 60,
    [UserRole.SUPPORT_STAFF]: 50,
    [UserRole.CLIENT]: 10
  };

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const userLevel = roleHierarchy[req.user.role];
    const requiredLevel = roleHierarchy[minRole];

    if (userLevel < requiredLevel) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

/**
 * Require specific permissions
 */
export const requirePermissions = (...permissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const hasPermissions = await checkUserPermissions(req.user.userId, permissions);
    if (!hasPermissions) {
      return sendForbidden(res, 'Missing required permissions');
    }

    next();
  };
};

/**
 * Verify firm access - ensures user can only access their firm's data
 */
export const requireFirmAccess = (firmIdParam: string = 'firmId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    const firmId = req.params[firmIdParam] || req.body[firmIdParam] || req.query[firmIdParam];
    
    // Super admins can access any firm
    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (!firmId || firmId !== req.user.firmId) {
      return sendForbidden(res, 'Access denied to this firm\'s resources');
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token present but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      firmId: decoded.firmId,
      role: decoded.role
    };

    next();
  } catch (error) {
    // Token invalid but not required, continue without user
    next();
  }
};

/**
 * API key authentication for external integrations
 */
export const authenticateApiKey = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      return sendUnauthorized(res, 'API key required');
    }

    // Validate API key
    const keyData = await validateApiKey(apiKey);
    if (!keyData) {
      return sendUnauthorized(res, 'Invalid API key');
    }

    // Check if key is active
    if (!keyData.active) {
      return sendUnauthorized(res, 'API key is inactive');
    }

    // Check rate limits for API key
    const withinLimits = await checkApiKeyRateLimit(apiKey);
    if (!withinLimits) {
      return sendTooManyRequests(res, 'API key rate limit exceeded');
    }

    // Attach firm context to request
    req.user = {
      userId: keyData.userId,
      email: keyData.email,
      firmId: keyData.firmId,
      role: UserRole.FIRM_ADMIN // API keys have admin access by default
    };

    // Log API key usage
    await logApiKeyUsage(apiKey, req);

    next();
  } catch (error) {
    console.error('API key auth error:', error);
    return sendUnauthorized(res, 'API key authentication failed');
  }
};

// Helper functions

function sendUnauthorized(res: Response, message: string): void {
  const response: ApiResponse<void> = {
    success: false,
    error: {
      code: 'UNAUTHORIZED',
      message,
      timestamp: new Date()
    }
  };
  res.status(401).json(response);
}

function sendForbidden(res: Response, message: string): void {
  const response: ApiResponse<void> = {
    success: false,
    error: {
      code: 'FORBIDDEN',
      message,
      timestamp: new Date()
    }
  };
  res.status(403).json(response);
}

function sendTooManyRequests(res: Response, message: string): void {
  const response: ApiResponse<void> = {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message,
      timestamp: new Date()
    }
  };
  res.status(429).json(response);
}

// Database functions (to be implemented)
async function checkTokenBlacklist(token: string): Promise<boolean> {
  // Check if token is in blacklist
  return false;
}

async function verifyUserActive(userId: string): Promise<boolean> {
  // Verify user exists and is active
  return true;
}

async function checkUserPermissions(userId: string, permissions: string[]): Promise<boolean> {
  // Check if user has required permissions
  return true;
}

async function validateApiKey(apiKey: string): Promise<any> {
  // Validate API key and return associated data
  return null;
}

async function checkApiKeyRateLimit(apiKey: string): Promise<boolean> {
  // Check if API key is within rate limits
  return true;
}

async function logApiKeyUsage(apiKey: string, req: Request): Promise<void> {
  // Log API key usage for analytics and billing
}
/**
 * Authentication Service
 * Handles user authentication, authorization, and session management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, UserRole, ApiResponse, ApiError } from '../types';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface TokenPayload {
  userId: string;
  email: string;
  firmId: string;
  role: UserRole;
}

export class AuthService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string = '15m';
  private readonly refreshTokenExpiry: string = '7d';
  private readonly bcryptRounds: number = 12;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  }

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    firmId: string;
    role: UserRole;
    barNumber?: string;
    jurisdiction?: string[];
  }): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      // Validate password strength
      this.validatePassword(data.password);

      // Check if user already exists
      const existingUser = await this.getUserByEmail(data.email);
      if (existingUser) {
        throw this.createError('USER_EXISTS', 'User with this email already exists');
      }

      // Validate firm exists and user has permission
      await this.validateFirmAccess(data.firmId, data.role);

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, this.bcryptRounds);

      // Create user
      const user: User = {
        id: this.generateId('user'),
        email: data.email.toLowerCase(),
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        firmId: data.firmId,
        barNumber: data.barNumber,
        jurisdiction: data.jurisdiction,
        emailVerified: false,
        twoFactorEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Save user to database
      await this.saveUser(user, hashedPassword);

      // Send verification email
      await this.sendVerificationEmail(user);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Log authentication event
      await this.logAuthEvent(user.id, 'REGISTER', { firmId: data.firmId });

      return {
        success: true,
        data: {
          user: this.sanitizeUser(user),
          tokens
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Authenticate user and return tokens
   */
  async login(email: string, password: string, twoFactorCode?: string): Promise<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    try {
      // Get user with password
      const { user, hashedPassword } = await this.getUserWithPassword(email);
      if (!user) {
        throw this.createError('INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, hashedPassword);
      if (!isValidPassword) {
        throw this.createError('INVALID_CREDENTIALS', 'Invalid email or password');
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw this.createError('EMAIL_NOT_VERIFIED', 'Please verify your email before logging in');
      }

      // Check 2FA if enabled
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          throw this.createError('2FA_REQUIRED', 'Two-factor authentication code required');
        }
        
        const isValid2FA = await this.verify2FACode(user.id, twoFactorCode);
        if (!isValid2FA) {
          throw this.createError('INVALID_2FA', 'Invalid two-factor authentication code');
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await this.updateUser(user);

      // Generate tokens
      const tokens = this.generateTokens(user);

      // Log authentication event
      await this.logAuthEvent(user.id, 'LOGIN', { 
        twoFactorUsed: user.twoFactorEnabled 
      });

      return {
        success: true,
        data: {
          user: this.sanitizeUser(user),
          tokens
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as TokenPayload;

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw this.createError('INVALID_TOKEN', 'Invalid refresh token');
      }

      // Get user
      const user = await this.getUserById(payload.userId);
      if (!user) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Blacklist old refresh token
      await this.blacklistToken(refreshToken);

      // Log token refresh
      await this.logAuthEvent(user.id, 'TOKEN_REFRESH');

      return {
        success: true,
        data: tokens
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw this.createError('TOKEN_EXPIRED', 'Refresh token has expired');
      }
      throw this.handleError(error);
    }
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(userId: string, refreshToken: string): Promise<ApiResponse<void>> {
    try {
      // Blacklist refresh token
      await this.blacklistToken(refreshToken);

      // Clear any active sessions
      await this.clearUserSessions(userId);

      // Log logout event
      await this.logAuthEvent(userId, 'LOGOUT');

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return { success: true };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token
      await this.savePasswordResetToken(user.id, resetToken, resetTokenExpiry);

      // Send reset email
      await this.sendPasswordResetEmail(user, resetToken);

      // Log password reset request
      await this.logAuthEvent(user.id, 'PASSWORD_RESET_REQUEST');

      return {
        success: true
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      // Validate password strength
      this.validatePassword(newPassword);

      // Verify reset token
      const userId = await this.verifyPasswordResetToken(token);
      if (!userId) {
        throw this.createError('INVALID_TOKEN', 'Invalid or expired reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.bcryptRounds);

      // Update password
      await this.updateUserPassword(userId, hashedPassword);

      // Invalidate reset token
      await this.invalidatePasswordResetToken(token);

      // Clear all user sessions for security
      await this.clearUserSessions(userId);

      // Send confirmation email
      const user = await this.getUserById(userId);
      if (user) {
        await this.sendPasswordChangeConfirmation(user);
      }

      // Log password reset
      await this.logAuthEvent(userId, 'PASSWORD_RESET_COMPLETE');

      return {
        success: true
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<ApiResponse<void>> {
    try {
      // Verify email token
      const userId = await this.verifyEmailToken(token);
      if (!userId) {
        throw this.createError('INVALID_TOKEN', 'Invalid or expired verification token');
      }

      // Update user email verified status
      await this.updateUserEmailVerified(userId, true);

      // Log email verification
      await this.logAuthEvent(userId, 'EMAIL_VERIFIED');

      return {
        success: true
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Enable two-factor authentication
   */
  async enable2FA(userId: string): Promise<ApiResponse<{ secret: string; qrCode: string }>> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw this.createError('USER_NOT_FOUND', 'User not found');
      }

      // Generate 2FA secret
      const secret = this.generate2FASecret();
      
      // Generate QR code
      const qrCode = await this.generate2FAQRCode(user.email, secret);

      // Save secret (encrypted)
      await this.save2FASecret(userId, secret);

      return {
        success: true,
        data: {
          secret,
          qrCode
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify and activate 2FA
   */
  async verify2FA(userId: string, code: string): Promise<ApiResponse<void>> {
    try {
      // Verify code
      const isValid = await this.verify2FACode(userId, code);
      if (!isValid) {
        throw this.createError('INVALID_CODE', 'Invalid verification code');
      }

      // Enable 2FA for user
      await this.updateUser2FAStatus(userId, true);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      await this.saveBackupCodes(userId, backupCodes);

      // Log 2FA enablement
      await this.logAuthEvent(userId, '2FA_ENABLED');

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validate user permissions
   */
  async validatePermissions(userId: string, requiredRole?: UserRole, requiredPermissions?: string[]): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        return false;
      }

      // Check role hierarchy
      if (requiredRole && !this.hasRequiredRole(user.role, requiredRole)) {
        return false;
      }

      // Check specific permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasPermissions = await this.checkUserPermissions(userId, requiredPermissions);
        if (!hasPermissions) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Helper methods

  private generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      firmId: user.firmId!,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry
    });

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry
    });

    return { accessToken, refreshToken };
  }

  private validatePassword(password: string): void {
    const minLength = 12;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);

    if (password.length < minLength) {
      throw this.createError('WEAK_PASSWORD', `Password must be at least ${minLength} characters long`);
    }

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw this.createError('WEAK_PASSWORD', 'Password must contain uppercase, lowercase, numbers, and special characters');
    }
  }

  private hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 100,
      [UserRole.FIRM_ADMIN]: 90,
      [UserRole.PARTNER]: 80,
      [UserRole.ASSOCIATE]: 70,
      [UserRole.PARALEGAL]: 60,
      [UserRole.SUPPORT_STAFF]: 50,
      [UserRole.CLIENT]: 10
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  private sanitizeUser(user: User): User {
    const { ...sanitized } = user;
    // Remove sensitive fields
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).twoFactorSecret;
    return sanitized;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
  }

  private createError(code: string, message: string): ApiError {
    return {
      code,
      message,
      timestamp: new Date()
    };
  }

  private handleError(error: any): ApiError {
    if (error.code && error.message) {
      return error;
    }
    
    return {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error : undefined,
      timestamp: new Date()
    };
  }

  // Database methods (to be implemented with actual database)
  private async getUserByEmail(email: string): Promise<User | null> {
    // Implement database query
    throw new Error('Not implemented');
  }

  private async getUserById(id: string): Promise<User | null> {
    // Implement database query
    throw new Error('Not implemented');
  }

  private async getUserWithPassword(email: string): Promise<{ user: User; hashedPassword: string }> {
    // Implement database query
    throw new Error('Not implemented');
  }

  private async saveUser(user: User, hashedPassword: string): Promise<void> {
    // Implement database save
    throw new Error('Not implemented');
  }

  private async updateUser(user: User): Promise<void> {
    // Implement database update
    throw new Error('Not implemented');
  }

  private async validateFirmAccess(firmId: string, role: UserRole): Promise<void> {
    // Implement firm validation
    throw new Error('Not implemented');
  }

  // Additional helper methods would be implemented here...
  private async sendVerificationEmail(user: User): Promise<void> {
    // Implement email sending
  }

  private async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    // Implement email sending
  }

  private async sendPasswordChangeConfirmation(user: User): Promise<void> {
    // Implement email sending
  }

  private async logAuthEvent(userId: string, event: string, metadata?: any): Promise<void> {
    // Implement audit logging
  }

  private async isTokenBlacklisted(token: string): Promise<boolean> {
    // Implement token blacklist check
    return false;
  }

  private async blacklistToken(token: string): Promise<void> {
    // Implement token blacklisting
  }

  private async clearUserSessions(userId: string): Promise<void> {
    // Implement session clearing
  }

  private async savePasswordResetToken(userId: string, token: string, expiry: Date): Promise<void> {
    // Implement token storage
  }

  private async verifyPasswordResetToken(token: string): Promise<string | null> {
    // Implement token verification
    return null;
  }

  private async invalidatePasswordResetToken(token: string): Promise<void> {
    // Implement token invalidation
  }

  private async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    // Implement password update
  }

  private async verifyEmailToken(token: string): Promise<string | null> {
    // Implement email token verification
    return null;
  }

  private async updateUserEmailVerified(userId: string, verified: boolean): Promise<void> {
    // Implement email verification update
  }

  private generate2FASecret(): string {
    // Implement 2FA secret generation
    return '';
  }

  private async generate2FAQRCode(email: string, secret: string): Promise<string> {
    // Implement QR code generation
    return '';
  }

  private async save2FASecret(userId: string, secret: string): Promise<void> {
    // Implement 2FA secret storage
  }

  private async verify2FACode(userId: string, code: string): Promise<boolean> {
    // Implement 2FA code verification
    return false;
  }

  private async updateUser2FAStatus(userId: string, enabled: boolean): Promise<void> {
    // Implement 2FA status update
  }

  private generateBackupCodes(): string[] {
    // Generate backup codes
    return [];
  }

  private async saveBackupCodes(userId: string, codes: string[]): Promise<void> {
    // Implement backup codes storage
  }

  private async checkUserPermissions(userId: string, permissions: string[]): Promise<boolean> {
    // Implement permission checking
    return true;
  }
}
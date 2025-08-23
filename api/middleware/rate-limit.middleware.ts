/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm for API rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { ApiResponse, RateLimitInfo } from '../types';

interface RateLimitOptions {
  windowMs?: number;     // Time window in milliseconds
  max?: number;          // Max requests per window
  message?: string;      // Error message
  keyGenerator?: (req: Request) => string;  // Custom key generator
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  standardHeaders?: boolean;  // Return rate limit info in headers
  legacyHeaders?: boolean;    // Return legacy headers
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private redis: Redis;
  private readonly defaultOptions: RateLimitOptions = {
    windowMs: 60 * 1000,  // 1 minute
    max: 100,             // 100 requests per minute
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  };

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD
    });
  }

  /**
   * Create rate limiter middleware with specified options
   */
  create(options: RateLimitOptions = {}) {
    const config = { ...this.defaultOptions, ...options };

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Generate key for this request
        const key = this.generateKey(req, config.keyGenerator);

        // Get or create token bucket
        const bucket = await this.getTokenBucket(key, config);

        // Check if request should be allowed
        const allowed = await this.consumeToken(key, bucket, config);

        // Set rate limit headers
        if (config.standardHeaders) {
          this.setStandardHeaders(res, bucket, config);
        }
        if (config.legacyHeaders) {
          this.setLegacyHeaders(res, bucket, config);
        }

        if (!allowed) {
          return this.sendRateLimitExceeded(res, config.message!);
        }

        // Track request for rate limiting (unless skipped)
        if (!config.skipSuccessfulRequests) {
          res.on('finish', () => {
            if (res.statusCode < 400 || !config.skipFailedRequests) {
              // Request counted towards rate limit
            }
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiter error:', error);
        // Fail open - allow request if rate limiter fails
        next();
      }
    };
  }

  /**
   * Create different rate limiters for different subscription tiers
   */
  createTiered() {
    return async (req: Request & { user?: any }, res: Response, next: NextFunction): Promise<void> => {
      // Get user's subscription tier
      const tier = await this.getUserTier(req.user?.firmId);
      
      let options: RateLimitOptions;
      switch (tier) {
        case 'ENTERPRISE':
          options = {
            windowMs: 60 * 1000,
            max: 1000,  // 1000 requests per minute
            message: 'Enterprise rate limit exceeded'
          };
          break;
        case 'PROFESSIONAL':
          options = {
            windowMs: 60 * 1000,
            max: 500,   // 500 requests per minute
            message: 'Professional rate limit exceeded'
          };
          break;
        case 'STARTER':
        default:
          options = {
            windowMs: 60 * 1000,
            max: 100,   // 100 requests per minute
            message: 'Rate limit exceeded. Upgrade your plan for higher limits.'
          };
      }

      const middleware = this.create(options);
      middleware(req, res, next);
    };
  }

  /**
   * Create strict rate limiter for sensitive endpoints
   */
  createStrict(max: number = 5, windowMs: number = 15 * 60 * 1000) {
    return this.create({
      windowMs,
      max,
      message: 'Too many attempts. Please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    });
  }

  /**
   * Create rate limiter for authentication endpoints
   */
  createAuthLimiter() {
    return this.create({
      windowMs: 15 * 60 * 1000,  // 15 minutes
      max: 5,  // 5 attempts per 15 minutes
      message: 'Too many authentication attempts. Please try again later.',
      keyGenerator: (req) => {
        // Rate limit by IP + email combination
        const email = req.body.email || '';
        return `auth:${this.getIP(req)}:${email}`;
      },
      skipSuccessfulRequests: true  // Only count failed attempts
    });
  }

  /**
   * Create rate limiter for API endpoints with burst allowance
   */
  createBurstLimiter(sustained: number = 100, burst: number = 200, windowMs: number = 60000) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = this.generateKey(req);
        const burstKey = `${key}:burst`;

        // Check burst limit first
        const burstBucket = await this.getTokenBucket(burstKey, { windowMs: 1000, max: burst });
        const burstAllowed = await this.consumeToken(burstKey, burstBucket, { windowMs: 1000, max: burst });

        if (!burstAllowed) {
          return this.sendRateLimitExceeded(res, 'Burst limit exceeded. Please slow down your requests.');
        }

        // Check sustained limit
        const sustainedBucket = await this.getTokenBucket(key, { windowMs, max: sustained });
        const sustainedAllowed = await this.consumeToken(key, sustainedBucket, { windowMs, max: sustained });

        // Set headers
        this.setStandardHeaders(res, sustainedBucket, { windowMs, max: sustained });

        if (!sustainedAllowed) {
          return this.sendRateLimitExceeded(res, 'Sustained rate limit exceeded.');
        }

        next();
      } catch (error) {
        console.error('Burst limiter error:', error);
        next();
      }
    };
  }

  /**
   * Create sliding window rate limiter
   */
  createSlidingWindow(max: number = 100, windowMs: number = 60000) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const key = this.generateKey(req);
        const now = Date.now();
        const windowStart = now - windowMs;

        // Remove old entries
        await this.redis.zremrangebyscore(key, '-inf', windowStart);

        // Count requests in current window
        const count = await this.redis.zcard(key);

        if (count >= max) {
          // Get oldest request time to calculate retry after
          const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
          const retryAfter = oldestRequest.length > 1 
            ? Math.ceil((parseInt(oldestRequest[1]) + windowMs - now) / 1000)
            : Math.ceil(windowMs / 1000);

          res.setHeader('Retry-After', retryAfter);
          return this.sendRateLimitExceeded(res, 'Rate limit exceeded');
        }

        // Add current request
        await this.redis.zadd(key, now, `${now}:${Math.random()}`);
        await this.redis.expire(key, Math.ceil(windowMs / 1000));

        // Set headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - count - 1));
        res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());

        next();
      } catch (error) {
        console.error('Sliding window limiter error:', error);
        next();
      }
    };
  }

  // Helper methods

  private generateKey(req: Request, customGenerator?: (req: Request) => string): string {
    if (customGenerator) {
      return `rate:${customGenerator(req)}`;
    }

    // Default: rate limit by authenticated user or IP
    const user = (req as any).user;
    if (user?.userId) {
      return `rate:user:${user.userId}`;
    }

    return `rate:ip:${this.getIP(req)}`;
  }

  private getIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           (req.headers['x-real-ip'] as string) ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           'unknown';
  }

  private async getTokenBucket(key: string, config: RateLimitOptions): Promise<TokenBucket> {
    const data = await this.redis.get(key);
    if (!data) {
      return {
        tokens: config.max!,
        lastRefill: Date.now()
      };
    }
    return JSON.parse(data);
  }

  private async consumeToken(key: string, bucket: TokenBucket, config: RateLimitOptions): Promise<boolean> {
    const now = Date.now();
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / config.windowMs! * config.max!);

    bucket.tokens = Math.min(config.max!, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens > 0) {
      bucket.tokens--;
      await this.redis.setex(key, Math.ceil(config.windowMs! / 1000), JSON.stringify(bucket));
      return true;
    }

    return false;
  }

  private setStandardHeaders(res: Response, bucket: TokenBucket, config: RateLimitOptions): void {
    res.setHeader('X-RateLimit-Limit', config.max!);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, bucket.tokens));
    res.setHeader('X-RateLimit-Reset', new Date(bucket.lastRefill + config.windowMs!).toISOString());
  }

  private setLegacyHeaders(res: Response, bucket: TokenBucket, config: RateLimitOptions): void {
    res.setHeader('X-Rate-Limit-Limit', config.max!);
    res.setHeader('X-Rate-Limit-Remaining', Math.max(0, bucket.tokens));
    res.setHeader('X-Rate-Limit-Reset', Math.floor((bucket.lastRefill + config.windowMs!) / 1000));
  }

  private sendRateLimitExceeded(res: Response, message: string): void {
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

  private async getUserTier(firmId?: string): Promise<string> {
    if (!firmId) return 'STARTER';
    
    // Get user's subscription tier from database
    // This is a placeholder implementation
    return 'STARTER';
  }

  /**
   * Get current rate limit status for a key
   */
  async getStatus(key: string, config: RateLimitOptions = {}): Promise<RateLimitInfo> {
    const mergedConfig = { ...this.defaultOptions, ...config };
    const bucket = await this.getTokenBucket(key, mergedConfig);
    
    return {
      limit: mergedConfig.max!,
      remaining: Math.max(0, bucket.tokens),
      reset: new Date(bucket.lastRefill + mergedConfig.windowMs!)
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  async reset(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Clean up expired rate limit entries
   */
  async cleanup(): Promise<void> {
    // Implement cleanup logic for expired entries
    const pattern = 'rate:*';
    const stream = this.redis.scanStream({ match: pattern });
    
    stream.on('data', async (keys: string[]) => {
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl === -1) {
          // Key has no expiration, set a reasonable one
          await this.redis.expire(key, 3600); // 1 hour
        }
      }
    });
  }
}

// Export singleton instance and middleware factories
const rateLimiter = new RateLimiter();

export const rateLimit = rateLimiter.create.bind(rateLimiter);
export const tieredRateLimit = rateLimiter.createTiered.bind(rateLimiter);
export const strictRateLimit = rateLimiter.createStrict.bind(rateLimiter);
export const authRateLimit = rateLimiter.createAuthLimiter.bind(rateLimiter);
export const burstRateLimit = rateLimiter.createBurstLimiter.bind(rateLimiter);
export const slidingWindowRateLimit = rateLimiter.createSlidingWindow.bind(rateLimiter);

export default rateLimiter;
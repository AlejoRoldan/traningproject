/**
 * Rate Limiter Middleware
 * Protege endpoints costosos (OpenAI) contra abuso y DoS
 *
 * Uses Redis for distributed rate limiting
 */

import { TRPCError } from '@trpc/server';
import { getRedisService } from '../cache/redis.service';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

// Fallback in-memory store for development/offline mode
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const fallbackStore: RateLimitStore = {};

/**
 * Create a rate limiter for a specific endpoint
 * Uses Redis with fallback to in-memory store
 * @param config Rate limit configuration
 * @returns Function to check rate limit
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = config;
  const redis = getRedisService();

  return async function rateLimiter(identifier: string): Promise<void> {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;
    const windowSeconds = Math.ceil(windowMs / 1000);

    try {
      // Try to use Redis first
      const currentCount = await redis.increment(key, 1);

      // Set expiration on first request
      if (currentCount === 1) {
        await redis.expire(key, windowSeconds);
      }

      // Check limit
      if (currentCount > maxRequests) {
        const ttl = await redis.ttl(key);
        const retryAfter = ttl > 0 ? ttl : windowSeconds;
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `${message} Retry after ${retryAfter} seconds.`,
        });
      }
    } catch (error) {
      // Fallback to in-memory store if Redis fails
      if (error instanceof TRPCError) {
        throw error;
      }

      console.warn('[RateLimiter] Redis unavailable, using fallback store');

      // Use fallback store
      if (!fallbackStore[key]) {
        fallbackStore[key] = {
          count: 1,
          resetTime: now + windowMs,
        };
        return;
      }

      const record = fallbackStore[key];

      // Reset if window has passed
      if (now > record.resetTime) {
        record.count = 1;
        record.resetTime = now + windowMs;
        return;
      }

      // Increment counter
      record.count++;

      // Check limit
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `${message} Retry after ${retryAfter} seconds.`,
        });
      }
    }
  };
}

/**
 * Rate limiters for different endpoints
 */

// OpenAI endpoints: 10 requests per minute per user
export const openaiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: 'OpenAI API rate limit exceeded. Please wait before making another request.',
});

// Evaluation endpoints: 5 requests per minute per user
export const evaluationRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  message: 'Evaluation rate limit exceeded. Please wait before evaluating another simulation.',
});

// Voice transcription: 3 requests per minute per user
export const transcriptionRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 3,
  message: 'Transcription rate limit exceeded. Please wait before transcribing another audio.',
});

/**
 * Cleanup old entries from fallback store (run periodically)
 * Redis handles TTL automatically
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const key in fallbackStore) {
    if (fallbackStore[key].resetTime < now) {
      delete fallbackStore[key];
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

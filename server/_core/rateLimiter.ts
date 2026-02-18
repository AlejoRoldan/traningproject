/**
 * Rate Limiter Middleware
 * Protege endpoints costosos (OpenAI) contra abuso y DoS
 */

import { TRPCError } from '@trpc/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (for production, use Redis)
const store: RateLimitStore = {};

/**
 * Create a rate limiter for a specific endpoint
 * @param config Rate limit configuration
 * @returns Function to check rate limit
 */
export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = config;

  return function rateLimiter(identifier: string): void {
    const now = Date.now();
    const key = `ratelimit:${identifier}`;

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return;
    }

    const record = store[key];

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
 * Cleanup old entries from store (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);

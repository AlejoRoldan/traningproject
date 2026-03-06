/**
 * Caching Middleware for tRPC Procedures
 * Provides convenient caching for queries and mutations
 */

import { getRedisService } from './redis.service';
import { Logger } from '@nestjs/common';

interface CacheConfig {
  ttl: number; // Time to live in seconds
  tags?: string[]; // Tags for invalidation
  keyPrefix?: string;
}

const logger = new Logger('CachingMiddleware');

/**
 * Generate cache key from procedure and input
 */
function generateCacheKey(procedure: string, input?: any, keyPrefix?: string): string {
  const prefix = keyPrefix || 'cache';
  const inputHash = input ? JSON.stringify(input).substring(0, 50) : 'empty';
  return `${prefix}:${procedure}:${inputHash}`;
}

/**
 * Wrap a query function with caching
 */
export async function withCache<T>(
  cacheKey: string,
  ttl: number,
  queryFn: () => Promise<T>,
  tags?: string[]
): Promise<T> {
  const redis = getRedisService();

  try {
    // Try to get from cache
    const cached = await redis.get<T>(cacheKey);
    if (cached !== null) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }
  } catch (error) {
    logger.warn(`Cache get failed: ${error}`);
  }

  // Execute query
  const result = await queryFn();

  // Store in cache
  try {
    await redis.set(cacheKey, result, { ttl, tags });
    logger.debug(`Cache set: ${cacheKey}`);
  } catch (error) {
    logger.warn(`Cache set failed: ${error}`);
  }

  return result;
}

/**
 * Invalidate cache by pattern
 */
export async function invalidateCachePattern(pattern: string): Promise<number> {
  const redis = getRedisService();
  try {
    const deleted = await redis.deletePattern(pattern);
    logger.debug(`Invalidated pattern ${pattern}: ${deleted} keys`);
    return deleted;
  } catch (error) {
    logger.error(`Invalidate pattern failed: ${error}`);
    return 0;
  }
}

/**
 * Invalidate cache by tag
 */
export async function invalidateCacheTag(tag: string): Promise<number> {
  const redis = getRedisService();
  try {
    const deleted = await redis.invalidateTag(tag);
    logger.debug(`Invalidated tag ${tag}: ${deleted} keys`);
    return deleted;
  } catch (error) {
    logger.error(`Invalidate tag failed: ${error}`);
    return 0;
  }
}

/**
 * Cache strategies for different data types
 */
export const CACHE_STRATEGIES = {
  // Analytics - short TTL for real-time data
  analytics: {
    ttl: 5 * 60, // 5 minutes
    tags: ['analytics'],
  },
  // User data - medium TTL
  user: {
    ttl: 30 * 60, // 30 minutes
    tags: ['user'],
  },
  // Scenario data - longer TTL (changes less frequently)
  scenario: {
    ttl: 60 * 60, // 1 hour
    tags: ['scenario'],
  },
  // Session data - very long TTL
  session: {
    ttl: 24 * 60 * 60, // 24 hours
    tags: ['session'],
  },
  // Leaderboard - medium TTL
  leaderboard: {
    ttl: 15 * 60, // 15 minutes
    tags: ['leaderboard', 'analytics'],
  },
};

/**
 * Cache invalidation events
 */
export class CacheInvalidationService {
  /**
   * Called when a simulation is completed
   */
  static async onSimulationCompleted(userId: number, simulationId: string): Promise<void> {
    const tags = ['analytics', `user:${userId}`];
    for (const tag of tags) {
      await invalidateCacheTag(tag);
    }
    logger.log(`Invalidated cache for simulation completion: ${simulationId}`);
  }

  /**
   * Called when user profile is updated
   */
  static async onUserProfileUpdated(userId: number): Promise<void> {
    await invalidateCacheTag(`user:${userId}`);
    logger.log(`Invalidated cache for user profile: ${userId}`);
  }

  /**
   * Called when scenarios are updated
   */
  static async onScenariosUpdated(): Promise<void> {
    await invalidateCacheTag('scenario');
    logger.log(`Invalidated cache for all scenarios`);
  }

  /**
   * Called when a specific scenario is updated
   */
  static async onScenarioUpdated(scenarioId: number): Promise<void> {
    await invalidateCacheTag(`scenario:${scenarioId}`);
    logger.log(`Invalidated cache for scenario: ${scenarioId}`);
  }
}

/**
 * Redis Service
 * Centralized Redis operations with caching strategies
 *
 * Features:
 * - Get/Set/Delete operations
 * - TTL-based expiration
 * - Pattern-based invalidation
 * - Increment operations for counters
 * - Pub/Sub support
 */

import Redis from 'ioredis';
import { Logger } from '@nestjs/common';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for invalidation
}

export class RedisService {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
      enableReadyCheck: false,
      enableOfflineQueue: true,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    this.redis.on('connect', () => {
      this.isConnected = true;
      this.logger.log('✓ Redis connected');
    });

    this.redis.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
      this.isConnected = false;
    });
  }

  /**
   * Get a value from cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Error getting key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map((value) => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      this.logger.error(`Error getting multiple keys:`, error);
      return keys.map(() => null);
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (options?.ttl) {
        await this.redis.setex(key, options.ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }

      // Store tags for invalidation if provided
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.redis.sadd(`tag:${tag}`, key);
        }
      }

      this.logger.debug(`Cache set: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting key ${key}:`, error);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error deleting key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete multiple keys
   */
  async mdelete(keys: string[]): Promise<number> {
    try {
      const result = await this.redis.del(...keys);
      this.logger.debug(`Cache deleted: ${keys.length} keys`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting multiple keys:`, error);
      return 0;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }
      const result = await this.redis.del(...keys);
      this.logger.debug(`Cache deleted by pattern ${pattern}: ${result} keys`);
      return result;
    } catch (error) {
      this.logger.error(`Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      await this.redis.del(`tag:${tag}`);

      this.logger.debug(`Invalidated tag ${tag}: ${result} keys`);
      return result;
    } catch (error) {
      this.logger.error(`Error invalidating tag ${tag}:`, error);
      return 0;
    }
  }

  /**
   * Increment a counter
   */
  async increment(key: string, delta: number = 1): Promise<number> {
    try {
      const result = await this.redis.incrby(key, delta);
      return result;
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error checking key existence ${key}:`, error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for ${key}:`, error);
      return -1;
    }
  }

  /**
   * Set TTL for a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, seconds);
      return result > 0;
    } catch (error) {
      this.logger.error(`Error setting expiration for ${key}:`, error);
      return false;
    }
  }

  /**
   * Get all cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    info: Record<string, any>;
  }> {
    try {
      const info = await this.redis.info('stats');
      return {
        connected: this.isConnected,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      this.logger.error(`Error getting stats:`, error);
      return {
        connected: this.isConnected,
        info: {},
      };
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.warn('Cache cleared - flushdb executed');
    } catch (error) {
      this.logger.error(`Error clearing cache:`, error);
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Redis disconnected');
    } catch (error) {
      this.logger.error(`Error disconnecting:`, error);
    }
  }

  /**
   * Parse Redis INFO response
   */
  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    }

    return result;
  }

  /**
   * Health check for Redis
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error(`Health check failed:`, error);
      return false;
    }
  }
}

// Create singleton instance
let redisServiceInstance: RedisService;

export function getRedisService(): RedisService {
  if (!redisServiceInstance) {
    redisServiceInstance = new RedisService();
  }
  return redisServiceInstance;
}

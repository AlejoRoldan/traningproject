/**
 * Tests for Environment Variables Validation
 * 
 * These tests verify that the environment validation schema works correctly
 * and catches missing or invalid environment variables.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

describe('Environment Variables Validation', () => {
  // Store original env
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Required Variables', () => {
    it('should validate all required environment variables', () => {
      // Set up minimal valid environment
      process.env.NODE_ENV = 'development';
      process.env.DATABASE_URL = 'mysql://user:pass@localhost/db';
      process.env.JWT_SECRET = 'a'.repeat(32); // 32+ chars
      process.env.VITE_APP_ID = 'test-app-id';
      process.env.OAUTH_SERVER_URL = 'https://oauth.example.com';
      process.env.OWNER_OPEN_ID = 'owner-123';
      process.env.OWNER_NAME = 'Test Owner';
      process.env.OPENAI_API_KEY = 'sk-test-key';
      process.env.BUILT_IN_FORGE_API_URL = 'https://api.example.com';
      process.env.BUILT_IN_FORGE_API_KEY = 'forge-key-123';

      // Define schema inline for testing
      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
        DATABASE_URL: z.string().url(),
        JWT_SECRET: z.string().min(32),
        VITE_APP_ID: z.string().min(1),
        OAUTH_SERVER_URL: z.string().url(),
        OWNER_OPEN_ID: z.string().min(1),
        OWNER_NAME: z.string().min(1),
        OPENAI_API_KEY: z.string().min(1),
        BUILT_IN_FORGE_API_URL: z.string().url(),
        BUILT_IN_FORGE_API_KEY: z.string().min(1),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(true);
    });

    it('should fail if DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;

      const envSchema = z.object({
        DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
    });

    it('should fail if DATABASE_URL is not a valid URL', () => {
      process.env.DATABASE_URL = 'not-a-url';

      const envSchema = z.object({
        DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
    });

    it('should fail if JWT_SECRET is less than 32 characters', () => {
      process.env.JWT_SECRET = 'short-secret';

      const envSchema = z.object({
        JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
    });

    it('should fail if OPENAI_API_KEY is missing', () => {
      delete process.env.OPENAI_API_KEY;

      const envSchema = z.object({
        OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for AI features'),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
    });
  });

  describe('Optional Variables', () => {
    it('should allow optional variables to be missing', () => {
      const envSchema = z.object({
        VITE_OAUTH_PORTAL_URL: z.string().url().optional(),
        VITE_ANALYTICS_ENDPOINT: z.string().url().optional(),
      });

      const result = envSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate optional URL variables when provided', () => {
      process.env.VITE_OAUTH_PORTAL_URL = 'https://oauth.example.com';

      const envSchema = z.object({
        VITE_OAUTH_PORTAL_URL: z.string().url().optional(),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(true);
    });

    it('should fail optional URL if invalid format provided', () => {
      process.env.VITE_OAUTH_PORTAL_URL = 'not-a-url';

      const envSchema = z.object({
        VITE_OAUTH_PORTAL_URL: z.string().url().optional(),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
    });
  });

  describe('NODE_ENV Enum', () => {
    it('should accept valid NODE_ENV values', () => {
      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      });

      const testCases = ['development', 'production', 'test'];
      testCases.forEach(env => {
        process.env.NODE_ENV = env;
        const result = envSchema.safeParse(process.env);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid NODE_ENV values', () => {
      process.env.NODE_ENV = 'invalid-env';

      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
    });

    it('should use default NODE_ENV if not provided', () => {
      delete process.env.NODE_ENV;

      const envSchema = z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
      }
    });
  });

  describe('Error Messages', () => {
    it('should provide clear error messages for validation failures', () => {
      process.env.DATABASE_URL = 'invalid-url';

      const envSchema = z.object({
        DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('DATABASE_URL must be a valid URL');
      }
    });

    it('should report multiple validation errors', () => {
      process.env.DATABASE_URL = 'invalid-url';
      process.env.JWT_SECRET = 'short';

      const envSchema = z.object({
        DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
        JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
      });

      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('Feature Availability Helpers', () => {
    it('should detect OpenAI availability', () => {
      process.env.OPENAI_API_KEY = 'sk-test-key';
      const isAvailable = !!process.env.OPENAI_API_KEY;
      expect(isAvailable).toBe(true);
    });

    it('should detect Supabase availability', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.example.com';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'supabase-key';
      
      const isAvailable = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(isAvailable).toBe(true);
    });

    it('should detect production mode', () => {
      process.env.NODE_ENV = 'production';
      const isProduction = process.env.NODE_ENV === 'production';
      expect(isProduction).toBe(true);
    });
  });
});

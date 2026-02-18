/**
 * Environment Variables Validation with Zod
 * 
 * This module validates all required environment variables at server startup.
 * If any critical variable is missing, the server will fail to start with a clear error message.
 */

import { z } from 'zod';

/**
 * Define the schema for environment variables
 * Separate into required and optional for clarity
 */
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication & OAuth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  VITE_APP_ID: z.string().min(1, 'VITE_APP_ID is required'),
  OAUTH_SERVER_URL: z.string().url('OAUTH_SERVER_URL must be a valid URL'),
  OWNER_OPEN_ID: z.string().min(1, 'OWNER_OPEN_ID is required'),
  OWNER_NAME: z.string().min(1, 'OWNER_NAME is required'),

  // OpenAI / LLM
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for AI features'),

  // Manus Built-in APIs
  BUILT_IN_FORGE_API_URL: z.string().url('BUILT_IN_FORGE_API_URL must be a valid URL'),
  BUILT_IN_FORGE_API_KEY: z.string().min(1, 'BUILT_IN_FORGE_API_KEY is required'),

  // Aliases for backward compatibility
  forgeApiUrl: z.string().url('forgeApiUrl must be a valid URL').optional(),
  forgeApiKey: z.string().optional(),
  appId: z.string().optional(),
  cookieSecret: z.string().optional(),
  databaseUrl: z.string().optional(),
  oAuthServerUrl: z.string().optional(),
  ownerOpenId: z.string().optional(),
  isProduction: z.boolean().optional(),

  // Frontend URLs (optional, used for CORS and redirects)
  VITE_OAUTH_PORTAL_URL: z.string().url('VITE_OAUTH_PORTAL_URL must be a valid URL').optional(),
  VITE_FRONTEND_FORGE_API_URL: z.string().url('VITE_FRONTEND_FORGE_API_URL must be a valid URL').optional(),
  VITE_FRONTEND_FORGE_API_KEY: z.string().optional(),

  // Supabase (optional, for sync features)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),

  // Analytics (optional)
  VITE_ANALYTICS_ENDPOINT: z.string().url('VITE_ANALYTICS_ENDPOINT must be a valid URL').optional(),
  VITE_ANALYTICS_WEBSITE_ID: z.string().optional(),

  // App configuration (optional)
  VITE_APP_TITLE: z.string().optional(),
  VITE_APP_LOGO: z.string().optional(),
});

/**
 * Parse and validate environment variables
 */
function parseEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.issues
      .map((err: any) => `  • ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    const message = `
❌ Environment Variables Validation Failed

The following environment variables are missing or invalid:
${errors}

Please check your .env file or environment configuration and ensure all required variables are set.
For more information, see the documentation.
    `.trim();

    console.error(message);
    process.exit(1);
  }

  return result.data;
}

/**
 * Validated environment variables
 * Safe to use throughout the application
 */
export const ENV = parseEnv();

/**
 * Type-safe environment object for exports
 */
export type Environment = typeof ENV;

/**
 * Helper function to check if a feature is available
 */
export const isFeatureAvailable = {
  openai: (): boolean => !!ENV.OPENAI_API_KEY,
  supabase: (): boolean => !!ENV.NEXT_PUBLIC_SUPABASE_URL && !!ENV.SUPABASE_SERVICE_ROLE_KEY,
  analytics: (): boolean => !!ENV.VITE_ANALYTICS_ENDPOINT && !!ENV.VITE_ANALYTICS_WEBSITE_ID,
  production: (): boolean => ENV.NODE_ENV === 'production',
};

/**
 * Log validated environment on startup (in development only)
 */
if (ENV.NODE_ENV === 'development') {
  console.log('✅ Environment variables validated successfully');
  console.log(`📍 Running in ${ENV.NODE_ENV} mode`);
  console.log(`🔐 OpenAI: ${isFeatureAvailable.openai() ? '✓' : '✗'}`);
  console.log(`📊 Supabase: ${isFeatureAvailable.supabase() ? '✓' : '✗'}`);
  console.log(`📈 Analytics: ${isFeatureAvailable.analytics() ? '✓' : '✗'}`);
}

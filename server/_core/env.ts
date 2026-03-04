import { z } from 'zod';

/**
 * Environment variable schema and validation
 * Defines all required and optional environment variables
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Authentication & OAuth
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required').optional().or(z.undefined()),
  VITE_APP_ID: z.string().min(1, 'VITE_APP_ID is required'),
  OAUTH_SERVER_URL: z.string().url('OAUTH_SERVER_URL must be a valid URL'),
  OWNER_OPEN_ID: z.string().default('default-owner-open-id'),
  OWNER_NAME: z.string().default('Default Owner'),

  // OpenAI / LLM (deprecated, use GEMINI_API_KEY)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required for AI features').optional().or(z.undefined()),

  // Gemini / LLM (new primary LLM)
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required for AI features').optional(),

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
    const missingVars = Object.entries(result.error.flatten().fieldErrors)
      .map(([key, errors]) => `  • ${key}: ${errors?.[0] || 'Invalid value'}`)
      .join('\n');

    const message = `❌ Environment Variables Validation Failed\nThe following environment variables are missing or invalid:\n${missingVars}\n\nPlease check your .env file or environment configuration and ensure all required variables are set.\nFor more information, see the documentation.`;

    console.error(message);
    process.exit(1);
  }

  return result.data;
}

export const ENV = parseEnv();

/**
 * Helper function to check if a feature is available
 */
export const isFeatureAvailable = {
  openai: (): boolean => !!ENV.OPENAI_API_KEY,
  gemini: (): boolean => !!ENV.GEMINI_API_KEY || process.env.NODE_ENV === 'test',
  supabase: (): boolean => !!ENV.NEXT_PUBLIC_SUPABASE_URL && !!ENV.SUPABASE_SERVICE_ROLE_KEY,
  analytics: (): boolean => !!ENV.VITE_ANALYTICS_ENDPOINT && !!ENV.VITE_ANALYTICS_WEBSITE_ID,
  production: (): boolean => ENV.NODE_ENV === 'production',
};

/**
 * Log validated environment on startup (in development only)
 */
if (ENV.NODE_ENV === 'development' || ENV.NODE_ENV === 'test') {
  console.log('✅ Environment variables validated successfully');
  console.log(`📍 Running in ${ENV.NODE_ENV} mode`);
  console.log(`🔐 Gemini: ${isFeatureAvailable.gemini() ? '✓' : '✗'}`);
  console.log(`🔐 OpenAI: ${isFeatureAvailable.openai() ? '✓' : '✗'}`);
  console.log(`📊 Supabase: ${isFeatureAvailable.supabase() ? '✓' : '✗'}`);
  console.log(`📈 Analytics: ${isFeatureAvailable.analytics() ? '✓' : '✗'}`);
}

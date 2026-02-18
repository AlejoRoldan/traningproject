#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * 
 * Valida que todas las variables de entorno requeridas estén configuradas
 * correctamente para el entorno actual (development, staging, production).
 * 
 * Uso:
 *   node scripts/validate-env.mjs
 *   NODE_ENV=staging node scripts/validate-env.mjs
 *   NODE_ENV=production node scripts/validate-env.mjs
 */

import { z } from 'zod';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'cyan');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Define validation schemas for each environment
const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  VITE_APP_ID: z.string().min(1),
  OAUTH_SERVER_URL: z.string().url(),
  OWNER_OPEN_ID: z.string().min(1),
  OWNER_NAME: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  BUILT_IN_FORGE_API_URL: z.string().url(),
  BUILT_IN_FORGE_API_KEY: z.string().min(1),
});

const optionalSchema = z.object({
  VITE_OAUTH_PORTAL_URL: z.string().url().optional(),
  VITE_FRONTEND_FORGE_API_URL: z.string().url().optional(),
  VITE_FRONTEND_FORGE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  VITE_ANALYTICS_ENDPOINT: z.string().url().optional(),
  VITE_ANALYTICS_WEBSITE_ID: z.string().optional(),
  VITE_APP_TITLE: z.string().optional(),
  VITE_APP_LOGO: z.string().optional(),
});

// Environment-specific requirements
const envRequirements = {
  development: {
    description: 'Development environment (local testing)',
    minSecurityLevel: 'low',
    notes: [
      'Weak credentials are acceptable',
      'Local database is typical',
      'Rate limiting can be disabled',
    ],
  },
  staging: {
    description: 'Staging environment (pre-production testing)',
    minSecurityLevel: 'medium',
    notes: [
      'Secure credentials required (min 16 chars)',
      'SSL/TLS for database recommended',
      'Rate limiting should be enabled',
      'Use test data only',
    ],
  },
  production: {
    description: 'Production environment (live users)',
    minSecurityLevel: 'high',
    notes: [
      'Very secure credentials required (min 32 chars)',
      'SSL/TLS for all connections mandatory',
      'Rate limiting must be enabled',
      'Real data protection critical',
      'Monitoring and alerting required',
      'Backup strategy must be in place',
    ],
  },
};

function validateCredentialSecurity(envType) {
  const requirements = envRequirements[envType];
  const checks = [];

  // Check JWT_SECRET length
  const jwtLength = process.env.JWT_SECRET?.length || 0;
  if (envType === 'production' && jwtLength < 32) {
    checks.push({
      name: 'JWT_SECRET Security',
      passed: false,
      message: `JWT_SECRET too short (${jwtLength} chars). Minimum 32 required for production.`,
    });
  } else if (envType === 'staging' && jwtLength < 16) {
    checks.push({
      name: 'JWT_SECRET Security',
      passed: false,
      message: `JWT_SECRET too short (${jwtLength} chars). Minimum 16 recommended for staging.`,
    });
  } else {
    checks.push({
      name: 'JWT_SECRET Security',
      passed: true,
      message: `JWT_SECRET length: ${jwtLength} characters`,
    });
  }

  // Check DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL || '';
  const hasSSL = dbUrl.includes('ssl=true') || dbUrl.includes('sslMode=REQUIRE');
  if (envType === 'production' && !hasSSL) {
    checks.push({
      name: 'DATABASE_URL SSL/TLS',
      passed: false,
      message: 'SSL/TLS not enabled. Add ?ssl=true to DATABASE_URL for production.',
    });
  } else {
    checks.push({
      name: 'DATABASE_URL SSL/TLS',
      passed: hasSSL,
      message: hasSSL ? 'SSL/TLS enabled' : 'SSL/TLS not enabled (acceptable for dev)',
    });
  }

  // Check OPENAI_API_KEY format
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const isValidOpenaiKey = openaiKey.startsWith('sk-');
  checks.push({
    name: 'OPENAI_API_KEY Format',
    passed: isValidOpenaiKey,
    message: isValidOpenaiKey ? 'Valid OpenAI key format' : 'Invalid format (should start with sk-)',
  });

  return checks;
}

function validateURLs() {
  const checks = [];
  const urlVars = [
    'OAUTH_SERVER_URL',
    'BUILT_IN_FORGE_API_URL',
    'VITE_OAUTH_PORTAL_URL',
    'VITE_FRONTEND_FORGE_API_URL',
    'VITE_ANALYTICS_ENDPOINT',
    'NEXT_PUBLIC_SUPABASE_URL',
  ];

  urlVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      try {
        new URL(value);
        checks.push({
          name: `${varName} Format`,
          passed: true,
          message: 'Valid URL',
        });
      } catch (e) {
        checks.push({
          name: `${varName} Format`,
          passed: false,
          message: `Invalid URL format: ${value}`,
        });
      }
    }
  });

  return checks;
}

async function main() {
  logSection(`Environment Validation - ${NODE_ENV.toUpperCase()}`);

  const envConfig = envRequirements[NODE_ENV];
  logInfo(`${envConfig.description}`);
  logInfo(`Security Level: ${colors.bold}${envConfig.minSecurityLevel.toUpperCase()}${colors.reset}`);

  // Validate required variables
  logSection('Required Variables');
  const requiredResult = baseSchema.safeParse(process.env);

  if (requiredResult.success) {
    logSuccess('All required variables are present and valid');
  } else {
    logError('Required variables validation failed:');
    requiredResult.error.issues.forEach(issue => {
      logError(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  // Validate optional variables
  logSection('Optional Variables');
  const optionalResult = optionalSchema.safeParse(process.env);

  if (optionalResult.success) {
    const configured = Object.entries(process.env)
      .filter(([key]) => optionalSchema.shape[key])
      .length;
    logSuccess(`${configured} optional variables configured`);
  } else {
    optionalResult.error.issues.forEach(issue => {
      logWarning(`  ${issue.path.join('.')}: ${issue.message}`);
    });
  }

  // Validate credential security
  logSection('Security Checks');
  const securityChecks = validateCredentialSecurity(NODE_ENV);
  const urlChecks = validateURLs();
  const allChecks = [...securityChecks, ...urlChecks];

  let passedChecks = 0;
  allChecks.forEach(check => {
    if (check.passed) {
      logSuccess(`${check.name}: ${check.message}`);
      passedChecks++;
    } else {
      logError(`${check.name}: ${check.message}`);
    }
  });

  // Environment-specific notes
  logSection(`${NODE_ENV.toUpperCase()} Environment Notes`);
  envConfig.notes.forEach(note => {
    logInfo(note);
  });

  // Feature availability
  logSection('Feature Availability');
  const features = {
    openai: !!process.env.OPENAI_API_KEY,
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    analytics: !!process.env.VITE_ANALYTICS_ENDPOINT && !!process.env.VITE_ANALYTICS_WEBSITE_ID,
  };

  Object.entries(features).forEach(([feature, available]) => {
    if (available) {
      logSuccess(`${feature.charAt(0).toUpperCase() + feature.slice(1)}: Enabled`);
    } else {
      logWarning(`${feature.charAt(0).toUpperCase() + feature.slice(1)}: Disabled`);
    }
  });

  // Summary
  logSection('Summary');
  const totalChecks = allChecks.length;
  const passRate = ((passedChecks / totalChecks) * 100).toFixed(0);

  if (passedChecks === totalChecks && requiredResult.success) {
    log(`\n✓ All validations passed (${passedChecks}/${totalChecks})`, 'green');
    log(`\n✓ Environment is ready for ${NODE_ENV}`, 'green');
    log('\nServer can start safely.\n', 'green');
    process.exit(0);
  } else {
    log(`\n✗ Some validations failed (${passedChecks}/${totalChecks})`, 'red');
    log('\n⚠ Please fix the issues above before starting the server.\n', 'yellow');
    process.exit(1);
  }
}

main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

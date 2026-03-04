/**
 * Jest Setup File
 *
 * Global test configuration and utilities
 */

// Suppress console output during tests unless debugging
if (process.env.DEBUG !== 'true') {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'debug').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
}

// Set test timeout to 10 seconds
jest.setTimeout(10000);

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-key-12345';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/test_db';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.OPENAI_ORG_ID = 'test-org';
process.env.OPENAI_PROJECT_ID = 'test-project';
process.env.ELEVEN_LABS_API_KEY = 'test-elevenlabs-key';
process.env.VAPI_API_KEY = 'test-vapi-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET = 'test-bucket';

// Global test utilities
global.testUtils = {
  /**
   * Generate a random user ID
   */
  generateUserId: () =>
    `user-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generate a random session ID
   */
  generateSessionId: () =>
    `session-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Generate a random scenario ID
   */
  generateScenarioId: () =>
    `scenario-${Math.random().toString(36).substr(2, 9)}`,

  /**
   * Wait for specified milliseconds
   */
  wait: (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Mock JWT token
   */
  generateMockToken: (userId: string) => {
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    )
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        email: 'test@example.com',
        role: 'AGENT',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      }),
    )
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // In real tests, use JwtService to generate proper tokens
    return `${header}.${payload}.signature`;
  },
};

declare global {
  namespace NodeJS {
    interface Global {
      testUtils: {
        generateUserId: () => string;
        generateSessionId: () => string;
        generateScenarioId: () => string;
        wait: (ms: number) => Promise<void>;
        generateMockToken: (userId: string) => string;
      };
    }
  }
}

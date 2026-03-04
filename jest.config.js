module.exports = {
  displayName: 'trainingproject',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/?(*.)+(spec|test).ts',
  ],
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'server/**/*.(t|j)s',
    '!server/**/*.spec.ts',
    '!server/**/__tests__/**',
    '!server/**/index.ts',
    '!server/**/*.module.ts',
    '!server/**/*.gateway.ts',
    '!server/**/*.interface.ts',
    '!server/**/*.dto.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/server/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};

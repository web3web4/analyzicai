/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', 'providers-copilot.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Direct mapping for pnpm's symlinked @github/copilot-sdk
    '^@github/copilot-sdk$': '<rootDir>/node_modules/.pnpm/@github+copilot-sdk@0.1.16/node_modules/@github/copilot-sdk',
  },
  modulePaths: ['<rootDir>/node_modules'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 60000,
  transformIgnorePatterns: [
    // Allow transformation of @github packages
    'node_modules/(?!(@github)/)',
  ],
};

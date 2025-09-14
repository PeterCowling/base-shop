/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');
const baseConfig = require('../../jest.config.cjs');
module.exports = {
  ...baseConfig,
  rootDir: path.resolve(__dirname, '..', '..'),
  roots: ['<rootDir>/packages/email'],
  // Limit coverage to this package and exclude declarations/tests
  collectCoverageFrom: [
    "packages/email/src/**/*.{ts,tsx}",
    "!packages/email/src/**/*.d.ts",
    "!packages/email/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!packages/email/src/**/__tests__/**",
  ],
  // Inherit ignore patterns from the root config so other apps/packages are excluded
  coveragePathIgnorePatterns: baseConfig.coveragePathIgnorePatterns,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^\\./fsStore\\.js$': '<rootDir>/packages/email/src/storage/fsStore.ts',
    '^\\./types\\.js$': '<rootDir>/packages/email/src/storage/types.ts',
    '^\\./storage/(.*)\\.js$': '<rootDir>/packages/email/src/storage/$1.ts',
    '^\\./providers/(.*)\\.js$': '<rootDir>/packages/email/src/providers/$1.ts',
    '^\\./stats\\.js$': '<rootDir>/packages/email/src/stats.ts',
  },
};

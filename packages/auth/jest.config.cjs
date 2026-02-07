/* eslint-disable @typescript-eslint/no-require-imports */
// Auth package uses real env loaders instead of test mocks
// and has specific files to exclude from coverage
module.exports = require("@acme/config/jest.preset.cjs")({
  useRealEnvLoaders: true,
  coveragePathIgnorePatterns: [
    "<rootDir>/src/sessionDurableStore.ts",
    "<rootDir>/src/rateLimiter.ts",
  ],
});

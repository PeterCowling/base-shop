const path = require("path");

module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "scripts/**/*.{ts,tsx}",
    "functions/**/*.ts",
    "middleware.ts",
    "packages/*/middleware.ts",
    "*.{ts,tsx}",
    "!**/__tests__/**",
    "!**/*.d.ts",
    "!**/*.stories.{ts,tsx}",
    "!**/devtools/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
  ],
  coverageDirectory: path.join(process.cwd(), "coverage"),
  coveragePathIgnorePatterns: [
    " /test/msw/",
    " /test/msw/server.ts",
    "<rootDir>/test/mswServer.ts",
    "<rootDir>/test/resetNextMocks.ts",
    "<rootDir>/test/setupFetchPolyfill.ts",
    "<rootDir>/test/setupTests.ts",
    "<rootDir>/test/reactDomClientShim.ts",
    "<rootDir>/test/polyfills/",
    "<rootDir>/test/__mocks__/",
    " /packages/config/src/env/__tests__/",
    "src/.*\\.schema\\.ts$",
  ],
  // Include per-file breakdown in terminal output while retaining
  // machine-readable (json) and HTML-friendly (lcov) formats.
  coverageReporters: ["text", "text-summary", "lcov", "json"],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
    },
  },
};

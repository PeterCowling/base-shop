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
  // Use concise terminal output to avoid misaligned tables when running
  // across many packages. Full HTML and lcov remain available.
  coverageReporters: ["text-summary", "lcov", "json"],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
    },
  },
};

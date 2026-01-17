const path = require("path");
const { TIERS } = require("./packages/config/coverage-tiers.cjs");

/**
 * Base coverage configuration for the monorepo.
 *
 * Coverage thresholds are defined in packages/config/coverage-tiers.cjs.
 * This file uses TIERS.STANDARD (80%) as the default. Individual packages
 * can override by using getTier() in their jest.config.cjs.
 *
 * Tiers:
 *   CRITICAL (90%): @acme/stripe, @acme/auth, @acme/platform-core
 *   STANDARD (80%): All other packages (default)
 *   MINIMAL  (0%):  @acme/types, @acme/templates, scripts
 *
 * See docs/test-coverage-policy.md for the full policy.
 */
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
  coverageReporters: ["text", "text-summary", "lcov", "json", "json-summary"],
  // Default to STANDARD tier (80%). Packages override via coverage-tiers.cjs.
  coverageThreshold: TIERS.STANDARD,
};

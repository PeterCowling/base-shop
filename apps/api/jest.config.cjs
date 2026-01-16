/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

// Rollback wrapper: use new preset by default, fall back to old preset if needed
const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  // NEW PRESET CONFIGURATION
  const { react, coverageTiers } = require("@acme/config/jest-presets");

  // Filter out /apps/ pattern from any inherited coveragePathIgnorePatterns
  const coveragePathIgnorePatterns = (react.coveragePathIgnorePatterns || []).filter(
    (pattern) => pattern !== "/apps/"
  );

  // Fix moduleNameMapper paths: replace leading space with <rootDir>
  // TODO: Phase 2 should fix preset to use <rootDir> directly
  const fixedModuleNameMapper = {};
  for (const [pattern, value] of Object.entries(react.moduleNameMapper || {})) {
    if (typeof value === "string" && value.startsWith(" /")) {
      fixedModuleNameMapper[pattern] = `<rootDir>${value.substring(1)}`;
    } else {
      fixedModuleNameMapper[pattern] = value;
    }
  }

  /** @type {import('jest').Config} */
  module.exports = {
    ...react,
    // Override to use node environment even though we use react preset (for React mappings)
    // API tests use @testing-library/react but don't need DOM environment
    testEnvironment: "node",
    // Override rootDir to point to workspace root (react preset sets it to process.cwd())
    rootDir: path.resolve(__dirname, "..", ".."),
    // Run from the workspace root but limit tests and coverage to the API app
    roots: ["<rootDir>/apps/api/src", "<rootDir>/apps/api/__tests__"],
    setupFilesAfterEnv: [
      ...(react.setupFilesAfterEnv || []),
      "<rootDir>/apps/api/jest.setup.ts",
    ],
    // Use fixed module mapper with <rootDir> instead of leading space
    moduleNameMapper: fixedModuleNameMapper,
    collectCoverage: true,
    collectCoverageFrom: [
      "apps/api/src/**/*.{ts,tsx}",
      "!apps/api/src/**/*.d.ts",
      "!apps/api/src/**/?(*.)+(spec|test).{ts,tsx}",
      "!apps/api/src/**/__tests__/**",
    ],
    coveragePathIgnorePatterns,
    coverageReporters: ["text", "json", "lcov"],
    // Custom threshold: branches: 90 (stricter than standard tier)
    coverageThreshold: {
      global: {
        branches: 90,
      },
    },
  };
} else {
  // FALLBACK: Old preset configuration
  const preset = require("@acme/config/jest.preset.cjs");
  module.exports = {
    ...preset,
    roots: ["<rootDir>/apps/api/src", "<rootDir>/apps/api/__tests__"],
    setupFilesAfterEnv: [
      ...(preset.setupFilesAfterEnv || []),
      "<rootDir>/apps/api/jest.setup.ts",
    ],
    collectCoverage: true,
    collectCoverageFrom: [
      "apps/api/src/**/*.{ts,tsx}",
      "!apps/api/src/**/*.d.ts",
      "!apps/api/src/**/?(*.)+(spec|test).{ts,tsx}",
      "!apps/api/src/**/__tests__/**",
    ],
    coverageReporters: ["text", "json", "lcov"],
    coverageThreshold: {
      global: {
        branches: 90,
      },
    },
  };
}

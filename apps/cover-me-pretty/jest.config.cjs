/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

// Rollback wrapper: use new preset by default, fall back to old preset if needed
const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  // NEW PRESET CONFIGURATION
  const { react, coverageTiers } = require("@acme/config/jest-presets");

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
    rootDir: path.resolve(__dirname, "..", ".."),
    // Use fixed module mapper with <rootDir> instead of leading space
    moduleNameMapper: fixedModuleNameMapper,
    roots: [
      "<rootDir>/apps/cover-me-pretty/src",
      "<rootDir>/apps/cover-me-pretty/__tests__"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
      "apps/cover-me-pretty/src/**/*.{ts,tsx}",
      "!apps/cover-me-pretty/src/**/*.d.ts",
      "!apps/cover-me-pretty/src/**/?(*.)+(spec|test).{ts,tsx}",
      "!apps/cover-me-pretty/src/**/__tests__/**",
    ],
    coveragePathIgnorePatterns: react.coveragePathIgnorePatterns || [],
    coverageReporters: ["text", "lcov"],
    // Uses default coverage threshold from react preset (or can specify tier)
    // coverageThreshold: coverageTiers.standard,
  };
} else {
  // FALLBACK: Old preset configuration
  const preset = require("@acme/config/jest.preset.cjs");
  module.exports = {
    ...preset,
    roots: [
      "<rootDir>/apps/cover-me-pretty/src",
      "<rootDir>/apps/cover-me-pretty/__tests__"
    ],
    collectCoverage: true,
    collectCoverageFrom: [
      "apps/cover-me-pretty/src/**/*.{ts,tsx}",
      "!apps/cover-me-pretty/src/**/*.d.ts",
      "!apps/cover-me-pretty/src/**/?(*.)+(spec|test).{ts,tsx}",
      "!apps/cover-me-pretty/src/**/__tests__/**",
    ],
    coverageReporters: ["text", "lcov"],
  };
}

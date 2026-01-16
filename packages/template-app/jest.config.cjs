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
    // Override rootDir to point to workspace root (react preset sets it to process.cwd())
    rootDir: path.resolve(__dirname, "..", ".."),
    // Use fixed module mapper with <rootDir> instead of leading space
    moduleNameMapper: fixedModuleNameMapper,
    // Limit coverage to this package so thresholds reflect template-app code
    collectCoverageFrom: [
      "packages/template-app/src/**/*.{ts,tsx}",
      "!**/__tests__/**",
      "!**/*.d.ts",
      "!**/*.test.{ts,tsx}",
      "!**/*.spec.{ts,tsx}",
    ],
    roots: [
      "<rootDir>/packages/template-app/src",
      "<rootDir>/packages/template-app/__tests__"
    ],
    // Uses default coverage threshold from react preset (or can specify tier)
    // coverageThreshold: coverageTiers.standard,
  };
} else {
  // FALLBACK: Old preset configuration
  const preset = require("@acme/config/jest.preset.cjs");
  module.exports = {
    ...preset,
    collectCoverageFrom: [
      "packages/template-app/src/**/*.{ts,tsx}",
      "!**/__tests__/**",
      "!**/*.d.ts",
      "!**/*.test.{ts,tsx}",
      "!**/*.spec.{ts,tsx}",
    ],
    roots: [
      "<rootDir>/packages/template-app/src",
      "<rootDir>/packages/template-app/__tests__"
    ],
  };
}

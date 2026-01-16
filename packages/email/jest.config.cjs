/* eslint-disable @typescript-eslint/no-require-imports */
const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  const path = require("path");
  const { react } = require("@acme/config/jest-presets");
  const { resolveRoot } = require("../../jest.config.helpers.cjs");

  module.exports = resolveRoot({
    ...react,
    // Override rootDir to point to monorepo root (needed for module mappings)
    rootDir: path.resolve(__dirname, "..", ".."),
    roots: ["<rootDir>/packages/email"],
    collectCoverageFrom: [
      "packages/email/src/**/*.{ts,tsx}",
      "!packages/email/src/**/*.d.ts",
      "!packages/email/src/**/?(*.)+(spec|test).{ts,tsx}",
      "!packages/email/src/**/__tests__/**",
    ],
    // Preserve package-specific module name mappings
    moduleNameMapper: {
      ...react.moduleNameMapper,
      "^\\./fsStore\\.js$": "<rootDir>/packages/email/src/storage/fsStore.ts",
      "^\\./types\\.js$": "<rootDir>/packages/email/src/storage/types.ts",
      "^\\./storage/(.*)\\.js$": "<rootDir>/packages/email/src/storage/$1.ts",
      "^\\./providers/(.*)\\.js$": "<rootDir>/packages/email/src/providers/$1.ts",
      "^\\./stats\\.js$": "<rootDir>/packages/email/src/stats.ts",
    },
  });
} else {
  // Fallback to root config
  const path = require("path");
  const baseConfig = require("../../jest.config.cjs");
  module.exports = {
    ...baseConfig,
    rootDir: path.resolve(__dirname, "..", ".."),
    roots: ["<rootDir>/packages/email"],
    collectCoverageFrom: [
      "packages/email/src/**/*.{ts,tsx}",
      "!packages/email/src/**/*.d.ts",
      "!packages/email/src/**/?(*.)+(spec|test).{ts,tsx}",
      "!packages/email/src/**/__tests__/**",
    ],
    coveragePathIgnorePatterns: baseConfig.coveragePathIgnorePatterns,
    moduleNameMapper: {
      ...baseConfig.moduleNameMapper,
      "^\\./fsStore\\.js$": "<rootDir>/packages/email/src/storage/fsStore.ts",
      "^\\./types\\.js$": "<rootDir>/packages/email/src/storage/types.ts",
      "^\\./storage/(.*)\\.js$": "<rootDir>/packages/email/src/storage/$1.ts",
      "^\\./providers/(.*)\\.js$": "<rootDir>/packages/email/src/providers/$1.ts",
      "^\\./stats\\.js$": "<rootDir>/packages/email/src/stats.ts",
    },
  };
}

/* eslint-disable @typescript-eslint/no-var-requires */
// Use the monorepo base Jest config, then tailor it for the dashboard app.

const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  const path = require("path");
  const { react } = require("@acme/config/jest-presets");
  const { resolveRoot } = require("../../jest.config.helpers.cjs");

  process.env.JEST_FORCE_CJS = "1";
  process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";
  process.env.BROWSERSLIST_DISABLE_CACHE = "1";

  /** @type {import('jest').Config} */
  module.exports = resolveRoot({
    ...react,
    rootDir: path.resolve(__dirname, "..", ".."),
    roots: ["<rootDir>/apps/dashboard/src", "<rootDir>/apps/dashboard/__tests__"],
    testEnvironment: "jsdom",
    moduleNameMapper: {
      ...react.moduleNameMapper,
      // Local alias used by this app
      "^@/(.*)$": "<rootDir>/apps/dashboard/src/$1",
      // Needed by some transitive deps when running under jsdom
      "^entities/decode$": "<rootDir>/node_modules/entities/lib/decode.js",
    },
    // App-specific coverage settings
    collectCoverage: true,
    collectCoverageFrom: [
      "apps/dashboard/src/**/*.{ts,tsx}",
      "!**/*.d.ts",
      "!**/?(*.)+(spec|test).{ts,tsx}",
      "!**/__tests__/**",
    ],
    // Ensure per-file breakdown is printed to the console
    coverageReporters: ["text", "text-summary", "lcov", "json"],
    // Do not enforce global thresholds for this app unless explicitly desired
    coverageThreshold: undefined,
  });
} else {
  process.env.JEST_FORCE_CJS = "1";
  process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";
  process.env.BROWSERSLIST_DISABLE_CACHE = "1";
  const base = require("../../jest.config.cjs");

  /** @type {import('jest').Config} */
  module.exports = {
    ...base,
    // Keep rootDir as the app directory so coverage globs resolve correctly.
    // The base config already sets rootDir to process.cwd().
    rootDir: __dirname,
    testEnvironment: "jsdom",
    roots: ["<rootDir>/src", "<rootDir>/__tests__"],
    moduleNameMapper: {
      ...base.moduleNameMapper,
      // Local alias used by this app
      "^@/(.*)$": "<rootDir>/src/$1",
      // Needed by some transitive deps when running under jsdom
      "^entities/decode$": "<rootDir>/../../node_modules/entities/lib/decode.js",
    },
    // App-specific coverage settings
    collectCoverage: true,
    collectCoverageFrom: [
      "src/**/*.{ts,tsx}",
      "!**/*.d.ts",
      "!**/?(*.)+(spec|test).{ts,tsx}",
      "!**/__tests__/**",
    ],
    // Ensure per-file breakdown is printed to the console
    coverageReporters: ["text", "text-summary", "lcov", "json"],
    // Do not enforce global thresholds for this app unless explicitly desired
    coverageThreshold: undefined,
  };
}

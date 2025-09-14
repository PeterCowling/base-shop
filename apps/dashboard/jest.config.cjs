/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("@acme/config/jest.preset.cjs");
const { "^@/(.*)$": _unused, ...baseModuleNameMapper } = base.moduleNameMapper;

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  // Run from repo root for consistent relative paths
  rootDir: path.resolve(__dirname, "..", ".."),
  testEnvironment: "jsdom",
  roots: ["<rootDir>/apps/dashboard/src", "<rootDir>/apps/dashboard/__tests__"],
  moduleNameMapper: {
    ...baseModuleNameMapper,
    "^@/(.*)$": "<rootDir>/apps/dashboard/src/$1",
    "^entities/decode$": "<rootDir>/node_modules/entities/lib/decode.js",
  },
  // Restrict coverage to dashboard src and ignore tests/declarations
  collectCoverage: true,
  collectCoverageFrom: [
    "apps/dashboard/src/**/*.{ts,tsx}",
    "!apps/dashboard/src/**/*.d.ts",
    "!apps/dashboard/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!apps/dashboard/src/**/__tests__/**",
  ],
  // Reuse preset’s ignore patterns so other apps/packages aren’t instrumented
  coveragePathIgnorePatterns: base.coveragePathIgnorePatterns,
  coverageReporters: ["text", "lcov"],
};

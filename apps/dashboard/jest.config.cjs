/* eslint-disable @typescript-eslint/no-var-requires */
// Use the monorepo base Jest config, then tailor it for the dashboard app.
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
  coverageReporters: ["text-summary", "lcov", "json"],
  // Do not enforce global thresholds for this app unless explicitly desired
  coverageThreshold: undefined,
};

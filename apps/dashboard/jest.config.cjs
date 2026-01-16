/* eslint-disable @typescript-eslint/no-var-requires */
// Use the monorepo preset with CJS mode for the dashboard app.
process.env.BROWSERSLIST_IGNORE_OLD_DATA = "1";
process.env.BROWSERSLIST_DISABLE_CACHE = "1";
const base = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
});

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

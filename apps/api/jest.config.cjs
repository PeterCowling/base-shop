/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs")();

const coveragePathIgnorePatterns = base.coveragePathIgnorePatterns.filter(
  (pattern) => pattern !== "/apps/"
);

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  // Run from the workspace root but limit tests and coverage to the API app
  roots: ["<rootDir>/apps/api/src", "<rootDir>/apps/api/__tests__"],
  testEnvironment: "node",
  setupFilesAfterEnv: [
    ...(base.setupFilesAfterEnv || []),
    "<rootDir>/apps/api/jest.setup.ts",
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "apps/api/src/**/*.{ts,tsx}",
    "!apps/api/src/**/*.d.ts",
    "!apps/api/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!apps/api/src/**/__tests__/**",
  ],
  coveragePathIgnorePatterns,
  coverageReporters: ["text", "json", "lcov"],
  coverageThreshold: {
    global: {
      branches: 90,
    },
  },
};

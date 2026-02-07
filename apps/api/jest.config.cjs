/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs")();

const coveragePathIgnorePatterns = base.coveragePathIgnorePatterns.filter(
  (pattern) => pattern !== "/apps/"
);

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  // Run from the workspace root but limit tests and coverage to the API app
  roots: ["<rootDir>/src", "<rootDir>/__tests__"],
  testEnvironment: "node",
  setupFilesAfterEnv: [
    ...(base.setupFilesAfterEnv || []),
    "<rootDir>/jest.setup.ts",
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/?(*.)+(spec|test).{ts,tsx}",
    "!src/**/__tests__/**",
  ],
  coveragePathIgnorePatterns,
  coverageReporters: ["text", "json", "lcov"],
  coverageThreshold: {
    global: {
      branches: 90,
    },
  },
};

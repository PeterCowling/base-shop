/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs")();

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: __dirname,
  // Limit coverage to this package so thresholds reflect template-app code
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts,tsx}",
    "!**/__tests__/**",
    "!**/*.d.ts",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
  ],
  roots: [
    "<rootDir>/src",
    "<rootDir>/__tests__"
  ],
};

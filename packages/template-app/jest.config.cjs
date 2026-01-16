/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs")();

/** @type {import('jest').Config} */
module.exports = {
  ...base,
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
};

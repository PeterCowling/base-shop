/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("@acme/config/jest.preset.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: [
    "<rootDir>/apps/shop-bcd/src",
    "<rootDir>/apps/shop-bcd/__tests__"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "apps/shop-bcd/src/**/*.{ts,tsx}",
    "!apps/shop-bcd/src/**/*.d.ts",
    "!apps/shop-bcd/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!apps/shop-bcd/src/**/__tests__/**",
  ],
  coveragePathIgnorePatterns: base.coveragePathIgnorePatterns,
  coverageReporters: ["text", "lcov"],
};

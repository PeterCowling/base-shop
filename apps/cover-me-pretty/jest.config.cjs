/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

// Cover-me-pretty uses CJS preset for Next.js stability
const base = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
});

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: [
    "<rootDir>/apps/cover-me-pretty/src",
    "<rootDir>/apps/cover-me-pretty/__tests__"
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    "apps/cover-me-pretty/src/**/*.{ts,tsx}",
    "!apps/cover-me-pretty/src/**/*.d.ts",
    "!apps/cover-me-pretty/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!apps/cover-me-pretty/src/**/__tests__/**",
  ],
  coveragePathIgnorePatterns: base.coveragePathIgnorePatterns,
  coverageReporters: ["text", "lcov"],
};

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const baseConfig = require("../../jest.config.cjs");
module.exports = {
  ...baseConfig,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: ["<rootDir>/packages/tailwind-config"],
  // Restrict coverage to this package only and exclude declarations/tests
  collectCoverageFrom: [
    "packages/tailwind-config/src/**/*.{ts,tsx}",
    "!packages/tailwind-config/src/**/*.d.ts",
    "!packages/tailwind-config/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!packages/tailwind-config/src/**/__tests__/**",
  ],
  coveragePathIgnorePatterns: baseConfig.coveragePathIgnorePatterns,
};

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const baseConfig = require("@acme/config/jest.preset.cjs")();

module.exports = {
  ...baseConfig,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: ["<rootDir>/packages/types"],
  collectCoverageFrom: [
    "packages/types/src/**/*.{ts,tsx}",
    "!packages/types/src/**/*.d.ts",
    "!packages/types/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!packages/types/src/**/__tests__/**",
  ],
  coveragePathIgnorePatterns: [
    ...baseConfig.coveragePathIgnorePatterns,
    "<rootDir>/packages/types/src/.*\\.schema\\.ts$",
  ],
};

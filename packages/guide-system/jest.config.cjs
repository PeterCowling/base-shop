/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const baseConfig = require("@acme/config/jest.preset.cjs")();

module.exports = {
  ...baseConfig,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: ["<rootDir>/packages/guide-system"],
  collectCoverageFrom: [
    "packages/guide-system/src/**/*.{ts,tsx}",
    "!packages/guide-system/src/**/*.d.ts",
    "!packages/guide-system/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!packages/guide-system/src/**/__tests__/**",
  ],
};

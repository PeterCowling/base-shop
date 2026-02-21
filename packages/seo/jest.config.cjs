/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const baseConfig = require("@acme/config/jest.preset.cjs")();

module.exports = {
  ...baseConfig,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: ["<rootDir>/packages/seo"],
  collectCoverageFrom: [
    "packages/seo/src/**/*.{ts,tsx}",
    "!packages/seo/src/**/*.d.ts",
    "!packages/seo/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!packages/seo/src/**/__tests__/**",
  ],
};

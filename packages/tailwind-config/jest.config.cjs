/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const baseConfig = require("../../jest.config.cjs");
module.exports = {
  ...baseConfig,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: ["<rootDir>/packages/tailwind-config"],
  collectCoverageFrom: ["packages/tailwind-config/src/**/*.{ts,tsx}"],
  coveragePathIgnorePatterns: ["/packages/(?!tailwind-config)/", "/apps/"],
};

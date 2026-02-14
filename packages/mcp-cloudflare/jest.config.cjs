/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const baseConfig = require("@acme/config/jest.preset.cjs")();

module.exports = {
  ...baseConfig,
  rootDir: path.resolve(__dirname, "..", ".."),
  roots: ["<rootDir>/packages/mcp-cloudflare"],
  collectCoverageFrom: [
    "packages/mcp-cloudflare/src/**/*.{ts,tsx}",
    "!packages/mcp-cloudflare/src/**/*.d.ts",
    "!packages/mcp-cloudflare/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!packages/mcp-cloudflare/src/**/__tests__/**",
  ],
};


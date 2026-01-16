/* eslint-disable @typescript-eslint/no-require-imports */
const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  const path = require("path");
  const { react } = require("@acme/config/jest-presets");
  const { resolveRoot } = require("../../jest.config.helpers.cjs");

  module.exports = resolveRoot({
    ...react,
    // Override rootDir to point to monorepo root (needed for module mappings)
    rootDir: path.resolve(__dirname, "..", ".."),
    roots: ["<rootDir>/packages/page-builder-core"],
  });
} else {
  // Fallback to root config
  const base = require("../../jest.config.cjs");
  module.exports = { ...base };
}


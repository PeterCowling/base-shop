/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config to supplement monorepo defaults with a root
// config mock for @acme/config, preventing ESM stub issues in tests that
// import through that package entrypoint.

const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  const path = require("path");
  const { react } = require("@acme/config/jest-presets");
  const { resolveRoot } = require("../../jest.config.helpers.cjs");

  module.exports = resolveRoot({
    ...react,
    rootDir: path.resolve(__dirname, "..", ".."),
    roots: ["<rootDir>/packages/platform-core"],
    // Map root `@acme/config` to the same core env mock used elsewhere
    moduleNameMapper: {
      ...react.moduleNameMapper,
      "^@acme/config$": " /test/mocks/config-root.ts",
    },
  });
} else {
  const base = require("../../jest.config.cjs");
  const { resolveRoot } = require("../../jest.config.helpers.cjs");

  const config = { ...base };
  config.moduleNameMapper = { ...(base.moduleNameMapper || {}) };
  // Map root `@acme/config` to the same core env mock used elsewhere
  config.moduleNameMapper["^@acme/config$"] = " /test/mocks/config-root.ts";

  module.exports = resolveRoot(config);
}

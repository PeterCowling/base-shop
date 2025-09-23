/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config to supplement monorepo defaults with a root
// config mock for @acme/config, preventing ESM stub issues in tests that
// import through that package entrypoint.
const base = require("../../jest.config.cjs");
const { resolveRoot } = require("../../jest.config.helpers.cjs");

const config = { ...base };
config.moduleNameMapper = { ...(base.moduleNameMapper || {}) };
// Map root `@acme/config` to the same core env mock used elsewhere
config.moduleNameMapper["^@acme/config$"] = " /test/mocks/config-root.ts";

module.exports = resolveRoot(config);

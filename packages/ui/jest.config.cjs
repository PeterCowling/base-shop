/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config allowing local overrides to reduce flakiness
// for targeted runs. Inherit the monorepo config and optionally relax
// coverage thresholds via env var.

const base = require("../../jest.config.cjs");

// Clone to avoid mutating the shared object
const config = { ...base, coverageThreshold: { ...(base.coverageThreshold || {}) } };

if (process.env.JEST_DISABLE_COVERAGE_THRESHOLD === "1") {
  config.coverageThreshold = {
    global: { lines: 0, branches: 0, functions: 0 },
  };
}

module.exports = config;


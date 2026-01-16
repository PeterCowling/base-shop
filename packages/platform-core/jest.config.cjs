/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config - uses CJS preset and adds root config mock
// to prevent ESM stub issues in tests that import through @acme/config.
const config = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
  moduleNameMapper: {
    // Map root `@acme/config` to the same core env mock used elsewhere
    "^@acme/config$": " /test/mocks/config-root.ts",
  },
});

module.exports = config;

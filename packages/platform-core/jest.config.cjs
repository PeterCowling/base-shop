/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config - uses CJS preset and adds root config mock
// to prevent ESM stub issues in tests that import through @acme/config.
const config = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
  moduleNameMapper: {
    // Map root `@acme/config` to the same core env mock used elsewhere
    "^@acme/config$": " /test/mocks/config-root.ts",
    // Map @acme/lib subpaths to source for tests
    "^@acme/lib/logger$": " /packages/lib/src/logger/index.server.ts",
    "^@acme/lib/format$": " /packages/lib/src/format/index.ts",
    "^@acme/lib/string$": " /packages/lib/src/string/index.ts",
    "^@acme/lib/security$": " /packages/lib/src/security/index.ts",
    "^@acme/lib/http$": " /packages/lib/src/http/index.ts",
  },
});

module.exports = config;

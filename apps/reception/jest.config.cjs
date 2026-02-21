/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

// Load .env.local so Firebase env vars are available in tests
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });

const config = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    "^@/(.*)$": [
      path.resolve(__dirname, "src/$1"),
      path.resolve(__dirname, "dist/$1"),
    ],
  },
});

// @acme/ui/context/modal/ imports environment.ts which uses import.meta;
// mock the entire modal context tree to avoid the parse error.
const modalMock = path.resolve(__dirname, "src/test/__mocks__/ui-modal-context.tsx");
config.moduleNameMapper["^@acme/ui/context/ModalContext$"] = modalMock;
config.moduleNameMapper["^@acme/ui/context/modal/(.*)$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/ModalContext$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/modal/hooks$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/modal/context$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/modal/provider$"] = modalMock;

// Add short timeout to fail fast if tests hang
config.testTimeout = 10000; // 10 seconds per test

module.exports = config;

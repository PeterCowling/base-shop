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

// SimpleModal uses Radix Dialog portal + focus trapping which conflicts with
// userEvent interactions on Radix Select components nested inside dialogs in
// JSDOM. Replace with a transparent passthrough wrapper for all reception tests.
const simpleModalMock = path.resolve(__dirname, "src/test/__mocks__/simple-modal.tsx");
config.moduleNameMapper["^@acme/ui/molecules$"] = simpleModalMock;
config.moduleNameMapper["^@acme/ui/molecules/SimpleModal$"] = simpleModalMock;

// Radix Select uses portals and pointer-event guards that prevent userEvent
// interactions in JSDOM. Replace with a native <select> wrapper so that
// userEvent.selectOptions and getByLabelText associations work correctly.
const radixSelectMock = path.resolve(__dirname, "src/test/__mocks__/radix-select.tsx");
config.moduleNameMapper["^@radix-ui/react-select$"] = radixSelectMock;
config.moduleNameMapper["^@acme/ui/context/modal/(.*)$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/ModalContext$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/modal/hooks$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/modal/context$"] = modalMock;
config.moduleNameMapper["(\\.\\.\\/)+context/modal/provider$"] = modalMock;

// Add short timeout to fail fast if tests hang
config.testTimeout = 10000; // 10 seconds per test

module.exports = config;

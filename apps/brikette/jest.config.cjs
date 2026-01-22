/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

// Brikette app needs custom @/ alias mapping for Jest
const config = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    // Standard @/ alias for brikette-local imports
    "^@/(.*)$": [
      path.resolve(__dirname, "src/$1"),
      path.resolve(__dirname, "dist/$1"),
    ],
  },
});

// Override module mapper - specific mocks must come BEFORE generic @/ pattern
// Jest processes patterns in order, so we need to restructure the mapper
const originalMapper = config.moduleNameMapper;
const newMapper = {};

// First: Add our specific mocks for config/env (both @/ alias and relative imports)
// The env module uses import.meta which Jest can't handle in CJS mode
const envMock = path.resolve(__dirname, "src/test/__mocks__/config-env.ts");
newMapper["^@/config/env$"] = envMock;
newMapper["^\\.+/config/env$"] = envMock; // Relative imports like ./config/env, ../config/env

// Then: Copy everything else, preserving the generic @/ at the end
for (const [key, value] of Object.entries(originalMapper)) {
  newMapper[key] = value;
}

config.moduleNameMapper = newMapper;

module.exports = config;

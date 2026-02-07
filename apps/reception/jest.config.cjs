/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

const config = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    "^@/(.*)$": [
      path.resolve(__dirname, "src/$1"),
      path.resolve(__dirname, "dist/$1"),
    ],
  },
});

// Add short timeout to fail fast if tests hang
config.testTimeout = 10000; // 10 seconds per test

module.exports = config;

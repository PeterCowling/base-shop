/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    "^@/(.*)$": path.resolve(__dirname, "src/$1"),
  },
});

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: ["<rootDir>/src"],
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/?(*.)+(spec|test).{ts,tsx}",
    "!src/**/__tests__/**",
  ],
};

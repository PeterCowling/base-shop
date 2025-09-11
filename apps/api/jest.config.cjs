/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: ["<rootDir>/apps/api/src", "<rootDir>/apps/api/__tests__"],
  testEnvironment: "node",
  setupFilesAfterEnv: [
    "<rootDir>/apps/api/jest.setup.ts",
  ],
  collectCoverageFrom: ["apps/api/src/**/*.{ts,tsx}", "!apps/api/src/**/*.d.ts"],
  coverageReporters: ["text", "json", "lcov"],
  coverageThreshold: {
    global: {
      branches: 90,
    },
  },
};

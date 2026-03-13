/* eslint-disable @typescript-eslint/no-var-requires */
const base = require("@acme/config/jest.preset.cjs")();

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  // Sets PAYMENT_MANAGER_E2E_ADMIN_TOKEN before module load so env.ts
  // skips strict validation in test environments (see src/lib/auth/env.ts).
  setupFiles: ["<rootDir>/jest.setup.ts"],
};

// /jest.config.cjs   ← keep this exact filename
/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Monorepo-wide Jest config (CommonJS flavour so Node can load it without
 * "type":"module").  Still runs the test *suite* in ESM mode via ts-jest.
 */

const { readFileSync } = require("fs");
const path = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");

// -----------------------------------------------------------------------
// 1️⃣  Pull tsconfig paths so we don't hand-maintain 30+ aliases
// -----------------------------------------------------------------------
const tsconfig = JSON.parse(
  readFileSync(path.resolve(__dirname, "tsconfig.json"), "utf8")
);
const tsPaths =
  tsconfig.compilerOptions && tsconfig.compilerOptions.paths
    ? pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
        prefix: "<rootDir>/",
      })
    : {};

// -----------------------------------------------------------------------
// 2️⃣  Jest configuration proper
// -----------------------------------------------------------------------
/** @type {import('jest').Config} */
module.exports = {
  // ts-jest *with* ESM so jose/next-auth work
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testEnvironment: "jsdom",

  // Global setup
  setupFiles: ["<rootDir>/test/setupFetchPolyfill.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Transform *all* JS/TS through ts-jest (including node_modules we whitelist)
  transform: {
    "^.+\\.[jt]sx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
        useESM: true,
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [
    // compile ESM-only deps instead of choking on them
    "/node_modules/(?!(jose|next-auth|ulid)/)",
  ],

  // Path aliases + quick shims for the old relative imports & fixtures
  moduleNameMapper: {
    ...tsPaths,

    // legacy relative imports still used inside tests
    "^\\.\\./repositories/(.*)$":
      "<rootDir>/packages/platform-core/src/repositories/$1",
    "^\\.\\./pricing$": "<rootDir>/packages/platform-core/src/pricing/index.ts",

    // fixture JSON moved during the Turbo 2 migration
    "^functions/data/rental/(.*)$":
      "<rootDir>/functions/data/_shared/rental/$1",

    // CSS stubs & Remix server-only stub
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^server-only$": "<rootDir>/test/server-only-stub.ts",
  },

  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  passWithNoTests: true,

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "mjs", "node"],

  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov"],

  rootDir: ".", // each workspace already passes  --config ../../jest.config.cjs
};

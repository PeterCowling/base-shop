/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config for @acme/design-system

const path = require("path");

// Use CJS preset for this package
const config = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
});

// Ensure ts-jest uses this package's local tsconfig
const baseTsTransform = config.transform && config.transform["^.+\\.(ts|tsx)$"];
const baseTsJestOptions = Array.isArray(baseTsTransform) ? baseTsTransform[1] : {};

config.transform = {
  ...config.transform,
  "^.+\\.(ts|tsx)$": [
    "ts-jest",
    {
      ...(baseTsJestOptions || {}),
      useESM: false,
      tsconfig: path.join(__dirname, "tsconfig.test.json"),
      isolatedModules: false,
      diagnostics: false,
    },
  ],
};

const disableCoverageThreshold = process.env.JEST_DISABLE_COVERAGE_THRESHOLD === "1";
if (disableCoverageThreshold) {
  config.coverageThreshold = {
    global: { lines: 0, branches: 0, functions: 0 },
  };
}

// Setup file for React Testing Library and jest-axe
config.setupFilesAfterEnv = [
  ...(config.setupFilesAfterEnv || []),
  require.resolve("./jest.setup.local.ts"),
];

// Ensure "@/..." resolves to design-system sources
// Also map test utility paths to monorepo root
const monoRepoRoot = path.resolve(__dirname, "../..");
config.moduleNameMapper = {
  ...(config.moduleNameMapper || {}),
  "^@/(.*)$": "<rootDir>/src/$1",
  "^@acme/design-system$": "<rootDir>/src/index",
  "^@acme/design-system/(.*)$": "<rootDir>/src/$1",
  // Map test utilities from any depth of relative imports
  "^(\\.\\./)+test/(.*)$": path.join(monoRepoRoot, "test/$2"),
};

// Transform additional ESM dependencies
config.transformIgnorePatterns = [
  "/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(jose|ulid|@acme)/)",
];

// Set roots to this package
config.roots = ["<rootDir>/src"];
config.rootDir = __dirname;

// Design system should have high coverage
if (!disableCoverageThreshold) {
  config.coverageThreshold = {
    global: {
      lines: 90,
      functions: 90,
      branches: 85,
    },
  };
}

module.exports = config;

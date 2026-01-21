/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config for @acme/cms-ui

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

// Setup file for React Testing Library
config.setupFilesAfterEnv = [
  ...(config.setupFilesAfterEnv || []),
];

// Ensure "@/..." resolves to cms-ui sources
config.moduleNameMapper = {
  ...(config.moduleNameMapper || {}),
  "^@/(.*)$": "<rootDir>/src/$1",
  "^@acme/cms-ui$": "<rootDir>/src/index",
  "^@acme/cms-ui/(.*)$": "<rootDir>/src/$1",
  "^@acme/design-system$": "<rootDir>/../design-system/src/index",
  "^@acme/design-system/(.*)$": "<rootDir>/../design-system/src/$1",
};

// Transform additional ESM dependencies
config.transformIgnorePatterns = [
  "/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(jose|ulid|@acme)/)",
];

// CMS UI can have lower threshold initially
if (!disableCoverageThreshold) {
  config.coverageThreshold = {
    global: {
      lines: 70,
      functions: 70,
      branches: 60,
    },
  };
}

module.exports = config;

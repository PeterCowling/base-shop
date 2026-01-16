/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

const USE_NEW_PRESET = process.env.JEST_USE_NEW_PRESET !== "0";

if (USE_NEW_PRESET) {
  // New preset-based configuration
  const { react } = require("@acme/config/jest-presets");
  const { resolveRoot } = require("../../jest.config.helpers.cjs");

  module.exports = resolveRoot({
    ...react,
    rootDir: path.resolve(__dirname, "..", ".."),
    roots: ["<rootDir>/apps/reception"],

    // Preserve local setup file for React globals
    setupFilesAfterEnv: [
      ...react.setupFilesAfterEnv,
      "<rootDir>/apps/reception/jest.setup.ts",
    ],

    // Preserve custom module mappings
    moduleNameMapper: {
      ...react.moduleNameMapper,
      // @/ path alias for src and dist directories
      "^@/(.*)$": [
        "<rootDir>/apps/reception/src/$1",
        "<rootDir>/apps/reception/dist/$1",
      ],
      // Vitest compatibility layer for migrated tests
      "^vitest$": "<rootDir>/apps/reception/test-utils/vitest-compat.ts",
      "^@testing-library/jest-dom/vitest$": "<rootDir>/apps/reception/test-utils/jest-dom-compat.ts",
    },

    // Preserve custom transform for ts-jest with AST transformers
    transform: {
      ...react.transform,
      "^.+\\.(ts|tsx)$": [
        "ts-jest",
        {
          tsconfig: "<rootDir>/apps/reception/tsconfig.json",
          useESM: false,
          diagnostics: false,
          babelConfig: false,
          astTransformers: {
            before: ["<rootDir>/apps/reception/test-utils/hoist-vi.cjs"],
          },
        },
      ],
    },
  });
} else {
  // Legacy configuration (rollback path)
  const base = require("../../jest.config.cjs");

  const moduleNameMapper = {
    ...base.moduleNameMapper,
    "^@/(.*)$": [
      path.join(__dirname, "src", "$1"),
      path.join(__dirname, "dist", "$1"),
    ],
    "^vitest$": path.join(__dirname, "test-utils", "vitest-compat.ts"),
    "^@testing-library/jest-dom/vitest$": path.join(
      __dirname,
      "test-utils",
      "jest-dom-compat.ts"
    ),
  };

  /** @type {import('jest').Config} */
  module.exports = {
    ...base,
    rootDir: __dirname,
    preset: "ts-jest",
    extensionsToTreatAsEsm: [],
    moduleNameMapper,
    transform: {
      ...base.transform,
      "^.+\\.(ts|tsx)$": [
        "ts-jest",
        {
          tsconfig: path.join(__dirname, "tsconfig.json"),
          useESM: false,
          diagnostics: false,
          babelConfig: false,
          astTransformers: {
            before: [path.join(__dirname, "test-utils", "hoist-vi.cjs")],
          },
        },
      ],
    },
  };
}
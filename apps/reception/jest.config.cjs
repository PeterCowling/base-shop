/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
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
        tsconfig: path.join(__dirname, "tsconfig.test.json"),
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
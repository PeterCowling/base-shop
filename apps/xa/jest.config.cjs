/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");

// XA uses the CJS preset to avoid ESM parsing of raw TS/TSX during Jest runs.
const base = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
});

const { "^@/(.*)$": _unused, ...baseModuleNameMapper } = base.moduleNameMapper;

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  // Run tests from the workspace root so relative paths resolve correctly.
  rootDir: path.resolve(__dirname, "..", ".."),
  testEnvironment: "jsdom",
  // Ensure TSX is transpiled as CJS by ts-jest.
  extensionsToTreatAsEsm: [],
  roots: ["<rootDir>/apps/xa/src"],
  moduleNameMapper: {
    ...baseModuleNameMapper,
    "^@/(.*)$": "<rootDir>/apps/xa/src/$1",
  },
  transform: {
    "^.+\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: path.resolve(__dirname, "tsconfig.test.json"),
        useESM: false,
        babelConfig: false,
        diagnostics: false,
      },
    ],
    "^.+\.(mjs|cjs|js)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }],
        ],
      },
    ],
  },
};

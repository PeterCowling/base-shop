/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("../../jest.config.cjs");

const workspaceRoot = path.resolve(__dirname, "../..");
const packageRoot = path.resolve(__dirname);
const packagePath = path
  .relative(workspaceRoot, packageRoot)
  .replace(/\\/g, "/");
const [scope, ...rest] = packagePath.split("/");
const subPath = rest.join("/");

const coveragePathIgnorePatterns = (base.coveragePathIgnorePatterns || []).filter(
  (pattern) =>
    !pattern.includes("/packages/config/src/env/__tests__/")
);
coveragePathIgnorePatterns.push(
  `/${scope}/(?!${subPath})/`,
  scope === "packages" ? "/apps/" : "/packages/"
);

const setupFilesAfterEnv = [
  ...(base.setupFilesAfterEnv || []),
  path.join(workspaceRoot, "test/setup-response-json.ts"),
];

const setupFiles = [
  ...(base.setupFiles || []),
  path.join(packageRoot, "test/setup-env.ts"),
];

const tsJestOptions = {
  tsconfig: path.join(packageRoot, "tsconfig.test.json"),
  useESM: false,
  diagnostics: false,
  babelConfig: false,
};

const transform = {
  "^.+\\.(ts|tsx)$": ["ts-jest", tsJestOptions],
  "^.+\\.[tj]sx?$": [
    "babel-jest",
    {
      presets: [["@babel/preset-env", { targets: { node: "current" }, modules: "commonjs" }]],
    },
  ],
};

/** @type {import('jest').Config} */
const config = {
  ...base,
  preset: "ts-jest/presets/js-with-ts",
  rootDir: workspaceRoot,
  collectCoverageFrom: [`${packagePath}/src/**/*.{ts,tsx}`],
  // Use a plain Node environment for configuration tests. These tests don't
  // depend on DOM APIs and running them under jsdom pulls in additional
  // transitive dependencies like `parse5`, which in turn requires the
  // `entities/decode` subpath that isn't exported in older versions.  Using the
  // Node environment avoids that resolution path entirely and prevents
  // `ERR_PACKAGE_PATH_NOT_EXPORTED` errors when running unit tests.
  testEnvironment: "node",
  setupFiles,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    "^\\.\\./core\\.js$": "<rootDir>/packages/config/src/env/core.ts",
    // Map internal ESM-style .js imports in TS sources to their TS files for Jest
    "^\\./core/require-env\\.js$": "<rootDir>/packages/config/src/env/core/require-env.ts",
    "^\\./core/schema\\.base-merge\\.js$": "<rootDir>/packages/config/src/env/core/schema.base-merge.ts",
    "^\\./core/refinement\\.deposit\\.js$": "<rootDir>/packages/config/src/env/core/refinement.deposit.ts",
    "^\\./core/schema\\.core\\.js$": "<rootDir>/packages/config/src/env/core/schema.core.ts",
    "^\\./core/loader\\.parse\\.js$": "<rootDir>/packages/config/src/env/core/loader.parse.ts",
    "^\\./core/runtime\\.proxy\\.js$": "<rootDir>/packages/config/src/env/core/runtime.proxy.ts",
    "^\\./core/runtime\\.prod-failfast\\.js$": "<rootDir>/packages/config/src/env/core/runtime.prod-failfast.ts",
    "^\\./core/runtime\\.test-auth-init\\.js$": "<rootDir>/packages/config/src/env/core/runtime.test-auth-init.ts",
    "^\\./core/schema\\.base\\.js$": "<rootDir>/packages/config/src/env/core/schema.base.ts",
    // When resolving from within src/env/core/*, map local .js specifiers to TS
    "^\\./schema\\.base\\.js$": "<rootDir>/packages/config/src/env/core/schema.base.ts",
    "^\\./schema\\.base-merge\\.js$": "<rootDir>/packages/config/src/env/core/schema.base-merge.ts",
    "^\\./constants\\.js$": "<rootDir>/packages/config/src/env/core/constants.ts",
    "^\\./schema\\.preprocess\\.js$": "<rootDir>/packages/config/src/env/core/schema.preprocess.ts",
    "^\\./schema\\.core\\.js$": "<rootDir>/packages/config/src/env/core/schema.core.ts",
    "^\\./refinement\\.deposit\\.js$": "<rootDir>/packages/config/src/env/core/refinement.deposit.ts",
    "^\\./loader\\.parse\\.js$": "<rootDir>/packages/config/src/env/core/loader.parse.ts",
    "^\\./runtime\\.resolve-loader\\.js$": "<rootDir>/packages/config/src/env/core/runtime.resolve-loader.ts",
    "^\\./env\\.snapshot\\.js$": "<rootDir>/packages/config/src/env/core/env.snapshot.ts",
    "^\\./runtime\\.proxy\\.js$": "<rootDir>/packages/config/src/env/core/runtime.proxy.ts",
    "^\\./runtime\\.prod-failfast\\.js$": "<rootDir>/packages/config/src/env/core/runtime.prod-failfast.ts",
    "^\\./runtime\\.test-auth-init\\.js$": "<rootDir>/packages/config/src/env/core/runtime.test-auth-init.ts",
    // Map references to sibling schemas used by core internals
    "^\\.\\./cms\\.schema\\.js$": "<rootDir>/packages/config/src/env/cms.schema.ts",
    "^\\.\\./email\\.schema\\.js$": "<rootDir>/packages/config/src/env/email.schema.ts",
    "^\\.\\./payments\\.js$": "<rootDir>/packages/config/src/env/payments.ts",
  },
  setupFilesAfterEnv,
  extensionsToTreatAsEsm: [],
  transform,
  coveragePathIgnorePatterns,
  coverageThreshold: { global: { lines: 60, branches: 60 } },
};

// Allow targeted runs (e.g., --runTestsByPath) to skip global coverage gates so
// quick iteration on a narrow file set doesn't fail on overall thresholds.
const isTargetedRun =
  process.argv.includes("--runTestsByPath") ||
  process.argv.some((arg) => arg.startsWith("--testPathPattern"));
if (isTargetedRun || process.env.JEST_ALLOW_PARTIAL_COVERAGE === "1") {
  config.coverageThreshold = { global: { lines: 0, branches: 0, functions: 0 } };
}

module.exports = config;

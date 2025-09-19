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
  path.join(packageRoot, "test/setup-env.js"),
];

const tsJestOptions = {
  tsconfig: path.join(packageRoot, "tsconfig.test.json"),
  useESM: false,
  diagnostics: false,
  babelConfig: false,
};

const transform = {
  "^.+\\.(ts|tsx)$": ["ts-jest", tsJestOptions],
  "^.+\\.tsx?$": ["ts-jest", tsJestOptions],
};

const globals = {
  ...base.globals,
  "ts-jest": {
    ...(base.globals && base.globals["ts-jest"]),
    tsconfig: path.join(packageRoot, "tsconfig.test.json"),
    useESM: false,
    diagnostics: false,
    babelConfig: false,
  },
};

/** @type {import('jest').Config} */
module.exports = {
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
  globals,
  setupFiles,
  moduleNameMapper: {
    ...base.moduleNameMapper,
    "^\\.\\./core\\.js$": "<rootDir>/packages/config/src/env/core.ts",
    "^\\.\\./payments\\.js$": "<rootDir>/packages/config/src/env/payments.ts",
  },
  setupFilesAfterEnv,
  extensionsToTreatAsEsm: [],
  transform,
  coveragePathIgnorePatterns,
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
    },
  },
};

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("../../jest.config.cjs");

const workspaceRoot = path.resolve(__dirname, "../..");
const packagePath = path
  .relative(workspaceRoot, process.cwd())
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

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  rootDir: workspaceRoot,
  collectCoverageFrom: [`${packagePath}/src/**/*.{ts,tsx}`, `${packagePath}/middleware.ts`],
  // Use a plain Node environment for configuration tests. These tests don't
  // depend on DOM APIs and running them under jsdom pulls in additional
  // transitive dependencies like `parse5`, which in turn requires the
  // `entities/decode` subpath that isn't exported in older versions.  Using the
  // Node environment avoids that resolution path entirely and prevents
  // `ERR_PACKAGE_PATH_NOT_EXPORTED` errors when running unit tests.
  testEnvironment: "node",
  moduleNameMapper: {
    ...base.moduleNameMapper,
    "^\\.\\./core\\.js$": "<rootDir>/packages/config/src/env/core.ts",
    "^\\.\\./payments\\.js$": "<rootDir>/packages/config/src/env/payments.ts",
  },
  coveragePathIgnorePatterns,
  coverageThreshold: {
    global: {
      lines: 60,
      branches: 60,
    },
  },
};

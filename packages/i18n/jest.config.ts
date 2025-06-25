// packages/i18n/jest.config.ts

import type { Config } from "jest";
import path from "node:path";
import { pathsToModuleNameMapper } from "ts-jest";
import ts from "typescript";

/**
 * TypeScript can safely use `__dirname` when the file is transpiled to CommonJS,
 * so we avoid `import.meta.url` (which requires `"module": "es2020"` or higher).
 */
const { config } = ts.readConfigFile(
  path.join(__dirname, "tsconfig.json"),
  ts.sys.readFile
);

const { compilerOptions } = config;

const jestConfig: Config = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsconfig: path.join(__dirname, "tsconfig.test.json"),
    },
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
    prefix: "<rootDir>/",
  }),
};

export default jestConfig;

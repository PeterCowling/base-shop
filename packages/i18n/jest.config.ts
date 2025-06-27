// packages/i18n/jest.config.ts

import type { Config } from "jest";
import path from "node:path";
import { pathsToModuleNameMapper } from "ts-jest";
import ts from "typescript";

/**
 * TypeScript can safely use `__dirname` when the file is transpiled to CommonJS,
 * so we avoid `import.meta.url` (which requires `"module": "es2020"` or higher).
 */
const configPath = path.join(__dirname, "tsconfig.json");
const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
const { options: compilerOptions } = ts.parseJsonConfigFileContent(
  config,
  ts.sys,
  path.dirname(configPath)
);

const jestConfig: Config = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [path.join(__dirname, "..", "..", "jest.setup.ts")],
  globals: {
    "ts-jest": {
      tsconfig: path.join(__dirname, "tsconfig.test.json"),
    },
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths ?? {}, {
    prefix: path.join(__dirname, "..", "..") + "/",
  }),
};

export default jestConfig;

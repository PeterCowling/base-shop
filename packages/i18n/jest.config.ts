const { pathsToModuleNameMapper } = require("ts-jest");
const ts = require("typescript");
const path = require("path");

const { config } = ts.readConfigFile(
  path.join(__dirname, "tsconfig.json"),
  ts.sys.readFile
);
const { compilerOptions } = config;

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsconfig: path.join(__dirname, "tsconfig.test.json"),
    },
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: "<rootDir>/",
  }),
};

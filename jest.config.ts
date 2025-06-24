// jest.config.ts

const { pathsToModuleNameMapper } = require("ts-jest");
const ts = require("typescript");
const path = require("path");
const { config } = ts.readConfigFile(
  path.join(__dirname, "tsconfig.base.json"),
  ts.sys.readFile
);
const { compilerOptions } = config;

/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: path.join(__dirname, "tsconfig.test.json"),
    },
  },
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { useESM: true }],
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
  testMatch: ["**/__tests__/**/*.(test|spec).[jt]s?(x)"],
  testPathIgnorePatterns: [
    "<rootDir>/node_modules",
    "<rootDir>/.next",
    "<rootDir>/dist",
  ],
};

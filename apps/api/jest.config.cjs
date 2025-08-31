/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("@acme/config/jest.preset.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: ["<rootDir>/apps/api/src", "<rootDir>/apps/api/__tests__"],
  globals: {
    "ts-jest": {
      tsconfig: path.resolve(__dirname, "tsconfig.test.json"),
    },
  },
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/test/polyfills/messageChannel.js"],
  moduleNameMapper: {
    ...base.moduleNameMapper,
    "entities/decode": "<rootDir>/test/emptyModule.js",
  },
};

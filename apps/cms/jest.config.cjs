/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("@acme/config/jest.preset.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: ["<rootDir>/apps/cms/src", "<rootDir>/apps/cms/__tests__"],
  setupFilesAfterEnv: ["<rootDir>/apps/cms/jest.setup.tsx"],
  globals: {
    "ts-jest": {
      tsconfig: path.resolve(__dirname, "tsconfig.test.json"),
      useESM: false,
    },
  },
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { useESM: false }],
  },
  transformIgnorePatterns: ["/node_modules/(?!(?:@?jose)/)"],
};

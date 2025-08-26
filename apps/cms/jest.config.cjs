/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("@acme/config/jest.preset.cjs");

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: [
    "<rootDir>/apps/cms/src",
    "<rootDir>/apps/cms/__tests__",
    "<rootDir>/packages/ui/src",
  ],
  setupFilesAfterEnv: ["<rootDir>/apps/cms/jest.setup.tsx"],
  moduleNameMapper: (() => {
    const mapper = { ...base.moduleNameMapper };
    delete mapper["^@/(.*)$"];
    return {
      ...mapper,
      "^@/components/atoms$": "<rootDir>/test/__mocks__/componentStub.js",
      "^@/components/cms/StyleEditor$":
        "<rootDir>/test/__mocks__/componentStub.js",
      "^@/components/(.*)$": "<rootDir>/packages/ui/src/components/$1",
      "^@ui/hooks$": "<rootDir>/test/__mocks__/componentStub.js",
      "^@ui/hooks/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
      "^@/(.*)$": "<rootDir>/apps/cms/src/$1",
    };
  })(),
  globals: {
    "ts-jest": {
      tsconfig: path.resolve(__dirname, "tsconfig.test.json"),
      useESM: false,
      // Disable Babel transpilation to avoid ts-jest attempting to load
      // `babel-jest`, which can cause "createTransformer is not a function"
      // errors when the module is missing or incompatible.
      babelConfig: false,
    },
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      { useESM: false, babelConfig: false },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(?:@?jose)/)"],
};

/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const base = require("@acme/config/jest.preset.cjs");
const {
  "^@/(.*)$": _unused,
  "^../components/(.*)$": _unused2,
  ...baseModuleNameMapper
} = base.moduleNameMapper;

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  roots: ["<rootDir>/apps/cms/src", "<rootDir>/apps/cms/__tests__"],
  setupFilesAfterEnv: ["<rootDir>/apps/cms/jest.setup.tsx"],
  moduleNameMapper: {
    ...baseModuleNameMapper,
    "^@/components/(.*)$": "<rootDir>/packages/ui/src/components/$1",
    "^@/i18n/Translations$": "<rootDir>/test/emptyModule.js",
    "^@/(.*)$": "<rootDir>/apps/cms/src/$1",
  },
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

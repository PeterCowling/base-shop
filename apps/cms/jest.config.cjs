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
  setupFilesAfterEnv: [
    "<rootDir>/apps/cms/jest.setup.polyfills.ts",
    "<rootDir>/apps/cms/jest.setup.tsx",
  ],
  moduleNameMapper: {
    ...baseModuleNameMapper,
    "^@/components/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
    "^@/i18n/Translations$": "<rootDir>/test/emptyModule.js",
    "^@/(.*)$": "<rootDir>/apps/cms/src/$1",
    "^packages/config/src/env/core\\.js$": "<rootDir>/packages/config/src/env/core.impl.ts",
    "^packages/config/src/env/index\\.js$": "<rootDir>/packages/config/src/env/index.ts",
    "^packages/config/src/env/(.*)\\.js$": "<rootDir>/packages/config/src/env/$1.ts",
    // TODO: map test-friendly stubs once available
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

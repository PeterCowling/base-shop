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
  testEnvironment: "jsdom",
  roots: ["<rootDir>/apps/cms/src", "<rootDir>/apps/cms/__tests__"],
  setupFiles: [
    "<rootDir>/apps/cms/jest.env.ts",
    "<rootDir>/apps/cms/jest.setup.ts",
  ],
  // Ensure environment variables and polyfills are applied before other setup
  // files that may import modules requiring them.  `jest.setup.tsx` establishes
  // auth secrets needed by configuration code, so it must run first.
  setupFilesAfterEnv: [
    "<rootDir>/apps/cms/jest.setup.tsx",
    "<rootDir>/apps/cms/jest.setup.polyfills.ts",
    "<rootDir>/apps/cms/__tests__/msw/server.ts",
  ],
  moduleNameMapper: {
    ...baseModuleNameMapper,
    "^packages/config/src/env/cms\\.ts$": "<rootDir>/packages/config/src/env/__tests__/cms.stub.ts",
    "^packages/config/src/env/core\\.ts$": "<rootDir>/packages/config/src/env/__tests__/core.stub.ts",
    "^@/components/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
    "^@/i18n/Translations$": "<rootDir>/test/emptyModule.js",
    "^@/(.*)$": "<rootDir>/apps/cms/src/$1",
    "^packages/config/src/env/core\\.js$": "<rootDir>/packages/config/src/env/core.ts",
    "^packages/config/src/env/index\\.js$": "<rootDir>/packages/config/src/env/index.ts",
    "^packages/config/src/env/(.*)\\.js$": "<rootDir>/packages/config/src/env/$1.ts",
    "^undici$": "<rootDir>/test/__mocks__/undici.ts",
    "^react-chartjs-2$": "<rootDir>/test/__mocks__/react-chartjs-2.ts",
  },
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: path.resolve(__dirname, "tsconfig.test.json"),
        useESM: false,
        babelConfig: false,
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(?:@?jose)/)"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/apps/cms/src/components/cms/media/",
  ],
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 30,
      functions: 10,
      lines: 40,
    },
  },
};

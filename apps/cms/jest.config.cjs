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
  // Reuse the base Jest preset, but override coverage settings for CMS
  ...base,
  // Run tests from the workspace root so relative paths resolve correctly
  rootDir: path.resolve(__dirname, "..", ".."),
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
    "<rootDir>/apps/cms/jest.setup.after.ts",
    "<rootDir>/apps/cms/jest.setup.polyfills.ts",
    "<rootDir>/apps/cms/__tests__/msw/server.ts",
  ],
  moduleNameMapper: {
    ...baseModuleNameMapper,
    "^packages/config/src/env/cms\\.ts$": "<rootDir>/packages/config/src/env/__tests__/cms.stub.ts",
    "^packages/config/src/env/core\\.ts$": "<rootDir>/packages/config/src/env/__tests__/core.stub.ts",
    "^@/components/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
    "^@/i18n/Translations$": "<rootDir>/test/emptyModule.js",
    "^@/contexts/(.*)$": "<rootDir>/packages/platform-core/src/contexts/$1",
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
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(?:@?jose)/)"],
  // Collect coverage only from the CMS source code; exclude declarations and tests.
  collectCoverage: true,
  collectCoverageFrom: [
    "apps/cms/src/**/*.{ts,tsx}",
    "!apps/cms/src/**/*.d.ts",
    "!apps/cms/src/**/?(*.)+(spec|test).{ts,tsx}",
    "!apps/cms/src/**/__tests__/**",
  ],
  coverageReporters: ["text", "lcov"],
  // Preserve the base coverage ignore patterns to avoid instrumenting other packages/apps
  coveragePathIgnorePatterns: base.coveragePathIgnorePatterns,
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 30,
      functions: 10,
      lines: 40,
    },
  },
};

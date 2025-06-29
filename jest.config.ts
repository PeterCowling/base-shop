// jest.config.ts   (repo root – replace the existing file completely)

/**
 * Jest configuration for the entire monorepo.
 *  – compiles every .ts / .tsx file with ts‑jest
 *  – supports path aliases used in tsconfig.json
 *  – runs tests in a JSDOM environment so React tests work out‑of‑the‑box
 */

import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest", // <<—   ENABLE ts‑jest
  testEnvironment: "jsdom",
  setupFiles: ["<rootDir>/test/setupFetchPolyfill.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  /** Transform every TypeScript file with ts‑jest */
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
        // compile to CommonJS so that the tests that call `require()` still work
        useESM: false,
        diagnostics: false,
      },
    ],
  },

  /**
   * Map the path aliases that appear in source files
   * so Jest can resolve them without extra hacks.
   * Adjust the paths below if the folder layout changes.
   */
  moduleNameMapper: {
    "^@platform-core/(.*)$": "<rootDir>/packages/platform-core/$1",
    "^@apps/(.*)$": "<rootDir>/apps/$1/src",
    "^@cms/(.*)$": "<rootDir>/apps/cms/src/$1",
    "^@lib/(.*)$": "<rootDir>/packages/lib/$1",
    "^@auth/(.*)$": "<rootDir>/packages/auth/src/$1",
    "^@/lib/stripeServer$": "<rootDir>/packages/lib/stripeServer.ts",
    "^@/lib/(.*)$": "<rootDir>/packages/platform-core/$1",
    "^@/contexts/(.*)$": "<rootDir>/packages/platform-core/contexts/$1",
    "^@/components/(.*)$": "<rootDir>/packages/ui/components/$1",
    "^@ui/(.*)$": "<rootDir>/packages/ui/$1",
    "^@i18n/(.*)$": "<rootDir>/packages/i18n/src/$1",
    "^@/i18n/(.*)$": "<rootDir>/packages/i18n/src/$1",
    "^@config/(.*)$": "<rootDir>/packages/config/$1",
    "^@types$": "<rootDir>/src/types",
    "^@types/shared$": "<rootDir>/packages/types/src/index.ts",
    "^@types/shared/(.*)$": "<rootDir>/packages/types/src/$1",
    "^@types/(.*)$": "<rootDir>/src/types/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  },

  /**
   * Allow Jest to transform everything *except* node_modules,
   * but still transpile any modern JS shipped by ulid, etc.
   */
  transformIgnorePatterns: ["node_modules/(?!(ulid)/)"],

  /** Only run tests written in TypeScript */
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],

  /** Recognise TypeScript & JSX extensions automatically */
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov"],

  /**
   * Most packages invoke Jest with
   *   jest --config ../../jest.config.ts
   * so <rootDir> already points to the repository root.
   */
  rootDir: ".",
};

export default config;

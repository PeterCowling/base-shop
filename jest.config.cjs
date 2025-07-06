// /jest.config.cjs

/**
 * Jest configuration for the entire monorepo.
 * – compiles every .ts / .tsx file with ts-jest
 * – supports path aliases used in tsconfig.json
 * – runs tests in a JSDOM environment so React tests work out-of-the-box
 */

/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest", // ENABLE ts-jest
  testEnvironment: "jsdom",

  // Global setup/teardown
  setupFiles: ["<rootDir>/test/setupFetchPolyfill.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  /** Transform every TypeScript file with ts-jest */
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
        useESM: false, // compile to CommonJS
        diagnostics: false,
      },
    ],
  },

  /**
   * Map ts-config path aliases so Jest can resolve them.
   * Adjust paths here if the folder layout changes.
   */
  moduleNameMapper: {
    "^@platform-core$": "<rootDir>/packages/platform-core/src/index.ts",
    "^@platform-core/(.*)$": "<rootDir>/packages/platform-core/src/$1",

    "^@apps/(.*)$": "<rootDir>/apps/$1/src",
    "^@cms/(.*)$": "<rootDir>/apps/cms/src/$1",

    "^@lib/stripeServer$": "<rootDir>/packages/lib/src/stripeServer.server.ts",
    "^@lib/stripeServer.server$":
      "<rootDir>/packages/lib/src/stripeServer.server.ts",
    "^@lib/(.*)$": "<rootDir>/packages/lib/src/$1",

    "^@auth$": "<rootDir>/packages/auth/src/index.ts",
    "^@auth/(.*)$": "<rootDir>/packages/auth/src/$1",

    "^@/lib/stripeServer$": "<rootDir>/packages/lib/src/stripeServer.server.ts",
    "^@/lib/stripeServer.server$":
      "<rootDir>/packages/lib/src/stripeServer.server.ts",
    "^@/lib/(.*)$": "<rootDir>/packages/platform-core/src/$1",

    "^@/contexts/(.*)$": "<rootDir>/packages/platform-core/src/contexts/$1",
    "^@/components/(.*)$": "<rootDir>/packages/ui/src/components/$1",

    "^@ui/(.*)$": "<rootDir>/packages/ui/src/$1",
    "^@i18n/(.*)$": "<rootDir>/packages/i18n/src/$1",
    "^@/i18n/(.*)$": "<rootDir>/packages/i18n/src/$1",

    "^@config/(.*)$": "<rootDir>/packages/config/src/$1",

    "^@themes/([^/]+)/(.+)$": "<rootDir>/packages/themes/$1/src/$2",

    "^@types$": "<rootDir>/packages/types/src/index.ts",
    "^@types/shared$": "<rootDir>/packages/types/src/index.ts",
    "^@types/shared/(.*)$": "<rootDir>/packages/types/src/$1",
    "^@types/(.*)$": "<rootDir>/packages/types/src/$1",

    // React must always resolve to the *workspace* copy
    "^react$": "<rootDir>/node_modules/react",
    "^react-dom$": "<rootDir>/node_modules/react-dom",
    "^react/jsx-runtime$": "<rootDir>/node_modules/react/jsx-runtime.js",
    "^react/jsx-dev-runtime$":
      "<rootDir>/node_modules/react/jsx-dev-runtime.js",

    // Jest-friendly stub for style imports
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",

    // Remix/server-only stub
    "^server-only$": "<rootDir>/test/server-only-stub.ts",
  },

  /**
   * Allow Jest to transform everything *except* node_modules,
   * but still transpile any modern JS shipped by ulid, etc.
   */
  transformIgnorePatterns: ["node_modules/(?!(ulid)/)"],

  /** Only run tests written in TypeScript */
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],

  passWithNoTests: true,

  /** Recognise TypeScript & JSX extensions automatically */
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "server.ts",
    "server.tsx",
    "client.ts",
    "client.tsx",
  ],

  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov"],

  /**
   * Each workspace runs Jest with
   *    jest --config ../../jest.config.cjs
   * so <rootDir> already points to the repository root.
   */
  rootDir: ".",
};

module.exports = config;

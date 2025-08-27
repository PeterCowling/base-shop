// /jest.config.cjs   ← keep this exact filename
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Monorepo-wide Jest config (CommonJS so Node can load it without
 * `"type":"module"`).  Test suites themselves still execute in ESM via ts-jest.
 */

const path = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");
const ts = require("typescript");

// Ensure Browserslist doesn't try to resolve config files from
// temporary directories created during Jest transforms. This prevents
// ENOENT errors when packages like `@babel/core` invoke Browserslist
// while handling files compiled in non-existent temp paths.
process.env.BROWSERSLIST = process.env.BROWSERSLIST || "defaults";

/* ──────────────────────────────────────────────────────────────────────
 * 1️⃣  Resolve TS path aliases once so we don't hand-maintain 30+ maps
 * ──────────────────────────────────────────────────────────────────── */
const tsconfig = ts.readConfigFile(
  path.resolve(__dirname, "tsconfig.base.json"),
  ts.sys.readFile
).config;

const tsPaths = tsconfig?.compilerOptions?.paths
  ? pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
      prefix: "<rootDir>/",
    })
  : {};

// Ensure a single React instance across the monorepo tests
const reactPath = path.resolve(__dirname, "node_modules/react");
const reactDomPath = path.resolve(__dirname, "node_modules/react-dom");
const reactDomClientPath = path.resolve(reactDomPath, "client.js");
const reactJsxRuntimePath = path.resolve(reactPath, "jsx-runtime.js");
const reactJsxDevRuntimePath = path.resolve(reactPath, "jsx-dev-runtime.js");

/* ──────────────────────────────────────────────────────────────────────
 * 2️⃣  Jest configuration proper
 * ──────────────────────────────────────────────────────────────────── */
/** @type {import('jest').Config} */
module.exports = {
  /* ------------------------------------------------------------------ */
  /* Runner & transform                                                 */
  /* ------------------------------------------------------------------ */
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.test.json",
        useESM: true,
        diagnostics: false,
        // Disable automatic Babel transpilation; ts-jest handles TypeScript
        // compilation itself and Node 20 supports the necessary syntax.
        // This prevents ts-jest from attempting to load `babel-jest`, which
        // previously caused "createTransformer is not a function" errors when
        // the module was missing or incompatible.
        babelConfig: false,
      },
    ],
  },
  transformIgnorePatterns: [
    // transpile ESM-only dependencies that would break under CommonJS
    "/node_modules/(?!(jose|next-auth|ulid|@upstash/redis|uncrypto)/)",
  ],

  /* ------------------------------------------------------------------ */
  /* Global setup & polyfills                                           */
  /* ------------------------------------------------------------------ */
  setupFiles: ["<rootDir>/test/setupFetchPolyfill.ts"],
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.ts",
    "<rootDir>/test/polyfills/messageChannel.js",
  ],

  /* ------------------------------------------------------------------ */
  /* Ignore paths completely                                             */
  /* ------------------------------------------------------------------ */
  testPathIgnorePatterns: [
    "<rootDir>/test/e2e/",
    "<rootDir>/.storybook/",
    "/.storybook/test-runner/",
  ],

  /* ------------------------------------------------------------------ */
  /* Path aliases & quick stubs                                          */
  /* ------------------------------------------------------------------ */
  moduleNameMapper: {
    // stub type-only imports such as  `import "./next-auth.d.ts"`
    "^.+\\.d\\.ts$": "<rootDir>/test/emptyModule.js",

    // use TypeScript implementation for data root helper during tests
    "^\\./dataRoot\\.js$": "<rootDir>/packages/platform-core/src/dataRoot.ts",

    // map config package relative ESM imports to TypeScript sources
    "^\\./auth\\.js$": "<rootDir>/packages/config/src/env/auth.ts",
    "^\\./cms\\.js$": "<rootDir>/packages/config/src/env/cms.ts",
    "^\\./email\\.js$": "<rootDir>/packages/config/src/env/email.ts",
    "^\\./core\\.js$": "<rootDir>/packages/config/src/env/core.ts",
    "^\\./payments\\.js$": "<rootDir>/packages/config/src/env/payments.ts",
    "^\\./shipping\\.js$": "<rootDir>/packages/config/src/env/shipping.ts",
    "^\\./foo\\.js$": "<rootDir>/packages/config/src/env/foo.impl.ts",
    "^\\./foo\\.impl\\.ts$": "<rootDir>/packages/config/src/env/foo.impl.ts",

    // explicit barrels (no trailing segment)
    "^@platform-core$": "<rootDir>/packages/platform-core/src/index.ts",
    "^@ui/src$": "<rootDir>/packages/ui/src/index.ts",

    // specific rules that must override tsconfig-derived ones
      "^@platform-core/repositories/shopSettings$":
        "<rootDir>/packages/platform-core/src/repositories/settings.server.ts",
      "^@platform-core/repositories/rentalOrders$":
        "<rootDir>/packages/platform-core/src/repositories/rentalOrders.server.ts",
      "^@platform-core/repositories/pages$":
        "<rootDir>/packages/platform-core/src/repositories/pages/index.server.ts",
    "^@platform-core/(.*)$": "<rootDir>/packages/platform-core/src/$1",
    "^@ui/src/(.*)$": "<rootDir>/packages/ui/src/$1",
      "^@config/src/env$": "<rootDir>/packages/config/src/env/index.ts",
      "^@config/src/(.*)$": "<rootDir>/packages/config/src/$1",
    "^@acme/config$": "<rootDir>/packages/config/src/env/index.ts",
    "^@acme/config/(.*)$": "<rootDir>/packages/config/src/$1",
    "^@acme/plugin-sanity$": "<rootDir>/test/__mocks__/pluginSanityStub.ts",
    "^@acme/plugin-sanity/(.*)$": "<rootDir>/test/__mocks__/pluginSanityStub.ts",
    "^@acme/zod-utils/initZod$": "<rootDir>/test/emptyModule.js",

    // resolve relative .js imports within packages/config/env to their .ts sources
    "^\\./env/(.*)\\.js$": "<rootDir>/packages/config/src/env/$1.ts",
    "^\\./(auth|cms|email|core|payments|shipping)\\.js$":
      "<rootDir>/packages/config/src/env/$1.ts",

    // CMS application aliases
    "^@/components/atoms/shadcn$":
      "<rootDir>/test/__mocks__/shadcnDialogStub.tsx",
    "^@/i18n/(.*)$": "<rootDir>/packages/i18n/src/$1",
    "^@/components/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
    "^@/(.*)$": "<rootDir>/apps/cms/src/$1",

    // context mocks
    "^@platform-core/contexts/ThemeContext(?:\\.js)?$":
      "<rootDir>/test/__mocks__/themeContextMock.tsx",
    "^@platform-core/contexts/CurrencyContext(?:\\.js)?$":
      "<rootDir>/test/__mocks__/currencyContextMock.tsx",
    "^@acme/platform-core/contexts/ThemeContext(?:\\.js)?$":
      "<rootDir>/test/__mocks__/themeContextMock.tsx",
    "^@acme/platform-core/contexts/CurrencyContext(?:\\.js)?$":
      "<rootDir>/test/__mocks__/currencyContextMock.tsx",

    // email provider client mocks
    "^resend$": "<rootDir>/packages/email/src/providers/__mocks__/resend.ts",
    "^@sendgrid/mail$": "<rootDir>/packages/email/src/providers/__mocks__/@sendgrid/mail.ts",

    // component stubs – structure isn’t under test
    "^@ui/components/cms/MediaManager$": "<rootDir>/packages/ui/src/components/cms/MediaManager.tsx",
    "^@ui/components/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
    "^@ui/atoms/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
    "^@ui/molecules/(.*)$": "<rootDir>/test/__mocks__/componentStub.js",
    "^@platform-core/components/(.*)$":
      "<rootDir>/test/__mocks__/componentStub.js",

    // legacy relative imports still referenced inside tests
    "^\\.\\./repositories/(.*)$":
      "<rootDir>/packages/platform-core/src/repositories/$1",
    "^\\.\\./pricing$": "<rootDir>/packages/platform-core/src/pricing/index.ts",
    "^../../../packages/platform-core/repositories/(.*)$":
      "<rootDir>/packages/platform-core/src/repositories/$1",
    "^../packages/ui/components/(.*)$":
      "<rootDir>/packages/ui/src/components/$1",
    "^../components/(.*)$":
      "<rootDir>/packages/ui/src/components/$1",

    // fixture JSON moved during the Turbo-repo migration
    "^functions/data/rental/(.*)$":
      "<rootDir>/functions/data/_shared/rental/$1",

    // CSS modules & single-runtime stubs
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^server-only$": "<rootDir>/test/server-only-stub.ts",

    // finally, fall back to tsconfig-derived aliases
    // map React to ensure hooks use the same instance during tests
    "^react$": reactPath,
    "^react-dom/client$": reactDomClientPath,
    "^react-dom$": reactDomPath,
    "^react/jsx-runtime$": reactJsxRuntimePath,
    "^react/jsx-dev-runtime$": reactJsxDevRuntimePath,
    ...tsPaths,
  },

  /* ------------------------------------------------------------------ */
  /* Misc                                                                */
  /* ------------------------------------------------------------------ */
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],
  passWithNoTests: true,
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "mjs",
    "node",
    "d.ts",
  ],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov"],
  rootDir: ".", // each workspace already passes  --config ../../jest.config.cjs
};

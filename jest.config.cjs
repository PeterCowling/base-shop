// /jest.config.cjs   ← keep this exact filename
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Monorepo‑wide Jest configuration.
 *
 * This configuration must be a CommonJS module because Node loads it
 * directly when spawning Jest processes. Individual test suites still
 * execute in ESM via ts‑jest.
 */

const path = require("path");
const { pathsToModuleNameMapper } = require("ts-jest");
const ts = require("typescript");

// Ensure Browserslist doesn't attempt to load configuration files from
// temporary directories created during Jest transforms. Without this,
// libraries like `@babel/core` may invoke Browserslist against paths
// that do not exist, resulting in ENOENT errors.
process.env.BROWSERSLIST = process.env.BROWSERSLIST || "defaults";

/* ──────────────────────────────────────────────────────────────────────
 * 1️⃣  Resolve TS path aliases once so we don't hand‑maintain 30+ maps
 * ──────────────────────────────────────────────────────────────────── */
const tsconfig = ts.readConfigFile(
  path.resolve(__dirname, "tsconfig.base.json"),
  ts.sys.readFile
).config;

const tsPaths = tsconfig?.compilerOptions?.paths
  ? pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
      // Prefix absolute imports from the repository root.  Keep the space
      // prefix intact because other configuration files rely on this
      // convention when constructing absolute paths.
      prefix: " /",
    })
  : {};

/* ──────────────────────────────────────────────────────────────────────
 * 2️⃣  Ensure a single React instance across monorepo tests
 *
 * Most packages in this repository rely on the React version bundled
 * within Next.js rather than declaring `react` and `react-dom` as
 * dependencies.  When tests run via Jest there is no webpack aliasing,
 * so resolving modules like `react/jsx-runtime` may fail if `react`
 * isn't installed.  The logic below attempts to resolve React and
 * ReactDOM from the local `node_modules` first, then falls back to
 * Next.js's compiled React packages if those modules are absent.
 *
 * This approach avoids forcing every package to depend on React while
 * still providing stable module identifiers for Jest's moduleNameMapper.
 */
let reactPath;
let reactDomPath;
let reactDomClientPath;
let reactJsxRuntimePath;
let reactJsxDevRuntimePath;

try {
  // Prefer a locally installed React.  We use require.resolve on
  // `package.json` to locate the package root regardless of symlinks.
  reactPath = path.dirname(require.resolve("react/package.json"));
  reactDomPath = path.dirname(require.resolve("react-dom/package.json"));
  reactDomClientPath = require.resolve("react-dom/client.js");
  reactJsxRuntimePath = require.resolve("react/jsx-runtime.js");
  reactJsxDevRuntimePath = require.resolve("react/jsx-dev-runtime.js");
} catch {
  // If React isn't installed (e.g. when relying on Next's bundled
  // version), fall back to the compiled copies shipped with Next.js.
  const compiledReactPkg = require.resolve(
    "next/dist/compiled/react/package.json"
  );
  reactPath = path.dirname(compiledReactPkg);
  const compiledReactDomPkg = require.resolve(
    "next/dist/compiled/react-dom/package.json"
  );
  reactDomPath = path.dirname(compiledReactDomPkg);
  reactDomClientPath = require.resolve(
    "next/dist/compiled/react-dom/client.js"
  );
  reactJsxRuntimePath = require.resolve(
    "next/dist/compiled/react/jsx-runtime.js"
  );
  reactJsxDevRuntimePath = require.resolve(
    "next/dist/compiled/react/jsx-dev-runtime.js"
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * 3️⃣  Jest configuration proper
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
        tsconfig: " /tsconfig.test.json",
        useESM: true,
        diagnostics: false,
        // Disable automatic Babel transpilation; ts‑jest handles TypeScript
        // compilation itself and Node 20 supports the necessary syntax.
        // This prevents ts‑jest from attempting to load `babel-jest`, which
        // previously caused "createTransformer is not a function" errors when
        // the module was missing or incompatible.
        babelConfig: false,
      },
    ],
  },
  transformIgnorePatterns: [
    // transpile ESM‑only dependencies that would break under CommonJS
    "/node_modules/(?!(jose|next-auth|ulid|@upstash/redis|uncrypto)/)",
  ],

  /* ------------------------------------------------------------------ */
  /* Global setup & polyfills                                           */
  /* ------------------------------------------------------------------ */
  setupFiles: ["dotenv/config", " /test/setupFetchPolyfill.ts"],
  setupFilesAfterEnv: [" /jest.setup.ts", " /test/polyfills/messageChannel.js"],

  /* ------------------------------------------------------------------ */
  /* Ignore paths completely                                             */
  /* ------------------------------------------------------------------ */
  testPathIgnorePatterns: [
    " /test/e2e/",
    " /.storybook/",
    "/.storybook/test-runner/",
  ],

  /* ------------------------------------------------------------------ */
  /* Path aliases & quick stubs                                          */
  /* ------------------------------------------------------------------ */
  moduleNameMapper: {
    // stub type‑only imports such as  `import "./next-auth.d.ts"`
    "^.+\\.d\\.ts$": " /test/emptyModule.js",

    // use TypeScript implementation for data root helper during tests
    "^\\./dataRoot\\.js$": " /packages/platform-core/src/dataRoot.ts",

    // map config package relative ESM imports to TypeScript sources
    "^\\./auth\\.js$": " /packages/config/src/env/auth.ts",
    "^\\./cms\\.js$": " /packages/config/src/env/cms.ts",
    "^\\./email\\.js$": " /packages/config/src/env/email.ts",
    "^\\./core\\.js$": " /packages/config/src/env/core.ts",
    "^\\./env/core\\.js$": " /packages/config/src/env/core.ts",
    "^\\./payments\\.js$": " /packages/config/src/env/payments.ts",
    "^\\./shipping\\.js$": " /packages/config/src/env/shipping.ts",
    "^\\./foo\\.js$": " /packages/config/src/env/foo.impl.ts",
    "^\\./foo\\.impl\\.ts$": " /packages/config/src/env/foo.impl.ts",

    // explicit barrels (no trailing segment)
    "^@platform-core$": " /packages/platform-core/src/index.ts",
    "^@ui/src$": " /packages/ui/src/index.ts",

    // specific rules that must override tsconfig‑derived ones
    "^@platform-core/repositories/shopSettings$":
      " /packages/platform-core/src/repositories/settings.server.ts",
    "^@platform-core/repositories/rentalOrders$":
      " /packages/platform-core/src/repositories/rentalOrders.server.ts",
    "^@platform-core/repositories/pages$":
      " /packages/platform-core/src/repositories/pages/index.server.ts",
    "^@platform-core/(.*)$": " /packages/platform-core/src/$1",
    "^@ui/src/(.*)$": " /packages/ui/src/$1",
    "^@config/src/env$": " /packages/config/src/env/index.ts",
    "^@config/src/env/core$": " /packages/config/src/env/core.ts",
    "^@config/src/env/(.*)$": " /packages/config/src/env/$1.ts",
    "^@config/src/(.*)$": " /packages/config/src/$1",
    "^@acme/config/env$": " /packages/config/src/env/index.ts",
    "^@acme/config/env/core$": " /packages/config/src/env/core.ts",
    "^@acme/config/env/(.*)$": " /packages/config/src/env/$1.ts",
    "^@acme/config$": " /packages/config/src/env/index.ts",
    "^@acme/config/(.*)$": " /packages/config/src/$1",
    "^@acme/platform-machine/src/(.*)$": " /packages/platform-machine/src/$1",
    "^@acme/plugin-sanity$": " /test/__mocks__/pluginSanityStub.ts",
    "^@acme/plugin-sanity/(.*)$": " /test/__mocks__/pluginSanityStub.ts",
    "^@acme/zod-utils/initZod$": " /test/emptyModule.js",

    // resolve relative .js imports within packages/config/env to their .ts sources
    "^\\./env/(.*)\\.js$": " /packages/config/src/env/$1.ts",
    "^\\./(auth|cms|email|core|payments|shipping)\\.js$":
      " /packages/config/src/env/$1.ts",

    // CMS application aliases
    "^@/components/atoms/shadcn$": " /test/__mocks__/shadcnDialogStub.tsx",
    "^@/i18n/(.*)$": " /packages/i18n/src/$1",
    "^@/components/(.*)$": " /test/__mocks__/componentStub.js",
    "^@/(.*)$": " /apps/cms/src/$1",

    // CSS modules & single‑runtime stubs
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^server-only$": " /test/server-only-stub.ts",

    // finally, fall back to tsconfig‑derived aliases
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
  coverageDirectory: " /coverage",
  coverageReporters: ["text", "text-summary", "lcov"],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
    },
  },
  rootDir: ".", // each workspace already passes  --config ../../jest.config.cjs
};

// /jest.config.cjs   ← keep this exact filename
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Monorepo‑wide Jest configuration.
 *
 * This configuration must be a CommonJS module because Node loads it
 * directly when spawning Jest processes. Individual test suites still
 * execute in ESM via ts‑jest.
 */

const fs = require('fs');
const path = require('path');
const { pathsToModuleNameMapper } = require('ts-jest');
const ts = require('typescript');

// Prevent Browserslist from resolving config files in temporary Jest paths.
process.env.BROWSERSLIST = process.env.BROWSERSLIST || 'defaults';

function resolveRoot(value) {
  if (typeof value === 'string') {
    return value.startsWith(' /')
      ? path.join(__dirname, value.slice(2))
      : value;
  }
  if (Array.isArray(value)) {
    return value.map(resolveRoot);
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      value[key] = resolveRoot(value[key]);
    }
    return value;
  }
  return value;
}

/* ──────────────────────────────────────────────────────────────────────
 * 1️⃣  Resolve TypeScript path aliases once to avoid hand‑maintaining 30+ maps
 * ──────────────────────────────────────────────────────────────────── */
const tsconfig = ts.readConfigFile(
  path.resolve(__dirname, 'tsconfig.base.json'),
  ts.sys.readFile
).config;

const tsPaths = tsconfig?.compilerOptions?.paths
  ? pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
      // Note: keep the leading space here; other config files depend on it.
      prefix: ' /',
    })
  : {};

/* ──────────────────────────────────────────────────────────────────────
 * 2️⃣  Ensure a single React instance across monorepo tests
 *
 * Try to resolve the installed react/react-dom packages along with their
 * JSX runtimes.  If they aren’t installed (or missing the runtime files),
 * fall back to the React copies bundled within Next.js.
 * ──────────────────────────────────────────────────────────────────── */
function resolveReact() {
  try {
    // Resolve the root of the locally installed react package. Use
    // `process.cwd()` so packages can supply their own React version
    // without requiring a top‑level dependency.
    const reactPkg = require.resolve('react/package.json', {
      paths: [process.cwd()],
    });
    const reactBase = path.dirname(reactPkg);
    const reactDomPkg = require.resolve('react-dom/package.json', {
      paths: [process.cwd()],
    });
    const reactDomBase = path.dirname(reactDomPkg);

    // Build full paths to runtime files and verify they exist.
    const jsxRuntime = path.join(reactBase, 'jsx-runtime.js');
    const jsxDevRuntime = path.join(reactBase, 'jsx-dev-runtime.js');
    const domClient = path.join(reactDomBase, 'client.js');

    if (
      fs.existsSync(jsxRuntime) &&
      fs.existsSync(jsxDevRuntime) &&
      fs.existsSync(domClient)
    ) {
      return {
        reactPath: reactBase,
        reactDomPath: reactDomBase,
        reactDomClientPath: domClient,
        reactJsxRuntimePath: jsxRuntime,
        reactJsxDevRuntimePath: jsxDevRuntime,
      };
    }
  } catch {
    // fall through to compiled React
  }
  return null;
}

let resolved = resolveReact();
if (!resolved) {
  // Use Next.js compiled React when react isn’t installed.
  const compiledReactPkg = require.resolve('next/dist/compiled/react/package.json');
  const reactPath = path.dirname(compiledReactPkg);
  const compiledReactDomPkg = require.resolve('next/dist/compiled/react-dom/package.json');
  const reactDomPath = path.dirname(compiledReactDomPkg);

  resolved = {
    reactPath,
    reactDomPath,
    reactDomClientPath: require.resolve('next/dist/compiled/react-dom/client.js'),
    reactJsxRuntimePath: require.resolve('next/dist/compiled/react/jsx-runtime.js'),
    reactJsxDevRuntimePath: require.resolve('next/dist/compiled/react/jsx-dev-runtime.js'),
  };
}

const {
  reactPath,
  reactDomPath,
  reactDomClientPath,
  reactJsxRuntimePath,
  reactJsxDevRuntimePath,
} = resolved;

/* ──────────────────────────────────────────────────────────────────────
 * 3️⃣  Jest configuration proper
 * ──────────────────────────────────────────────────────────────────── */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: ' /tsconfig.test.json',
        useESM: true,
        diagnostics: false,
        babelConfig: false,
      },
    ],
  },
  transformIgnorePatterns: [
    // Transpile ESM‑only dependencies that would break under CommonJS.
    // Also ensure internal "@acme" workspace packages are transformed so
    // their ESM builds can run in Jest.
    '/node_modules/(?!(jose|next-auth|ulid|@upstash/redis|uncrypto|@acme)/)',
  ],
  setupFiles: ['dotenv/config', ' /test/setupFetchPolyfill.ts'],
  setupFilesAfterEnv: [' /jest.setup.ts', ' /test/polyfills/messageChannel.js'],
  testPathIgnorePatterns: [' /test/e2e/', ' /.storybook/', '/.storybook/test-runner/'],
  moduleNameMapper: {
    '^.+\\.d\\.ts$': ' /test/emptyModule.js',
    '^\\./dataRoot\\.js$': ' /packages/platform-core/src/dataRoot.ts',
    '^\\./auth\\.js$': ' /packages/config/src/env/auth.ts',
    '^\\./cms\\.js$': ' /packages/config/src/env/cms.ts',
    '^\\./email\\.js$': ' /packages/config/src/env/email.ts',
    '^\\./core\\.js$': ' /packages/config/src/env/core.ts',
    '^\\./env/core\\.js$': ' /packages/config/src/env/core.ts',
    '^\\./payments\\.js$': ' /packages/config/src/env/payments.ts',
    '^\\./shipping\\.js$': ' /packages/config/src/env/shipping.ts',
    '^\\./cms\.schema\\.js$': ' /packages/config/src/env/cms.schema.ts',
    '^\\./foo\\.js$': ' /packages/config/src/env/foo.impl.ts',
    '^\\./foo\\.impl\\.ts$': ' /packages/config/src/env/foo.impl.ts',
    '^@platform-core$': ' /packages/platform-core/src/index.ts',
    '^@ui/src$': ' /packages/ui/src/index.ts',
    '^@platform-core/repositories/shopSettings$':
      ' /packages/platform-core/src/repositories/settings.server.ts',
    '^@platform-core/repositories/rentalOrders$':
      ' /packages/platform-core/src/repositories/rentalOrders.server.ts',
    '^@platform-core/repositories/pages$':
      ' /packages/platform-core/src/repositories/pages/index.server.ts',
    '^@platform-core/(.*)$': ' /packages/platform-core/src/$1',
    '^@ui/src/(.*)$': ' /packages/ui/src/$1',
    '^@config/src/env$': ' /packages/config/src/env/index.ts',
    '^@config/src/env/core$': ' /packages/config/src/env/core.ts',
    '^@config/src/env/(.*)$': ' /packages/config/src/env/$1.ts',
    '^@config/src/(.*)$': ' /packages/config/src/$1',
    '^@acme/config/env$': ' /packages/config/src/env/index.ts',
    '^@acme/config/env/core$': ' /packages/config/src/env/core.ts',
    '^@acme/config/env/(.*)$': ' /packages/config/src/env/$1.ts',
    '^@acme/config/src/(.*)$': ' /packages/config/src/$1',
    '^@acme/config$': ' /packages/config/src/env/index.ts',
    '^@acme/config/(.*)$': ' /packages/config/src/$1',
    '^@acme/platform-core$': ' /packages/platform-core/src/index.ts',
    '^@acme/platform-core/(.*)\\.js$': ' /packages/platform-core/src/$1',
    '^@acme/platform-core/(.*)$': ' /packages/platform-core/src/$1',
    '^@acme/platform-core/contexts/CurrencyContext$': ' /test/__mocks__/currencyContextMock.tsx',
    '^@acme/platform-machine/src/(.*)$': ' /packages/platform-machine/src/$1',
    '^@acme/shared-utils/src/(.*)$': ' /packages/shared-utils/src/$1',
    '^@acme/plugin-sanity$': ' /test/__mocks__/pluginSanityStub.ts',
    '^@acme/plugin-sanity/(.*)$': ' /test/__mocks__/pluginSanityStub.ts',
    '^@acme/telemetry$': ' /test/__mocks__/telemetryMock.ts',
    '^@acme/zod-utils/initZod$': ' /test/emptyModule.js',
    '^\\./env/(.*)\\.js$': ' /packages/config/src/env/$1.ts',
    '^\\./(auth|cms|email|core|payments|shipping)\\.js$': ' /packages/config/src/env/$1.ts',
    '^\\.\\./(auth|cms|email|core|payments|shipping)\\.js$': ' /packages/config/src/env/$1.ts',
    '^\\./fsStore\\.js$': ' /packages/email/src/storage/fsStore.ts',
    '^\\./storage/index\\.js$': ' /packages/email/src/storage/index.ts',
    '^\\./providers/resend\\.js$': ' /packages/email/src/providers/resend.ts',
    '^\\./providers/sendgrid\\.js$': ' /packages/email/src/providers/sendgrid.ts',
    '^\\./providers/types\\.js$': ' /packages/email/src/providers/types.ts',
    '^\\./stats\\.js$': ' /packages/email/src/stats.ts',
    '^@prisma/client$': ' /__mocks__/@prisma/client.ts',
    '^@/components/atoms/shadcn$': ' /test/__mocks__/shadcnDialogStub.tsx',
    '^@/i18n/(.*)$': ' /packages/i18n/src/$1',
    '^@/components/(.*)$': ' /test/__mocks__/componentStub.js',
    '^@/(.*)$': ' /apps/cms/src/$1',
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^@prisma/client$': ' /__mocks__/@prisma/client.ts',
    '^server-only$': ' /test/server-only-stub.ts',
    // Use resolved React paths to ensure a single instance across tests
    '^react$': reactPath,
    '^react-dom/client$': ' /test/reactDomClientShim.ts',
    '^react-dom/client\\.js$': reactDomClientPath,
    '^react-dom$': reactDomPath,
    '^react/jsx-runtime$': reactJsxRuntimePath,
    '^react/jsx-dev-runtime$': reactJsxDevRuntimePath,
    ...tsPaths,
  },
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
  passWithNoTests: true,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs', 'node', 'd.ts'],
  collectCoverage: true,
  coverageDirectory: path.join(process.cwd(), 'coverage'),
  coveragePathIgnorePatterns: [
    ' /test/msw/',
    ' /test/msw/server.ts',
    '<rootDir>/test/mswServer.ts',
    '<rootDir>/test/resetNextMocks.ts',
    '<rootDir>/test/setupFetchPolyfill.ts',
    '<rootDir>/test/setupTests.ts',
    '<rootDir>/test/reactDomClientShim.ts',
    '<rootDir>/test/polyfills/',
    '<rootDir>/test/__mocks__/',
    ' /packages/config/src/env/__tests__/',
    ' /packages/config/src/env/__test__/',
  ],
  coverageReporters: ['text', 'text-summary', 'lcov', 'json'],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
    },
  },
  rootDir: process.cwd(), // ensure paths resolve relative to each package
};

module.exports = resolveRoot(config);

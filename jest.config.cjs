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
const fs = require("fs");

const {
  resolveRoot,
  resolveReactPaths,
  loadTsPaths,
} = require("./jest.config.helpers.cjs");
const baseModuleNameMapper = require("./jest.moduleMapper.cjs");
const coverageDefaults = require("./jest.coverage.cjs");

// Prevent Browserslist from resolving config files in temporary Jest paths.
process.env.BROWSERSLIST = process.env.BROWSERSLIST || "defaults";

const tsPaths = loadTsPaths();

const {
  reactPath,
  reactDomPath,
  reactDomClientPath,
  reactJsxRuntimePath,
  reactJsxDevRuntimePath,
} = resolveReactPaths();

let moduleNameMapper = {
  ...baseModuleNameMapper,
  // Use resolved React paths to ensure a single instance across tests
  "^react$": reactPath,
  "^react-dom/client\\.js$": reactDomClientPath,
  "^react-dom$": reactDomPath,
  "^react/jsx-runtime$": reactJsxRuntimePath,
  "^react/jsx-dev-runtime$": reactJsxDevRuntimePath,
  ...tsPaths,
};

// Always mock NextAuth modules to avoid ESM-only deps and reduce per-test duplication
moduleNameMapper["^next-auth$"] = " /test/mocks/next-auth.ts";
moduleNameMapper["^next-auth/jwt$"] = " /test/mocks/next-auth-jwt.ts";
moduleNameMapper["^next-auth/react$"] = " /test/mocks/next-auth-react.ts";

// Use a lightweight test mock for core config in all packages except the config package itself
const isConfigPackage = /packages\/config$/.test(process.cwd());
const isAuthPackage = /packages\/auth$/.test(process.cwd());
if (!isConfigPackage) {
  // Ensure specific env mocks take precedence over the generic @acme/config/env/(.*) mapper
  const overrides = {
    // Mock core/shipping env for most packages; auth package uses real loaders.
    ...(isAuthPackage ? {} : { "^@acme/config/env/core$": " /test/mocks/config-env-core.ts" }),
    ...(isAuthPackage ? {} : { "^@acme/config/env/shipping$": " /test/mocks/config-env-shipping.ts" }),
  };
  const pruned = Object.fromEntries(
    Object.entries(moduleNameMapper).filter(
      ([key]) => !(key in overrides)
    )
  );
  moduleNameMapper = { ...overrides, ...pruned };
}

const isSkylarApp = /apps\/skylar$/.test(process.cwd());
if (isSkylarApp) {
  moduleNameMapper["^@/(.*)$"] = [
    " /apps/skylar/src/$1",
    " /apps/skylar/dist/$1",
  ];
}

const collectCoverageFrom = [...coverageDefaults.collectCoverageFrom];
const coveragePathIgnorePatterns = [
  ...coverageDefaults.coveragePathIgnorePatterns,
];
const coverageReporters = [...coverageDefaults.coverageReporters];
const coverageThreshold = JSON.parse(
  JSON.stringify(coverageDefaults.coverageThreshold)
);

// The scripts workspace exercises compiled Node entrypoints under dist-scripts
// rather than the TypeScript sources under scripts/src, so coverage for that
// package would otherwise report as 0% across the board. Relax thresholds
// there so test runs can still succeed while keeping strict defaults elsewhere.
const isScriptsWorkspace = /[\\/]scripts$/.test(process.cwd());
if (isScriptsWorkspace) {
  coverageThreshold.global = { lines: 0, branches: 0, functions: 0 };
}

const forceCjs = process.env.JEST_FORCE_CJS === "1";
const isPlatformCorePackage = /packages\/platform-core$/.test(process.cwd());
const isLibPackage = /packages\/lib$/.test(process.cwd());
const isI18nPackage = /packages\/i18n$/.test(process.cwd());
// Some Next.js app packages exercise pages/components that are more stable under CJS in Jest
const isCoverMePrettyApp = /apps\/cover-me-pretty$/.test(process.cwd());
const useCjsPreset =
  forceCjs || isPlatformCorePackage || isCoverMePrettyApp || isLibPackage || isI18nPackage;
const preset = useCjsPreset ? "ts-jest" : "ts-jest/presets/default-esm";
const useESM = !useCjsPreset;

const config = {
  preset,
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: useESM ? [".ts", ".tsx"] : [],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        // Prefer package-local tsconfig when available; otherwise fall back
        // to the monorepo root test config to guarantee a concrete outDir.
        tsconfig: (() => {
          const pkgTs = path.join(process.cwd(), "tsconfig.test.json");
          if (fs.existsSync(pkgTs)) return pkgTs;
          return path.join(__dirname, "tsconfig.test.json");
        })(),
        useESM,
        diagnostics: false,
        babelConfig: false,
      },
    ],
    // Transform ESM JavaScript from selected node_modules to CJS for Jest
    "^.+\\.(mjs|cjs|js)$": [
      "babel-jest",
      {
        presets: [[
          "@babel/preset-env",
          { targets: { node: "current" }, modules: "commonjs" }
        ]],
      },
    ],
  },
  transformIgnorePatterns: [
    // Transpile selected ESM dependencies (including pnpm nested paths)
    // and internal "@acme" workspace packages.
    "/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(jose|next-auth|ulid|@upstash/redis|uncrypto|msw|@mswjs/interceptors|strict-event-emitter|headers-polyfill|outvariant|until-async|@bundled-es-modules|@acme)/)",
  ],
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: [
    " /test/setupFetchPolyfill.ts", // establishes fetch/Response and imports shared react-compat
    " /jest.setup.ts",
  ],
  testPathIgnorePatterns: [
    " /test/e2e/",
    " /apps/storybook/.storybook/",
    "/apps/storybook/.storybook/test-runner/",
    " /apps/storybook/.storybook-ci/",
    "/apps/storybook/.storybook-composed/",
  ],
  moduleNameMapper,
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
  collectCoverage: coverageDefaults.collectCoverage,
  collectCoverageFrom,
  // Normalize coverage output path so all workspace packages write into
  // the monorepo root coverage directory under their own sanitized name.
  // This ensures `pnpm run test:coverage` can always find and merge results.
  coverageDirectory: (() => {
    const workspaceRoot = __dirname;
    let name = path.basename(process.cwd());
    try {
      // Prefer the package name when available (e.g. "@acme/zod-utils").
      const pkg = require(path.join(process.cwd(), "package.json"));
      if (pkg && typeof pkg.name === "string" && pkg.name.trim()) {
        name = pkg.name.trim();
      }
    } catch {
      // fall back to directory name
    }
    const sanitized = name.replace(/^@/, "").replace(/[\/]/g, "-");
    return path.join(workspaceRoot, "coverage", sanitized);
  })(),
  coveragePathIgnorePatterns,
  coverageReporters,
  coverageThreshold,
  rootDir: process.cwd(), // ensure paths resolve relative to each package
};

// Limit coverage collection to the current workspace package/app
const workspaceRoot = __dirname;
const relativePath = path
  .relative(workspaceRoot, process.cwd())
  .replace(/\\/g, "/");
if (relativePath) {
  const [scope, ...rest] = relativePath.split("/");
  const subPath = rest.join("/");
  config.collectCoverageFrom = [...coverageDefaults.collectCoverageFrom];
  const coverageIgnores = [];
  if (subPath) {
    coverageIgnores.push(`/${scope}/(?!${subPath})/`);
  }
  coverageIgnores.push(scope === "packages" ? "/apps/" : "/packages/");
  config.coveragePathIgnorePatterns.push(...coverageIgnores);
}

if (isSkylarApp) {
  config.collectCoverageFrom = [
    "src/lib/**/*.{ts,tsx}",
    "src/app/[lang]/generateStaticParams.ts",
  ];
}

module.exports = resolveRoot(config);

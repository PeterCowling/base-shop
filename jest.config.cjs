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

const moduleNameMapper = {
  ...baseModuleNameMapper,
  // Use resolved React paths to ensure a single instance across tests
  "^react$": reactPath,
  "^react-dom/client\\.js$": reactDomClientPath,
  "^react-dom$": reactDomPath,
  "^react/jsx-runtime$": reactJsxRuntimePath,
  "^react/jsx-dev-runtime$": reactJsxDevRuntimePath,
  ...tsPaths,
};

const collectCoverageFrom = [...coverageDefaults.collectCoverageFrom];
const coveragePathIgnorePatterns = [
  ...coverageDefaults.coveragePathIgnorePatterns,
];
const coverageReporters = [...coverageDefaults.coverageReporters];
const coverageThreshold = JSON.parse(
  JSON.stringify(coverageDefaults.coverageThreshold)
);

const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: path.join(process.cwd(), "tsconfig.test.json"),
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
    "/node_modules/(?!(jose|next-auth|ulid|@upstash/redis|uncrypto|@acme)/)",
  ],
  setupFiles: ["dotenv/config"],
  setupFilesAfterEnv: [
    " /test/setupFetchPolyfill.ts",
    " /jest.setup.ts",
    " /test/polyfills/messageChannel.js",
  ],
  testPathIgnorePatterns: [
    " /test/e2e/",
    " /.storybook/",
    "/.storybook/test-runner/",
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
  coverageDirectory: coverageDefaults.coverageDirectory,
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

module.exports = resolveRoot(config);

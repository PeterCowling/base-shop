/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Hybrid Jest preset with declarative options API.
 *
 * Usage:
 *   // Simple (defaults):
 *   module.exports = require("@acme/config/jest.preset.cjs")();
 *
 *   // With options:
 *   module.exports = require("@acme/config/jest.preset.cjs")({
 *     useCjs: true,           // Force CommonJS preset (no ESM)
 *     relaxCoverage: true,    // Set coverage thresholds to 0%
 *     skipEnvMocks: true,     // Don't mock @acme/config/env modules
 *     useRealEnvLoaders: true // Use real env loaders (for auth package)
 *   });
 *
 * This replaces the hard-coded app detection in the root jest.config.cjs.
 * Each package declares what it needs instead of the root config detecting
 * where it's running via process.cwd() regex checks.
 */

const path = require("path");
const fs = require("fs");

const workspaceRoot = path.resolve(__dirname, "../..");

// Import helpers and base config pieces
const {
  resolveRoot,
  resolveReactPaths,
  loadTsPaths,
} = require(path.join(workspaceRoot, "jest.config.helpers.cjs"));
const baseModuleNameMapper = require(path.join(workspaceRoot, "jest.moduleMapper.cjs"));
const coverageDefaults = require(path.join(workspaceRoot, "jest.coverage.cjs"));
const { getTier } = require(path.join(__dirname, "coverage-tiers.cjs"));

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

/**
 * @typedef {Object} JestPresetOptions
 * @property {boolean} [useCjs] - Force CommonJS preset (ts-jest instead of ts-jest/presets/default-esm)
 * @property {boolean} [relaxCoverage] - Set all coverage thresholds to 0%
 * @property {boolean} [skipEnvMocks] - Don't mock @acme/config/env modules (for config package itself)
 * @property {boolean} [useRealEnvLoaders] - Use real env loaders instead of test mocks (for auth package)
 * @property {Record<string, string|string[]>} [moduleNameMapper] - Additional module name mappings
 * @property {string[]} [coveragePathIgnorePatterns] - Additional patterns to ignore from coverage
 * @property {Object} [coverageThreshold] - Override coverage thresholds
 */

/**
 * Creates a Jest configuration with the given options.
 * @param {JestPresetOptions} [options={}]
 * @returns {import('jest').Config}
 */
function createJestPreset(options = {}) {
  const {
    useCjs = false,
    relaxCoverage = false,
    skipEnvMocks = false,
    useRealEnvLoaders = false,
    moduleNameMapper: additionalModuleNameMapper = {},
    coveragePathIgnorePatterns: additionalCoverageIgnorePatterns = [],
    coverageThreshold: customCoverageThreshold,
  } = options;

  // Build module name mapper
  // Note: baseModuleNameMapper is spread AFTER tsPaths so explicit mappings
  // (e.g., @acme/types -> src/*.ts) take precedence over tsconfig paths
  // that may point to dist/ without file extensions.
  //
  // IMPORTANT: We filter out catch-all patterns from tsPaths that conflict with
  // specific patterns in baseModuleNameMapper. Jest matches patterns in object
  // key order, and catch-alls like "^@acme/lib/(.*)$" must come AFTER specific
  // patterns like "^@acme/lib/logger$" to work correctly.
  const catchAllPatterns = new Set(
    Object.keys(tsPaths).filter(k => k.includes("(.*)"))
  );
  const specificPatterns = new Set(
    Object.keys(baseModuleNameMapper).filter(k => !k.includes("(.*)"))
  );
  // Remove catch-all patterns from tsPaths that have specific overrides in baseModuleNameMapper
  const filteredTsPaths = Object.fromEntries(
    Object.entries(tsPaths).filter(([key]) => {
      if (!catchAllPatterns.has(key)) return true;
      // Check if any specific pattern in baseModuleNameMapper would match the same prefix
      const prefix = key.replace(/\(\.\*\)\$$/, "");
      const hasSpecificOverride = [...specificPatterns].some(sp => sp.startsWith(prefix));
      return !hasSpecificOverride;
    })
  );
  let moduleNameMapper = {
    ...filteredTsPaths,
    ...baseModuleNameMapper,
    // Use resolved React paths to ensure a single instance across tests
    "^react$": reactPath,
    "^react-dom/client\\.js$": reactDomClientPath,
    "^react-dom$": reactDomPath,
    "^react/jsx-runtime$": reactJsxRuntimePath,
    "^react/jsx-dev-runtime$": reactJsxDevRuntimePath,
  };

  // Always mock NextAuth modules to avoid ESM-only deps and reduce per-test duplication
  moduleNameMapper["^next-auth$"] = " /test/mocks/next-auth.ts";
  moduleNameMapper["^next-auth/jwt$"] = " /test/mocks/next-auth-jwt.ts";
  moduleNameMapper["^next-auth/react$"] = " /test/mocks/next-auth-react.ts";

  // Apply env mocking unless explicitly skipped (for config package)
  if (!skipEnvMocks) {
    const overrides = {
      // Mock core/shipping env for most packages; useRealEnvLoaders skips these
      ...(useRealEnvLoaders ? {} : { "^@acme/config/env/core$": " /test/mocks/config-env-core.ts" }),
      ...(useRealEnvLoaders ? {} : { "^@acme/config/env/shipping$": " /test/mocks/config-env-shipping.ts" }),
    };
    const pruned = Object.fromEntries(
      Object.entries(moduleNameMapper).filter(
        ([key]) => !(key in overrides)
      )
    );
    moduleNameMapper = { ...overrides, ...pruned };
  }

  // Apply any additional module name mappings from options
  moduleNameMapper = { ...moduleNameMapper, ...additionalModuleNameMapper };

  // Jest resolves `moduleNameMapper` entries in insertion order, and the first
  // matching pattern wins. When we merge `tsconfig` path mappings with the
  // monorepo mapper, catch-all patterns like `^@acme/lib/(.*)$` can end up
  // earlier than specific overrides (e.g. `^@acme/lib/logger$`) due to object
  // property overwrite semantics preserving insertion order. Reorder the
  // resulting mapper so specific overrides are always evaluated first.
  {
    const libOverrides = {};
    const libCatchAll = {};

    for (const key of [
      "^@acme/lib/logger$",
      "^@acme/lib/context$",
      "^@acme/lib/http/server$",
    ]) {
      if (key in moduleNameMapper) libOverrides[key] = moduleNameMapper[key];
    }

    const catchAllKey = "^@acme/lib/(.*)$";
    if (catchAllKey in moduleNameMapper) {
      libCatchAll[catchAllKey] = moduleNameMapper[catchAllKey];
    }

    if (Object.keys(libOverrides).length > 0 || Object.keys(libCatchAll).length > 0) {
      const pruned = Object.fromEntries(
        Object.entries(moduleNameMapper).filter(
          ([key]) => !(key in libOverrides) && !(key in libCatchAll),
        ),
      );
      moduleNameMapper = { ...libOverrides, ...pruned, ...libCatchAll };
    }
  }

  // Reorder platform-core mappings to ensure specific patterns come before catch-all
  {
    const platformCoreOverrides = {};
    const platformCoreCatchAll = {};

    for (const key of [
      "^@acme/platform-core$",
      "^@acme/platform-core/repositories/pages$",
      "^@acme/platform-core/repositories/pages/index.server$",
      "^@acme/platform-core/contexts/CurrencyContext$",
    ]) {
      if (key in moduleNameMapper) platformCoreOverrides[key] = moduleNameMapper[key];
    }

    const catchAllJsKey = "^@acme/platform-core/(.*)\\.js$";
    const catchAllKey = "^@acme/platform-core/(.*)$";
    if (catchAllJsKey in moduleNameMapper) {
      platformCoreCatchAll[catchAllJsKey] = moduleNameMapper[catchAllJsKey];
    }
    if (catchAllKey in moduleNameMapper) {
      platformCoreCatchAll[catchAllKey] = moduleNameMapper[catchAllKey];
    }

    if (Object.keys(platformCoreOverrides).length > 0 || Object.keys(platformCoreCatchAll).length > 0) {
      const pruned = Object.fromEntries(
        Object.entries(moduleNameMapper).filter(
          ([key]) => !(key in platformCoreOverrides) && !(key in platformCoreCatchAll),
        ),
      );
      moduleNameMapper = { ...platformCoreOverrides, ...pruned, ...platformCoreCatchAll };
    }
  }

  // Build coverage configuration
  const collectCoverageFrom = [...coverageDefaults.collectCoverageFrom];
  const coveragePathIgnorePatterns = [
    ...coverageDefaults.coveragePathIgnorePatterns,
    ...additionalCoverageIgnorePatterns,
  ];
  const coverageReporters = [...coverageDefaults.coverageReporters];
  const wantsCoverage =
    process.argv.includes("--coverage") ||
    process.env.JEST_FORCE_COVERAGE === "1";
  const collectCoverage = wantsCoverage
    ? coverageDefaults.collectCoverage
    : false;
  // Auto-detect coverage tier from package.json name if no custom threshold provided
  let coverageThreshold;
  if (customCoverageThreshold) {
    coverageThreshold = JSON.parse(JSON.stringify(customCoverageThreshold));
  } else {
    let detectedTier;
    try {
      const pkg = require(path.join(process.cwd(), "package.json"));
      if (pkg && typeof pkg.name === "string" && pkg.name.trim()) {
        detectedTier = getTier(pkg.name.trim());
      }
    } catch {
      // fall back to default
    }
    coverageThreshold = JSON.parse(JSON.stringify(detectedTier || coverageDefaults.coverageThreshold));
  }

  // Relax coverage if requested or for targeted runs
  const isTargetedRun =
    process.argv.includes("--runTestsByPath") ||
    process.argv.some((arg) => arg.startsWith("--testPathPattern"));
  if (relaxCoverage || isTargetedRun || process.env.JEST_ALLOW_PARTIAL_COVERAGE === "1") {
    coverageThreshold = { global: { lines: 0, branches: 0, functions: 0 } };
  }

  // Determine preset based on options or env
  const forceCjs = process.env.JEST_FORCE_CJS === "1";
  const useESM = !(useCjs || forceCjs);
  const preset = useESM ? "ts-jest/presets/default-esm" : "ts-jest";

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
            return path.join(workspaceRoot, "tsconfig.test.json");
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
      path.join(workspaceRoot, "test/setupFetchPolyfill.ts"),
      path.join(workspaceRoot, "jest.setup.ts"),
    ],
    testPathIgnorePatterns: [
      path.join(workspaceRoot, "test/e2e/"),
      path.join(workspaceRoot, "apps/storybook/.storybook/"),
      "/apps/storybook/.storybook/test-runner/",
      path.join(workspaceRoot, "apps/storybook/.storybook-ci/"),
      "/apps/storybook/.storybook-composed/",
    ],
    // Avoid duplicate manual mocks from worktrees and ts-jest cache artifacts.
    modulePathIgnorePatterns: [
      "<rootDir>/.worktrees/",
      "<rootDir>/.ts-jest/",
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
    collectCoverage,
    collectCoverageFrom,
    // Normalize coverage output path so all workspace packages write into
    // the monorepo root coverage directory under their own sanitized name.
    coverageDirectory: (() => {
      let name = path.basename(process.cwd());
      try {
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
    rootDir: process.cwd(),
  };

  // Limit coverage collection to the current workspace package/app
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

  return resolveRoot(config);
}

// Export the factory function as the module
module.exports = createJestPreset;

// Also export a pre-built default config for backwards compatibility
// This allows both:
//   const preset = require("@acme/config/jest.preset.cjs");
//   module.exports = preset();
// And:
//   const base = require("@acme/config/jest.preset.cjs");
//   module.exports = { ...base, ... }; // Works because base is a function with spread props

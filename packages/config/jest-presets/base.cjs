/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Base Jest configuration preset.
 *
 * Provides core transform configuration, file extensions, test patterns,
 * and coverage directory logic shared across all test environments.
 *
 * Individual presets (react.cjs, node.cjs) extend this base and add
 * environment-specific settings.
 */

const path = require("path");
const fs = require("fs");

/**
 * Normalize coverage output path so all workspace packages write into
 * the monorepo root coverage directory under their own sanitized name.
 *
 * This ensures `pnpm run test:coverage` can always find and merge results.
 *
 * CRITICAL: Package name sanitization must match existing behavior to prevent
 * breaking coverage aggregation workflows.
 */
function getCoverageDirectory() {
  // Resolve workspace root by traversing up from this file
  const workspaceRoot = path.resolve(__dirname, "../../..");

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

  // Sanitize: strip leading '@', replace slashes with hyphens
  const sanitized = name.replace(/^@/, "").replace(/[\/]/g, "-");
  return path.join(workspaceRoot, "coverage", sanitized);
}

module.exports = {
  // Transform configuration
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        // Prefer package-local tsconfig when available; otherwise fall back
        // to the monorepo root test config to guarantee a concrete outDir.
        tsconfig: (() => {
          const pkgTs = path.join(process.cwd(), "tsconfig.test.json");
          if (fs.existsSync(pkgTs)) return pkgTs;
          // Resolve to workspace root tsconfig.test.json
          return path.join(__dirname, "../../..", "tsconfig.test.json");
        })(),
        useESM: true,
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

  // File extensions Jest should recognize
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

  // Test file patterns
  testMatch: ["**/?(*.)+(spec|test).ts?(x)"],

  // Allow empty test suites to pass (useful for new packages)
  passWithNoTests: true,

  // Transpile selected ESM dependencies (including pnpm nested paths)
  // and internal "@acme" workspace packages.
  transformIgnorePatterns: [
    "/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(jose|next-auth|ulid|@upstash/redis|uncrypto|msw|@mswjs/interceptors|strict-event-emitter|headers-polyfill|outvariant|until-async|@bundled-es-modules|@acme)/)",
  ],

  // Setup files
  setupFiles: ["dotenv/config"],

  // Paths to ignore during testing
  testPathIgnorePatterns: [
    "/test/e2e/",
    "/apps/storybook/.storybook/",
    "/apps/storybook/.storybook/test-runner/",
    "/apps/storybook/.storybook-ci/",
    "/apps/storybook/.storybook-composed/",
  ],

  // Coverage configuration
  coverageDirectory: getCoverageDirectory(),

  // Ensure paths resolve relative to each package
  rootDir: process.cwd(),
};

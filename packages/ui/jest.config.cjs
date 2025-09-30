/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config allowing local overrides to reduce flakiness
// for targeted runs. Inherit the monorepo config and optionally relax
// coverage thresholds via env var.

const path = require("path");
const base = require("../../jest.config.cjs");

// Clone to avoid mutating the shared object
const config = { ...base, coverageThreshold: { ...(base.coverageThreshold || {}) } };

// Force CommonJS in this package to make Jest module mocking simpler
// for tests that rely on jest.doMock/require semantics.
config.preset = "ts-jest";
config.extensionsToTreatAsEsm = [];

// Ensure ts-jest uses this package's local tsconfig, not the repo root one
try {
  const tsTransform = base.transform && base.transform["^.+\\.(ts|tsx)$"];
  if (Array.isArray(tsTransform)) {
    const [, opts] = tsTransform;
    config.transform = {
      ...base.transform,
      "^.+\\.(ts|tsx)$": [
        "ts-jest",
        {
          ...(opts || {}),
          useESM: false,
          tsconfig: path.join(__dirname, "tsconfig.test.json"),
        },
      ],
    };
  }
} catch {
  // fall through if base structure changes
}

if (process.env.JEST_DISABLE_COVERAGE_THRESHOLD === "1") {
  config.coverageThreshold = {
    global: { lines: 0, branches: 0, functions: 0 },
  };
}

// Ensure a UI-local setup runs before the repo-wide setup to polyfill
// missing browser globals used by shared test utilities (e.g. MSW v2).
config.setupFilesAfterEnv = [
  path.join(__dirname, "jest.setup.local.ts"),
  ...(base.setupFilesAfterEnv || []),
];

// Transform additional ESM dependencies used by MSW in this package
config.transformIgnorePatterns = [
  // Allow ESM deps used by MSW (account for pnpm nested layout)
  "/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(jose|next-auth|ulid|@upstash/redis|uncrypto|@acme|msw|@mswjs/interceptors|strict-event-emitter|headers-polyfill|outvariant|until-async|@bundled-es-modules)/)",
];

// UI package: scope coverage to generic, app-agnostic UI only
// Exclude CMS/page-builder and app templates from coverage until migrated
config.coveragePathIgnorePatterns = Array.from(
  new Set([
    ...(config.coveragePathIgnorePatterns || []),
    // CMS + page-builder namespaces are domain/app code
    `<rootDir>/src/components/cms/`,
    `<rootDir>/src/components/templates/`,
    // Pure data/constant tables (no logic) — ignore for coverage signal
    // icons, images, palettes, presets, lottie, built-in sections, motion presets
    `/icons\\.ts$`,
    `/preview(Images|Image|Thumbs)?\\.ts$`,
    `/palette(.*)\\.ts$`,
    `/presets(.*)\\.ts$`,
    `/lottie(.*)\\.ts$`,
    `/builtInSections(.*)\\.ts$`,
    `/motion(.*)presets(.*)\\.ts$`,
    `/\\.data\\.ts$`,
  ])
);

// Hold @acme/ui to a strict bar independent of app/CMS code
config.coverageThreshold = {
  global: {
    lines: 90,
    functions: 90,
    branches: 85,
  },
};

module.exports = config;

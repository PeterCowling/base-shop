/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config - uses CJS preset for simpler jest.doMock/require semantics.

const path = require("path");

// Use CJS preset for this package
const config = require("@acme/config/jest.preset.cjs")({
  useCjs: true,
});

// Ensure ts-jest uses this package's local tsconfig, not the repo root one
const baseTsTransform = config.transform && config.transform["^.+\\.(ts|tsx)$"];
const baseTsJestOptions = Array.isArray(baseTsTransform) ? baseTsTransform[1] : {};

config.transform = {
  ...config.transform,
  "^.+\\.(ts|tsx)$": [
    "ts-jest",
    {
      ...(baseTsJestOptions || {}),
      useESM: false,
      tsconfig: path.join(__dirname, "tsconfig.test.json"),
      isolatedModules: false,
      diagnostics: false,
    },
  ],
};

const disableCoverageThreshold = process.env.JEST_DISABLE_COVERAGE_THRESHOLD === "1";
if (disableCoverageThreshold) {
  config.coverageThreshold = {
    global: { lines: 0, branches: 0, functions: 0 },
  };
}

// Ensure a UI-local setup runs before the repo-wide setup to polyfill
// missing browser globals used by shared test utilities (e.g. MSW v2).
config.setupFilesAfterEnv = [
  path.join(__dirname, "jest.setup.local.ts"),
  ...(config.setupFilesAfterEnv || []),
];

// Ensure "@/..." resolves to UI sources instead of the CMS alias in base config.
config.moduleNameMapper = {
  ...(config.moduleNameMapper || {}),
  "^@/(.*)$": "<rootDir>/src/$1",
};

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
if (!disableCoverageThreshold) {
  config.coverageThreshold = {
    global: {
      lines: 90,
      functions: 90,
      branches: 85,
    },
  };
}

module.exports = config;

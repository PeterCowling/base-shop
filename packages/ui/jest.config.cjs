/* eslint-disable @typescript-eslint/no-require-imports */
// Package-scoped Jest config allowing local overrides to reduce flakiness
// for targeted runs. Inherit the monorepo config and optionally relax
// coverage thresholds via env var.

const path = require("path");
const base = require("../../jest.config.cjs");

// Clone to avoid mutating the shared object
const config = { ...base, coverageThreshold: { ...(base.coverageThreshold || {}) } };

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

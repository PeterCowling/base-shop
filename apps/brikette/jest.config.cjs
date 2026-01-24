/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

// Brikette app needs custom @/ alias mapping for Jest
const config = require("@acme/config/jest.preset.cjs")({
  moduleNameMapper: {
    // Standard @/ alias for brikette-local imports
    "^@/(.*)$": [
      path.resolve(__dirname, "src/$1"),
      path.resolve(__dirname, "dist/$1"),
    ],
  },
});

// Override module mapper - specific mocks must come BEFORE generic @/ pattern
// Jest processes patterns in order, so we need to restructure the mapper
const originalMapper = config.moduleNameMapper;
const newMapper = {};

// --- Specific mocks (must come before generic patterns) ---

// config/env uses import.meta which Jest can't handle in CJS mode
const envMock = path.resolve(__dirname, "src/test/__mocks__/config-env.ts");
newMapper["^@/config/env$"] = envMock;
newMapper["^\\.+/config/env$"] = envMock;

// webpackGlob.ts uses import.meta which Jest CJS mode can't parse
// Match both @/ alias and relative imports (../utils/webpackGlob from locales/)
const webpackGlobMock = path.resolve(__dirname, "src/test/__mocks__/webpackGlob.ts");
newMapper["^@/utils/webpackGlob$"] = webpackGlobMock;
newMapper["(\\.\\.?/)+utils/webpackGlob$"] = webpackGlobMock;

// guides.fs.ts uses import.meta.url (for createRequire) which Jest can't parse
const guidesFsMock = path.resolve(__dirname, "src/test/__mocks__/guides-fs.ts");
newMapper["^@/locales/guides\\.fs$"] = guidesFsMock;
newMapper["\\.?/guides\\.fs$"] = guidesFsMock;

// i18n.ts uses import.meta.url in the Node fallback branch; mock globally
// Tests that need custom i18n behavior can override with jest.mock("@/i18n", ...)
newMapper["^@/i18n$"] = path.resolve(__dirname, "src/test/__mocks__/i18n.ts");

// loadI18nNs.ts uses import.meta.url (createRequire pattern); mock globally
newMapper["^@/utils/loadI18nNs$"] = path.resolve(__dirname, "src/test/__mocks__/loadI18nNs.ts");

// @acme/ui/context/modal/ imports environment.ts which uses import.meta;
// mock the entire module to avoid the dependency chain.
// Also mock brikette-local re-exports that chain through to @acme/ui.
const modalMock = path.resolve(__dirname, "src/test/__mocks__/ui-modal-context.tsx");
newMapper["^@acme/ui/context/ModalContext$"] = modalMock;
newMapper["^@acme/ui/context/modal/(.*)$"] = modalMock;
newMapper["^@/context/ModalContext$"] = modalMock;
newMapper["^@/context/modal/context$"] = modalMock;
newMapper["^@/context/modal/hooks$"] = modalMock;
newMapper["^@/context/modal/provider$"] = modalMock;
// Catch relative imports of ModalContext from within workspace packages (e.g. packages/ui)
newMapper["(\\.\\.\\/)+context/ModalContext$"] = modalMock;
newMapper["(\\.\\.\\/)+context/modal/hooks$"] = modalMock;
newMapper["(\\.\\.\\/)+context/modal/context$"] = modalMock;

// @acme/ui/config/site and baseUrl use import.meta for URL detection
const siteConfigMock = path.resolve(__dirname, "src/test/__mocks__/ui-config-site.ts");
newMapper["^@acme/ui/config/site$"] = siteConfigMock;
newMapper["^@acme/ui/config/baseUrl$"] = siteConfigMock;

// buildCfImageUrl.ts and cfLibImage.ts use import.meta; mock to avoid parse errors
const buildCfMock = path.resolve(__dirname, "src/test/__mocks__/buildCfImageUrl.ts");
newMapper["^@/lib/buildCfImageUrl$"] = buildCfMock;
newMapper["^@/lib/cfLibImage$"] = buildCfMock;

// @acme/ui/atoms (and sub-paths) import buildCfImageUrl which uses import.meta.env
const uiAtomsMock = path.resolve(__dirname, "src/test/__mocks__/ui-atoms.tsx");
newMapper["^@acme/ui/atoms$"] = uiAtomsMock;
newMapper["^@acme/ui/atoms/(.*)$"] = uiAtomsMock;

// @acme/design-system sub-path exports (Jest doesn't support package.json "exports" field)
const dsPrimitivesStub = path.resolve(__dirname, "src/test/__mocks__/design-system-primitives.ts");
newMapper["^@acme/design-system/primitives$"] = dsPrimitivesStub;
newMapper["^@acme/design-system/atoms/(.*)$"] = dsPrimitivesStub;

// @tests/ alias for test utilities
newMapper["^@tests/(.*)$"] = path.resolve(__dirname, "src/test/$1");

// --- Copy remaining original mappers, filtering out CMS-specific stubs ---
// The shared preset's jest.moduleMapper.cjs includes patterns designed for the CMS app
// (e.g. ^@/components/(.*)$ → componentStub.js) that incorrectly replace brikette's
// real component imports with empty stubs.
const cmsOnlyPatterns = new Set([
  "^@/components/(.*)$",  // maps to componentStub.js (CMS-only)
  "^@/(.*)$",             // maps to apps/cms/src/$1 (CMS-only)
]);
for (const [key, value] of Object.entries(originalMapper)) {
  if (cmsOnlyPatterns.has(key)) continue;
  // Also skip any pattern whose value resolves to componentStub
  const valueStr = Array.isArray(value) ? value.join(" ") : String(value);
  if (valueStr.includes("componentStub")) continue;
  newMapper[key] = value;
}

// Re-add brikette's own @/ catch-all alias (must come AFTER all specific patterns)
newMapper["^@/(.*)$"] = [
  path.resolve(__dirname, "src/$1"),
  path.resolve(__dirname, "dist/$1"),
];

config.moduleNameMapper = newMapper;

// Override transform to use our custom import.meta-stripping wrapper around ts-jest.
// This handles import.meta in workspace package source files (packages/ui, etc.)
// that can't be caught by moduleNameMapper (relative imports within packages).
const existingTsJestOptions =
  config.transform?.["^.+\\.(ts|tsx)$"]?.[1] ?? {};
config.transform = {
  ...config.transform,
  "^.+\\.(ts|tsx)$": [
    path.resolve(__dirname, "src/test/jest-import-meta-transform.cjs"),
    existingTsJestOptions,
  ],
};

// Exclude tests that require import.meta (Vite/ESM-only features not available in Jest CJS)
config.testPathIgnorePatterns = [
  ...(config.testPathIgnorePatterns || []),
  // Vitest-only coverage tests (use vitest APIs and import.meta.url)
  "guides/__tests__/coverage/",
  // Tests whose source modules use import.meta.url (createRequire pattern)
  "loadI18nNs\\.test\\.ts$",
  "loadI18nNs\\.client-and-preload\\.test\\.ts$",
  // Tests that use import.meta.env (Vite environment variable access)
  "cfLibImage\\.test\\.ts$",
  "buildCfImageUrl\\.test\\.ts$",
];

module.exports = config;

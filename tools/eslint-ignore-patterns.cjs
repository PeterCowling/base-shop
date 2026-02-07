/**
 * Shared ESLint ignore patterns.
 *
 * Source of truth lives here so scripts can respect the same ignores as
 * `eslint.config.mjs` without importing the ESLint config (which can execute
 * Next.js' eslint patching logic and fail outside the ESLint CLI).
 */
module.exports = [
  "node_modules/",
  "dist-types/",
  "**/dist/**",
  "**/*.tsbuildinfo",
  "packages/auth/dist/",
  "packages/configurator/bin/**",
  "**/.next/**",
  "**/.vercel/**",
  "**/.wrangler/**",
  "**/storybook-static/**",
  "apps/skylar/out/**",
  "apps/*/out/**",
  "packages/cypress-image-snapshot/**",
  "**/build/**",
  "**/coverage/**",
  "**/*.d.ts.map",
  "**/*.json",
  "**/index.js",
  "packages/ui/src/**/*.js",
  "packages/ui/src/**/*.d.ts",
  "packages/ui/src/**/*.d.ts.map",
  // Ignore compiled JS files in package src directories (TypeScript emits these)
  "packages/*/src/**/*.js",
  "packages/*/src/**/*.d.ts",
  // Ignore ts-jest cache/build artifacts
  "**/.ts-jest/**",
  "apps/*/src/**/*.js",
  "apps/*/src/**/*.d.ts",
  "apps/*/src/**/*.js.map",
  "packages/config/test/**",
  "**/__mocks__/**",
  "**/jest.setup*.{ts,tsx}",
  "**/jest.config.*",
  "**/postcss.config.*",
  "packages/config/jest.preset.cjs",
  "apps/api/jest.config.cjs",
  "apps/api/postcss.config.cjs",
  // Brikette: exempt temporarily (tsconfig extends chain resolution issue with import resolver)
  "apps/brikette/**",
  // Cypress files: exempt from main linting (type-aware rules crash during init without project)
  "apps/cms/cypress/**",
  "apps/cms/cypress.config.mjs",
  // Vendor WASM transcoder files
  "**/public/ktx2/basis_transcoder.js",
];

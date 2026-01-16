/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Workspace package path mappings for Jest.
 *
 * Maps @acme/* and internal package aliases to their source directories.
 * Uses ARRAY format [pattern, replacement] to preserve ordering.
 *
 * CRITICAL: Order matters! More specific patterns must come before general ones.
 */

module.exports = [
  // Test fixture alias
  ["^~test/(.*)$", " /test/$1"],

  // MSW node entry resolution
  ["^msw/node$", " /node_modules/msw/lib/node/index.mjs"],

  // @acme/platform-core - specific submodules first
  ["^@platform-core$", " /packages/platform-core/src/index.ts"],
  [
    "^@platform-core/repositories/shopSettings$",
    " /packages/platform-core/src/repositories/settings.server.ts",
  ],
  [
    "^@platform-core/repositories/rentalOrders$",
    " /packages/platform-core/src/repositories/rentalOrders.server.ts",
  ],
  [
    "^@platform-core/repositories/pages$",
    " /packages/platform-core/src/repositories/pages/index.server.ts",
  ],
  ["^@platform-core/(.*)$", " /packages/platform-core/src/$1"],
  ["^@acme/platform-core$", " /packages/platform-core/src/index.ts"],
  ["^@acme/platform-core/(.*)\\.js$", " /packages/platform-core/src/$1"],
  ["^@acme/platform-core/(.*)$", " /packages/platform-core/src/$1"],

  // @acme/ui - UI design system
  ["^@ui/src$", " /packages/ui/src/index.ts"],
  ["^@ui/src/(.*)$", " /packages/ui/src/$1"],

  // @acme/config - configuration package
  ["^@config/src/env$", " /packages/config/src/env/index.ts"],
  ["^@config/src/env/core$", " /packages/config/src/env/core.ts"],
  ["^@config/src/env/(.*)$", " /packages/config/src/env/$1.ts"],
  ["^@config/src/(.*)$", " /packages/config/src/$1"],
  ["^@acme/config/env$", " /packages/config/src/env/index.ts"],
  ["^@acme/config/env/core$", " /packages/config/src/env/core.ts"],
  ["^@acme/config/env/(.*)$", " /packages/config/src/env/$1.ts"],
  ["^@acme/config/src/(.*)$", " /packages/config/src/$1"],
  ["^@acme/config$", " /packages/config/src/env/index.ts"],
  ["^@acme/config/(.*)$", " /packages/config/src/$1"],

  // @acme/page-builder-core
  ["^@acme/page-builder-core$", " /packages/page-builder-core/src/index.ts"],
  ["^@acme/page-builder-core/(.*)$", " /packages/page-builder-core/src/$1"],

  // @acme/i18n - internationalization
  ["^@acme/i18n$", " /packages/i18n/src/index.ts"],
  ["^@acme/i18n/(.*)$", " /packages/i18n/src/$1"],

  // @acme/sanity - CMS integration
  ["^@acme/sanity$", " /packages/sanity/src/index.ts"],
  ["^@acme/sanity/(.*)$", " /packages/sanity/src/$1"],

  // @acme/platform-machine - XState machines
  ["^@acme/platform-machine/src/(.*)$", " /packages/platform-machine/src/$1"],

  // @acme/shared-utils
  ["^@acme/shared-utils/src/(.*)$", " /packages/shared-utils/src/$1"],

  // Theme mappings - workspace themes
  [
    "^@themes/(.*)/tailwind-tokens$",
    " /packages/themes/$1/tailwind-tokens/src/index.ts",
  ],
  ["^@themes/(.*)$", " /packages/themes/$1/src/index.ts"],

  // Theme mappings - package-local fixtures
  [
    "^@themes-local/(.*)/tailwind-tokens$",
    " /packages/platform-core/themes/$1/tailwind-tokens/src/index.ts",
  ],
  ["^@themes-local/(.*)$", " /packages/platform-core/themes/$1/src/index.ts"],

  // App-specific @/ alias mappings (used in CMS and other apps)
  ["^@/i18n/(.*)$", " /packages/i18n/src/$1"],
  ["^@/(.*)$", " /apps/cms/src/$1"],
];

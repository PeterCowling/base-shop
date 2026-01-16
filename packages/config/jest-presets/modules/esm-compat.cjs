/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * ESM compatibility mappings for Jest.
 *
 * Maps ESM-style .js specifiers to their TypeScript sources.
 * This is necessary because TypeScript generates .js imports in compiled output,
 * but Jest needs to resolve to the original .ts files.
 *
 * Uses ARRAY format [pattern, replacement] to preserve ordering.
 */

module.exports = [
  // Generic: Support ESM-style relative specifiers (./foo.js) in TS sources during Jest runs
  ["^(\\.{1,2}/.*)\\.js$", "$1"],

  // Specific @acme/config env module mappings - core and submodules
  ["^\\./dataRoot\\.js$", " /packages/platform-core/src/dataRoot.ts"],
  ["^\\./auth\\.js$", " /packages/config/src/env/auth.ts"],
  ["^\\./cms\\.js$", " /packages/config/src/env/cms.ts"],
  ["^\\./email\\.js$", " /packages/config/src/env/email.ts"],
  ["^\\./core\\.js$", " /packages/config/src/env/core.ts"],
  ["^\\./env/core\\.js$", " /packages/config/src/env/core.ts"],
  ["^\\./payments\\.js$", " /packages/config/src/env/payments.ts"],
  ["^\\./shipping\\.js$", " /packages/config/src/env/shipping.ts"],
  ["^\\./cms\\.schema\\.js$", " /packages/config/src/env/cms.schema.ts"],
  ["^\\./foo\\.js$", " /packages/config/src/env/foo.impl.ts"],
  ["^\\./foo\\.impl\\.ts$", " /packages/config/src/env/foo.impl.ts"],

  // Config core internal mappings
  ["^\\./core/require-env\\.js$", " /packages/config/src/env/core/require-env.ts"],
  ["^\\./core/schema\\.base-merge\\.js$", " /packages/config/src/env/core/schema.base-merge.ts"],
  ["^\\./core/refinement\\.deposit\\.js$", " /packages/config/src/env/core/refinement.deposit.ts"],
  ["^\\./core/schema\\.core\\.js$", " /packages/config/src/env/core/schema.core.ts"],
  ["^\\./core/loader\\.parse\\.js$", " /packages/config/src/env/core/loader.parse.ts"],
  ["^\\./core/runtime\\.proxy\\.js$", " /packages/config/src/env/core/runtime.proxy.ts"],
  ["^\\./core/runtime\\.prod-failfast\\.js$", " /packages/config/src/env/core/runtime.prod-failfast.ts"],
  ["^\\./core/runtime\\.test-auth-init\\.js$", " /packages/config/src/env/core/runtime.test-auth-init.ts"],
  ["^\\./core/schema\\.base\\.js$", " /packages/config/src/env/core/schema.base.ts"],

  // When resolving from within src/env/core/*, map local .js specifiers to TS
  ["^\\./schema\\.base\\.js$", " /packages/config/src/env/core/schema.base.ts"],
  ["^\\./schema\\.base-merge\\.js$", " /packages/config/src/env/core/schema.base-merge.ts"],
  ["^\\./constants\\.js$", " /packages/config/src/env/core/constants.ts"],
  ["^\\./schema\\.preprocess\\.js$", " /packages/config/src/env/core/schema.preprocess.ts"],
  ["^\\./schema\\.core\\.js$", " /packages/config/src/env/core/schema.core.ts"],
  ["^\\./refinement\\.deposit\\.js$", " /packages/config/src/env/core/refinement.deposit.ts"],
  ["^\\./loader\\.parse\\.js$", " /packages/config/src/env/core/loader.parse.ts"],
  ["^\\./runtime\\.resolve-loader\\.js$", " /packages/config/src/env/core/runtime.resolve-loader.ts"],
  ["^\\./env\\.snapshot\\.js$", " /packages/config/src/env/core/env.snapshot.ts"],
  ["^\\./runtime\\.proxy\\.js$", " /packages/config/src/env/core/runtime.proxy.ts"],
  ["^\\./runtime\\.prod-failfast\\.js$", " /packages/config/src/env/core/runtime.prod-failfast.ts"],
  ["^\\./runtime\\.test-auth-init\\.js$", " /packages/config/src/env/core/runtime.test-auth-init.ts"],

  // Map references to sibling schemas used by core internals
  ["^\\.\\./cms\\.schema\\.js$", " /packages/config/src/env/cms.schema.ts"],
  ["^\\.\\./email\\.schema\\.js$", " /packages/config/src/env/email.schema.ts"],
  ["^\\.\\./payments\\.js$", " /packages/config/src/env/payments.ts"],

  // Email package ESM mappings
  ["^\\./fsStore\\.js$", " /packages/email/src/storage/fsStore.ts"],
  ["^\\./storage/index\\.js$", " /packages/email/src/storage/index.ts"],
  ["^\\./providers/resend\\.js$", " /packages/email/src/providers/resend.ts"],
  ["^\\./providers/sendgrid\\.js$", " /packages/email/src/providers/sendgrid.ts"],
  ["^\\./providers/types\\.js$", " /packages/email/src/providers/types.ts"],
  ["^\\./stats\\.js$", " /packages/email/src/stats.ts"],

  // Generic config env patterns (for modules we might have missed above)
  ["^\\./env/(.*)\\.js$", " /packages/config/src/env/$1.ts"],
  ["^\\./(auth|cms|email|core|payments|shipping)\\.js$", " /packages/config/src/env/$1.ts"],
  ["^\\.\\./(auth|cms|email|core|payments|shipping)\\.js$", " /packages/config/src/env/$1.ts"],
];

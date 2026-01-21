const interceptorsClientRequestPath = (() => {
  try {
    return require.resolve("@mswjs/interceptors/ClientRequest", {
      paths: [__dirname],
    });
  } catch {
    return null;
  }
})();

const moduleMapper = {
  "^~test/(.*)$": " /test/$1",
  // Ensure Jest can resolve MSW's node entry in all packages
  "^msw/node$": " /node_modules/msw/lib/node/index.mjs",
  // Avoid hard-coding "@mswjs/interceptors" subpaths: pnpm may nest them
  // beneath MSW's own node_modules, so we resolve at runtime below instead.
  "^.+\\.d\\.ts$": " /test/emptyModule.ts",
  // Support ESM-style relative specifiers (./foo.js) in TS sources during Jest runs
  "^(\\.{1,2}/.*)\\.js$": "$1",
  "^\\./dataRoot\\.js$": " /packages/platform-core/src/dataRoot.ts",
  "^\\./auth\\.js$": " /packages/config/src/env/auth.ts",
  "^\\./cms\\.js$": " /packages/config/src/env/cms.ts",
  "^\\./email\\.js$": " /packages/config/src/env/email.ts",
  "^\\./core\\.js$": " /packages/config/src/env/core.ts",
  "^\\./env/core\\.js$": " /packages/config/src/env/core.ts",
  "^\\./payments\\.js$": " /packages/config/src/env/payments.ts",
  "^\\./shipping\\.js$": " /packages/config/src/env/shipping.ts",
  "^\\./cms\\.schema\\.js$": " /packages/config/src/env/cms.schema.ts",
  "^\\./foo\\.js$": " /packages/config/src/env/foo.impl.ts",
  "^\\./foo\\.impl\\.ts$": " /packages/config/src/env/foo.impl.ts",
  // Map internal ESM-style .js specifiers used within config core to their TS sources
  "^\\./core/require-env\\.js$": " /packages/config/src/env/core/require-env.ts",
  "^\\./core/schema\\.base-merge\\.js$": " /packages/config/src/env/core/schema.base-merge.ts",
  "^\\./core/refinement\\.deposit\\.js$": " /packages/config/src/env/core/refinement.deposit.ts",
  "^\\./core/schema\\.core\\.js$": " /packages/config/src/env/core/schema.core.ts",
  "^\\./core/loader\\.parse\\.js$": " /packages/config/src/env/core/loader.parse.ts",
  "^\\./core/runtime\\.proxy\\.js$": " /packages/config/src/env/core/runtime.proxy.ts",
  "^\\./core/runtime\\.prod-failfast\\.js$": " /packages/config/src/env/core/runtime.prod-failfast.ts",
  "^\\./core/runtime\\.test-auth-init\\.js$": " /packages/config/src/env/core/runtime.test-auth-init.ts",
  "^\\./core/schema\\.base\\.js$": " /packages/config/src/env/core/schema.base.ts",
  // When resolving from within src/env/core/*, map local .js specifiers to TS
  "^\\./schema\\.base\\.js$": " /packages/config/src/env/core/schema.base.ts",
  "^\\./schema\\.base-merge\\.js$": " /packages/config/src/env/core/schema.base-merge.ts",
  "^\\./constants\\.js$": " /packages/config/src/env/core/constants.ts",
  "^\\./schema\\.preprocess\\.js$": " /packages/config/src/env/core/schema.preprocess.ts",
  "^\\./schema\\.core\\.js$": " /packages/config/src/env/core/schema.core.ts",
  "^\\./refinement\\.deposit\\.js$": " /packages/config/src/env/core/refinement.deposit.ts",
  "^\\./loader\\.parse\\.js$": " /packages/config/src/env/core/loader.parse.ts",
  "^\\./runtime\\.resolve-loader\\.js$": " /packages/config/src/env/core/runtime.resolve-loader.ts",
  "^\\./env\\.snapshot\\.js$": " /packages/config/src/env/core/env.snapshot.ts",
  "^\\./runtime\\.proxy\\.js$": " /packages/config/src/env/core/runtime.proxy.ts",
  "^\\./runtime\\.prod-failfast\\.js$": " /packages/config/src/env/core/runtime.prod-failfast.ts",
  "^\\./runtime\\.test-auth-init\\.js$": " /packages/config/src/env/core/runtime.test-auth-init.ts",
  // Map references to sibling schemas used by core internals
  "^\\.\\./cms\\.schema\\.js$": " /packages/config/src/env/cms.schema.ts",
  "^\\.\\./email\\.schema\\.js$": " /packages/config/src/env/email.schema.ts",
  "^\\.\\./payments\\.js$": " /packages/config/src/env/payments.ts",
  "^@platform-core$": " /packages/platform-core/src/index.ts",
  "^@ui/src$": " /packages/ui/src/index.ts",
  "^@platform-core/repositories/shopSettings$":
    " /packages/platform-core/src/repositories/settings.server.ts",
  "^@platform-core/repositories/rentalOrders$":
    " /packages/platform-core/src/repositories/rentalOrders.server.ts",
  "^@platform-core/repositories/pages$":
    " /packages/platform-core/src/repositories/pages/index.server.ts",
  "^@platform-core/(.*)$": " /packages/platform-core/src/$1",
  "^@ui/src/(.*)$": " /packages/ui/src/$1",
  "^@config/src/env$": " /packages/config/src/env/index.ts",
  "^@config/src/env/core$": " /packages/config/src/env/core.ts",
  "^@config/src/env/(.*)$": " /packages/config/src/env/$1.ts",
  "^@config/src/(.*)$": " /packages/config/src/$1",
  "^@acme/config/env$": " /packages/config/src/env/index.ts",
  "^@acme/config/env/core$": " /packages/config/src/env/core.ts",
  "^@acme/config/env/(.*)$": " /packages/config/src/env/$1.ts",
  "^@acme/config/src/(.*)$": " /packages/config/src/$1",
  "^@acme/config$": " /packages/config/src/env/index.ts",
  "^@acme/config/(.*)$": " /packages/config/src/$1",
  "^@acme/platform-core$": " /packages/platform-core/src/index.ts",
  "^@acme/platform-core/(.*)\\.js$": " /packages/platform-core/src/$1",
  "^@acme/platform-core/(.*)$": " /packages/platform-core/src/$1",
  "^@acme/page-builder-core$": " /packages/page-builder-core/src/index.ts",
  "^@acme/page-builder-core/(.*)$": " /packages/page-builder-core/src/$1",
  "^@acme/page-builder-ui$": " /packages/page-builder-ui/src/index.ts",
  "^@acme/page-builder-ui/(.*)$": " /packages/page-builder-ui/src/$1",
  "^@acme/platform-core/contexts/CurrencyContext$":
    " /test/__mocks__/currencyContextMock.tsx",
  // Map i18n workspace package to source for tests so latest messages are used
  "^@acme/i18n$": " /packages/i18n/src/index.ts",
  "^@acme/i18n/(.*)$": " /packages/i18n/src/$1",
  "^@radix-ui/react-dropdown-menu$":
    " /test/__mocks__/@radix-ui/react-dropdown-menu.tsx",
  "^@acme/lib$": " /packages/lib/src/index.ts",
  "^@acme/lib/server$": " /packages/lib/src/server.ts",
  "^@acme/lib/format$": " /packages/lib/src/format/index.ts",
  "^@acme/lib/string$": " /packages/lib/src/string/index.ts",
  "^@acme/lib/array$": " /packages/lib/src/array/index.ts",
  "^@acme/lib/json$": " /packages/lib/src/json/index.ts",
  "^@acme/lib/http$": " /packages/lib/src/http/index.ts",
  "^@acme/lib/http/server$": " /packages/lib/src/http/index.server.ts",
  "^@acme/lib/security$": " /packages/lib/src/security/index.ts",
  "^@acme/lib/context$": " /packages/lib/src/context/index.server.ts",
  "^@acme/lib/shop$": " /packages/lib/src/shop/index.ts",
  "^@acme/lib/logger$": " /packages/lib/src/logger/index.server.ts",
  "^@acme/lib/(.*)$": " /packages/lib/src/$1",
  "^@acme/sanity$": " /packages/sanity/src/index.ts",
  "^@acme/sanity/(.*)$": " /packages/sanity/src/$1",
  "^@acme/types$": " /packages/types/src/index.ts",
  "^@acme/types/(.*)$": " /packages/types/src/$1",
  "^@acme/platform-machine/src/(.*)$": " /packages/platform-machine/src/$1",
  "^@acme/plugin-sanity$": " /test/__mocks__/pluginSanityStub.ts",
  "^@acme/plugin-sanity/(.*)$": " /test/__mocks__/pluginSanityStub.ts",
  "^@acme/telemetry$": " /test/__mocks__/telemetryMock.ts",
  // Map dynamic theme imports used by theme token loader in tests
  // Primary: real workspace themes
  "^@themes/(.*)/tailwind-tokens$": " /packages/themes/$1/tailwind-tokens/src/index.ts",
  "^@themes/(.*)$": " /packages/themes/$1/src/index.ts",
  // Secondary: package-local fixtures used by selected tests
  "^@themes-local/(.*)/tailwind-tokens$": " /packages/platform-core/themes/$1/tailwind-tokens/src/index.ts",
  "^@themes-local/(.*)$": " /packages/platform-core/themes/$1/src/index.ts",
  "^@acme/zod-utils/initZod$": " /test/emptyModule.ts",
  "^\\./env/(.*)\\.js$": " /packages/config/src/env/$1.ts",
  "^\\./(auth|cms|email|core|payments|shipping)\\.js$":
    " /packages/config/src/env/$1.ts",
  "^\\.\\./(auth|cms|email|core|payments|shipping)\\.js$":
    " /packages/config/src/env/$1.ts",
  "^\\./fsStore\\.js$": " /packages/email/src/storage/fsStore.ts",
  "^\\./storage/index\\.js$": " /packages/email/src/storage/index.ts",
  "^\\./providers/resend\\.js$": " /packages/email/src/providers/resend.ts",
  "^\\./providers/sendgrid\\.js$":
    " /packages/email/src/providers/sendgrid.ts",
  "^\\./providers/types\\.js$": " /packages/email/src/providers/types.ts",
  "^\\./stats\\.js$": " /packages/email/src/stats.ts",
  "^@prisma/client$": " /__mocks__/@prisma/client.ts",
  "^@/components/atoms/shadcn$": " /test/__mocks__/shadcnDialogStub.tsx",
  "^@/i18n/(.*)$": " /packages/i18n/src/$1",
  "^@/components/(.*)$": " /test/__mocks__/componentStub.js",
  "^@/(.*)$": " /apps/cms/src/$1",
  "^next/server$": " /test/__mocks__/next-server.ts",
  "\\.(css|less|sass|scss)$": "identity-obj-proxy",
  "^server-only$": " /test/server-only-stub.ts",
  "^react-dom/client$": " /test/reactDomClientShim.ts",
};

if (interceptorsClientRequestPath) {
  moduleMapper["^@mswjs/interceptors/ClientRequest$"] =
    interceptorsClientRequestPath;
} else {
  moduleMapper["^@mswjs/interceptors/ClientRequest$"] =
    " /test/emptyModule.ts";
}

module.exports = moduleMapper;

/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Test mock mappings for Jest.
 *
 * Maps external dependencies and framework modules to test doubles.
 * These mocks provide stable, predictable behavior during testing.
 *
 * Uses ARRAY format [pattern, replacement] to preserve ordering.
 */

module.exports = [
  // TypeScript declaration files - map to empty module
  ["^.+\\.d\\.ts$", " /test/emptyModule.ts"],

  // Next.js framework mocks
  ["^next-auth$", " /test/mocks/next-auth.ts"],
  ["^next-auth/jwt$", " /test/mocks/next-auth-jwt.ts"],
  ["^next-auth/react$", " /test/mocks/next-auth-react.ts"],
  ["^next/server$", " /test/__mocks__/next-server.ts"],

  // Prisma ORM mock
  ["^@prisma/client$", " /__mocks__/@prisma/client.ts"],

  // React ecosystem mocks
  ["^react-dom/client$", " /test/reactDomClientShim.ts"],

  // Radix UI component mocks
  ["^@radix-ui/react-dropdown-menu$", " /test/__mocks__/@radix-ui/react-dropdown-menu.tsx"],
  ["^@radix-ui/react-icons$", " /test/__mocks__/componentStub.js"],

  // shadcn/ui component mocks
  ["^@/components/atoms/shadcn$", " /test/__mocks__/shadcnDialogStub.tsx"],
  ["^@/components/(.*)$", " /test/__mocks__/componentStub.js"],

  // Platform-specific mocks
  ["^@acme/platform-core/contexts/CurrencyContext$", " /test/__mocks__/currencyContextMock.tsx"],
  ["^@acme/plugin-sanity$", " /test/__mocks__/pluginSanityStub.ts"],
  ["^@acme/plugin-sanity/(.*)$", " /test/__mocks__/pluginSanityStub.ts"],
  ["^@acme/telemetry$", " /test/__mocks__/telemetryMock.ts"],
  ["^@acme/zod-utils/initZod$", " /test/emptyModule.ts"],

  // Server-only marker
  ["^server-only$", " /test/server-only-stub.ts"],

  // CSS modules - map to identity-obj-proxy for className access
  ["\\.(css|less|sass|scss)$", "identity-obj-proxy"],
];

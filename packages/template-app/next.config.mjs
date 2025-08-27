// packages/template-app/next.config.mjs

// Merge the shared Next.js configuration with template-app overrides.
//
// We intentionally avoid `export { default } from "@acme/next-config"` in
// combination with a second `export default` because ES modules permit only
// one default export.  Instead we import the base configuration and merge in
// any additional settings (like `transpilePackages`).  This ensures the
// resulting configuration remains valid and avoids the "Duplicate export of
// 'default'" syntax error that Next.js surfaces during the build.

// Provide stub secrets so that `@acme/config` env validation does not
// fail during static builds when these variables are absent.  The values are
// non-secret and only used to satisfy the schema at build time.
if (!process.env.NEXTAUTH_SECRET) process.env.NEXTAUTH_SECRET = "stub-nextauth-secret";
if (!process.env.SESSION_SECRET) process.env.SESSION_SECRET = "stub-session-secret";
if (!process.env.CART_COOKIE_SECRET) process.env.CART_COOKIE_SECRET = "stub-cart-cookie";
if (!process.env.STRIPE_SECRET_KEY) process.env.STRIPE_SECRET_KEY = "sk_test_stub";
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_stub";
if (!process.env.STRIPE_WEBHOOK_SECRET)
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_stub";

// Import after setting env vars so that any config consuming them resolves
// without throwing.
const baseConfig = (await import("@acme/next-config/next.config.mjs")).default;

/** @type {import('next').NextConfig} */
const config = {
  // Spread the settings from the shared config to preserve its behaviour.
  ...baseConfig,
  // Override or extend any fields here.  In this case we need to
  // transpile additional internal packages so that Next.js can import
  // their untranspiled source code from `node_modules`.
  transpilePackages: [
    "@acme/ui",
    "@acme/i18n",
    "@acme/platform-core",
    "@acme/config",
    "@acme/zod-utils", // needed by @acme/config/env/auth.ts
  ],
};

export default config;

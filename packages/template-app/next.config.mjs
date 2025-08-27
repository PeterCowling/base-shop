// packages/template-app/next.config.mjs

// Merge the shared Next.js configuration with template-app overrides.
//
// We intentionally avoid `export { default } from "@acme/next-config"` in
// combination with a second `export default` because ES modules permit only
// one default export.  Instead we import the base configuration and merge in
// any additional settings (like `transpilePackages`).  This ensures the
// resulting configuration remains valid and avoids the "Duplicate export of
// 'default'" syntax error that Next.js surfaces during the build.

// Ensure required auth secrets exist so `@acme/config` can parse the
// environment during Next.js's configuration phase. Provide development
// defaults if they are missing.
process.env.NEXTAUTH_SECRET ??= "dev-nextauth-secret";
process.env.SESSION_SECRET ??= "dev-session-secret";
process.env.CART_COOKIE_SECRET ??= "dev-cart-secret";
process.env.CMS_SPACE_URL ??= "https://cms.example.com";
process.env.CMS_ACCESS_TOKEN ??= "placeholder-token";
process.env.SANITY_API_VERSION ??= "2021-10-21";

// Use a dynamic import so the env defaults above apply before loading the
// shared configuration.
const { default: baseConfig } = await import(
  "@acme/next-config/next.config.mjs",
);

/** @type {import('next').NextConfig} */
const config = {
  // Spread the settings from the shared config to preserve its behaviour.
  ...baseConfig,
  typescript: {
    ...(baseConfig.typescript ?? {}),
    tsconfigPath: "./tsconfig.json",
  },
  // Override or extend any fields here.  In this case we need to
  // transpile additional internal packages so that Next.js can import
  // their untranspiled source code from `node_modules`.
  transpilePackages: [
    "@acme/ui",
    "@acme/config",
    "@acme/zod-utils", // needed by @acme/config/env/auth.impl.ts
  ],
};

export default config;

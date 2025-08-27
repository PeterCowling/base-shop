// packages/template-app/next.config.mjs

// Merge the shared Next.js configuration with template-app overrides.
//
// We intentionally avoid `export { default } from "@acme/next-config"` in
// combination with a second `export default` because ES modules permit only
// one default export.  Instead we import the base configuration and merge in
// any additional settings (like `transpilePackages`).  This ensures the
// resulting configuration remains valid and avoids the "Duplicate export of
// 'default'" syntax error that Next.js surfaces during the build.

import baseConfig from "@acme/next-config/next.config.mjs";

/** @type {import('next').NextConfig} */
const config = {
  // Spread the settings from the shared config to preserve its behaviour.
  ...baseConfig,
  // Override or extend any fields here.  In this case we need to
  // transpile additional internal packages so that Next.js can import
  // their untranspiled source code from `node_modules`.
  transpilePackages: [
    "@acme/ui",
    "@acme/platform-core",
    "@acme/config",
    "@acme/zod-utils", // needed by @acme/config/env/auth.impl.ts
  ],
};

export default config;

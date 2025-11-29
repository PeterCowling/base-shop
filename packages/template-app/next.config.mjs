// packages/template-app/next.config.mjs

// Merge the shared Next.js configuration with template-app overrides.
//
// We intentionally avoid `export { default } from "@acme/next-config/next.config.mjs"` in
// combination with a second `export default` because ES modules permit only
// one default export.  Instead we import the base configuration and merge in
// any additional settings (like `transpilePackages`).  This ensures the
// resulting configuration remains valid and avoids the "Duplicate export of
// 'default'" syntax error that Next.js surfaces during the build.

// Load development defaults for required auth secrets before the shared
// configuration validates the environment.  This module mutates `process.env`
// and exports nothing.
import "./dev-defaults.mjs";

// Statically import the shared Next.js configuration so the file remains
// synchronous.  This avoids the top-level `await` that Next.js cannot handle.
import sharedConfig from "@acme/next-config/next.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Spread the settings from the shared config to preserve its behaviour.
  ...sharedConfig,
  // The template app is not exported as static HTML during CI builds.
  // Override the shared `output: "export"` flag when OUTPUT_EXPORT is set
  // so that API routes like `/api/preview-token` are allowed to remain
  // dynamic without breaking the workspace build.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
  typescript: {
    ...(sharedConfig.typescript ?? {}),
    tsconfigPath: "./tsconfig.json",
  },
  // Disable Webpack's filesystem cache for this template app to avoid
  // intermittent ENOENT rename issues in CI/turbo concurrent builds.
  // Preserve upstream tweaks from the shared config's webpack hook.
  webpack(config, ctx) {
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, ctx);
    }
    // Allow opting back in via env if desired
    if (process.env.NEXT_CACHE !== "true") {
      config.cache = false;
    }
    return config;
  },
  // Override or extend any fields here.  In this case we need to
  // transpile additional internal packages so that Next.js can import
  // their untranspiled source code from `node_modules`.
  transpilePackages: [
    ...sharedConfig.transpilePackages,
    "@acme/ui",
    "@acme/config",
    "@acme/zod-utils", // needed by @acme/config/env/auth.ts
    "@acme/i18n",
  ],
};

export default nextConfig;

// packages/template-app/next.config.mjs

// Merge the shared Next.js configuration with template-app overrides.
import "./dev-defaults.mjs";

import sharedConfig from "@acme/next-config/next.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
  turbopack: {
    ...(sharedConfig.turbopack ?? {}),
  },
  typescript: {
    ...(sharedConfig.typescript ?? {}),
    tsconfigPath: "./tsconfig.json",
  },
  transpilePackages: [
    ...(sharedConfig.transpilePackages || []),
    "@acme/ui",
    "@acme/config",
    "@acme/auth",
    "@acme/zod-utils",
    "@acme/platform-core",
    "@acme/i18n",
  ],
};

export default nextConfig;

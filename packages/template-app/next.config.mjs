// packages/template-app/next.config.mjs

// Merge the shared Next.js configuration with template-app overrides.
import "./dev-defaults.mjs";

import sharedConfig from "@acme/next-config/next.config.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
  typescript: {
    ...(sharedConfig.typescript ?? {}),
    tsconfigPath: "./tsconfig.json",
  },
  webpack(config, ctx) {
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, ctx);
    }
    if (process.env.NEXT_CACHE !== "true") {
      config.cache = false;
    }
    return config;
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

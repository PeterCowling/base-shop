import path from "node:path";
import { fileURLToPath } from "node:url";

import sharedConfig from "@acme/next-config/next.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  experimental: {
    ...sharedConfig.experimental,
    // Enable Node.js runtime for middleware (required for iron-session crypto)
    nodeMiddleware: true,
  },
  webpack: (config, context) => {
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, context);
    }

    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
    };

    // Business OS uses Node runtime for git operations (simple-git, fs)
    // No client polyfills needed for these Node-only modules
    if (!context.isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        child_process: false,
        path: false,
      };
    }

    return config;
  },
};

export default nextConfig;

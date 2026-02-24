import path from "node:path";
import { fileURLToPath } from "node:url";

import sharedConfig from "@acme/next-config/next.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  // Product Pipeline relies on dynamic route handlers, so disable static export.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
  turbopack: {
    ...(sharedConfig.turbopack ?? {}),
    resolveAlias: {
      ...(sharedConfig.turbopack?.resolveAlias ?? {}),
      "@": path.resolve(__dirname, "src"),
      "@acme/ui": path.resolve(__dirname, "../../packages/ui/dist"),
    },
  },
  webpack: (config, context) => {
    // Legacy webpack path retained as an explicit exception while scripts still
    // execute via `next --webpack`. Turbopack alias parity is configured above;
    // snapshot/cache overrides remain webpack-path behavior for now.
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, context);
    }

    if (config.snapshot) {
      config.snapshot.managedPaths = [];
      config.snapshot.immutablePaths = [];
    }

    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      // Ensure @acme/ui alias is available for this app if not inherited
      "@acme/ui": path.resolve(__dirname, "../../packages/ui/dist"),
    };
    return config;
  },
};

export default nextConfig;

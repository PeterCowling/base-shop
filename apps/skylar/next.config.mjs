import path from "node:path";
import { fileURLToPath } from "node:url";

import sharedConfig from "@acme/next-config/next.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  typescript: {
    tsconfigPath: "./tsconfig.next.json",
  },
  turbopack: {
    ...(sharedConfig.turbopack ?? {}),
    resolveAlias: {
      ...(sharedConfig.turbopack?.resolveAlias ?? {}),
      "@": path.resolve(__dirname, "src"),
    },
  },
  webpack(config, options) {
    // Legacy webpack path retained as an explicit exception while scripts still
    // execute via `next --webpack`. Turbopack alias parity is configured above.
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, options);
    }

    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias["@"] = path.resolve(__dirname, "src");

    return config;
  },
};

export default nextConfig;

import path from "node:path";
import { fileURLToPath } from "node:url";

import sharedConfig from "@acme/next-config/next.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const platformCoreSrc = path.resolve(__dirname, "../../packages/platform-core/src");
const i18nSrc = path.resolve(__dirname, "../../packages/i18n/src");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  turbopack: {
    ...(sharedConfig.turbopack ?? {}),
    resolveAlias: {
      ...(sharedConfig.turbopack?.resolveAlias ?? {}),
      "@": path.resolve(__dirname, "src"),
      "@acme/platform-core": platformCoreSrc,
      "@acme/i18n": i18nSrc,
    },
  },
  webpack: (config, context) => {
    // Legacy webpack path retained as an explicit exception while scripts still
    // allow webpack execution during phased migration. Turbopack alias parity is
    // configured above.
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, context);
    }
    // Avoid intermittent cache-related build crashes; opt back in via NEXT_CACHE=true.
    if (process.env.NEXT_CACHE !== "true") {
      config.cache = false;
    }
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      "@acme/platform-core": platformCoreSrc,
      "@acme/i18n": i18nSrc,
    };
    return config;
  },
};

export default nextConfig;

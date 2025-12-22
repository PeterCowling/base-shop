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
  webpack: (config, context) => {
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
    };
    return config;
  },
};

export default nextConfig;

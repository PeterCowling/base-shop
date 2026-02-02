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
  webpack(config, options) {
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

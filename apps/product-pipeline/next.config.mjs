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
};

export default nextConfig;

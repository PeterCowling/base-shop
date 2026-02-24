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
};

export default nextConfig;

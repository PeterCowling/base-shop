import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@acme/mcp-server"],
  compiler: {
    // Strip console.log and console.warn in production builds.
    // console.error is preserved for monitoring.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error"] }
        : false,
  },
  turbopack: {
    // Pin workspace root to this repository to avoid lockfile-based mis-detection.
    root: path.resolve(__dirname, "../.."),
    resolveAlias: {
      // @acme/ui and @acme/lib resolve via their package.json exports maps.
      // Do NOT add absolute-path aliases here — Turbopack treats them as
      // server-relative ("./Users/...") which breaks resolution.

      // CSS theme alias — reception uses @themes (not @themes-local from shared config)
      "@themes": path.resolve(__dirname, "../../packages/themes"),
    },
  },
};

export default nextConfig;

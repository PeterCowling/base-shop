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
      // Bare-specifier aliases only — resolve workspace packages to src to
      // avoid dual module identity (src vs dist) under Turbopack.
      // Sub-path imports (e.g. @acme/design-system/atoms) resolve via each
      // package's exports map; absolute-path sub-path aliases cause
      // "server relative imports are not implemented yet" errors.
      "@acme/design-system": path.resolve(__dirname, "../../packages/design-system/src"),
      "@acme/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@acme/lib": path.resolve(__dirname, "../../packages/lib/src"),

      // CSS theme alias — reception uses @themes (not @themes-local from shared config)
      "@themes": path.resolve(__dirname, "../../packages/themes"),
    },
  },
};

export default nextConfig;

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharedConfig from "@acme/next-config/next.config.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readEnv = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
};

const publicEnv = {};
const setEnv = (key, value) => {
  if (typeof value === "string" && value.length > 0) {
    publicEnv[key] = value;
  }
};

setEnv("NEXT_PUBLIC_BASE_URL", readEnv("NEXT_PUBLIC_BASE_URL", "PUBLIC_BASE_URL"));
setEnv(
  "NEXT_PUBLIC_SITE_ORIGIN",
  readEnv("NEXT_PUBLIC_SITE_ORIGIN", "SITE_ORIGIN", "VITE_SITE_ORIGIN", "VITE_SITE_DOMAIN", "NEXT_PUBLIC_SITE_DOMAIN")
);
setEnv("NEXT_PUBLIC_SITE_DOMAIN", readEnv("NEXT_PUBLIC_SITE_DOMAIN", "VITE_SITE_DOMAIN"));
setEnv("NEXT_PUBLIC_PUBLIC_DOMAIN", readEnv("NEXT_PUBLIC_PUBLIC_DOMAIN", "VITE_PUBLIC_DOMAIN"));
setEnv("NEXT_PUBLIC_DOMAIN", readEnv("NEXT_PUBLIC_DOMAIN", "VITE_DOMAIN"));
setEnv("NEXT_PUBLIC_PREVIEW_TOKEN", readEnv("NEXT_PUBLIC_PREVIEW_TOKEN", "VITE_PREVIEW_TOKEN"));
setEnv(
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  readEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "VITE_GA_MEASUREMENT_ID")
);
setEnv(
  "NEXT_PUBLIC_DEBUG_GUIDE_TITLES",
  readEnv("NEXT_PUBLIC_DEBUG_GUIDE_TITLES", "VITE_DEBUG_GUIDE_TITLES", "VITE_DEBUG_GUIDES")
);
setEnv("NEXT_PUBLIC_DEBUG_GUIDES", readEnv("NEXT_PUBLIC_DEBUG_GUIDES", "VITE_DEBUG_GUIDES"));
setEnv("NEXT_PUBLIC_NOINDEX_PREVIEW", readEnv("NEXT_PUBLIC_NOINDEX_PREVIEW", "NOINDEX_PREVIEW"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...sharedConfig,
  // Brikette relies on SSR routes; avoid forcing static export when OUTPUT_EXPORT is set.
  output: sharedConfig.output === "export" ? undefined : sharedConfig.output,
  env: {
    ...(sharedConfig.env ?? {}),
    ...publicEnv,
  },
  webpack: (config, context) => {
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, context);
    }

    if (context.isServer) {
      class PagesManifestFixPlugin {
        apply(compiler) {
          compiler.hooks.afterEmit.tap("PagesManifestFixPlugin", () => {
            const outputPath = compiler.outputPath;
            if (!outputPath) return;
            const pagesDir = path.join(outputPath, "pages");
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] Build output path from webpack compiler.
            if (!fs.existsSync(pagesDir)) return;

            const manifest = {};
            const walk = (dir) => {
              // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] Walk build output directory tree.
              for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  walk(fullPath);
                } else if (entry.isFile() && entry.name.endsWith(".js")) {
                  const rel = path.relative(pagesDir, fullPath).replace(/\\/g, "/");
                  const page = rel.replace(/\.js$/, "");
                  let route = `/${page}`;
                  route = route.replace(/\/index$/, "");
                  if (route === "") route = "/";
                  manifest[route] = `pages/${page}.js`;
                }
              }
            };

            walk(pagesDir);
            const manifestPath = path.join(outputPath, "pages-manifest.json");
            // eslint-disable-next-line security/detect-non-literal-fs-filename -- SEC-1001 [ttl=2026-12-31] Emit manifest alongside build output.
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
          });
        }
      }

      config.plugins ??= [];
      config.plugins.push(new PagesManifestFixPlugin());
    }

    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
      "react-router": path.resolve(__dirname, "src", "compat", "react-router.tsx"),
      "react-router-dom": path.resolve(__dirname, "src", "compat", "react-router-dom.tsx"),
      "react-router/dom": path.resolve(__dirname, "src", "compat", "react-router-dom.tsx"),
      "@react-router/dev/routes": path.resolve(__dirname, "src", "compat", "react-router-dev-routes.ts"),
    };

    // The brikette app still has a few Node-only helpers (fs loaders, createRequire).
    // Those are guarded at runtime, but webpack needs explicit "no polyfill" fallbacks
    // for the client build to avoid "Module not found" errors.
    if (!context.isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        module: false,
        path: false,
        url: false,
      };
    }

    // Vite-style raw imports (e.g. `file.jsonld?raw`) used for JSON-LD payloads.
    // Map them to webpack's `asset/source` so the module exports the file as a string.
    config.module ??= {};
    config.module.rules ??= [];
    config.module.rules.unshift({
      resourceQuery: /raw/,
      type: "asset/source",
    });

    return config;
  },
};

export default nextConfig;

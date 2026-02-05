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

const parseCloudflareHeadersFile = (contents) => {
  const rules = [];
  let currentPath = undefined;
  let currentHeaders = {};

  const flush = () => {
    if (!currentPath) return;
    if (typeof currentHeaders["Cache-Control"] !== "string") return;
    rules.push({
      path: currentPath,
      cacheControl: currentHeaders["Cache-Control"],
    });
  };

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line.length === 0) continue;
    if (line.startsWith("#")) continue;

    if (line.startsWith("/")) {
      flush();
      currentPath = line;
      currentHeaders = {};
      continue;
    }

    const headerMatch = line.match(/^\s*([^:]+):\s*(.+)$/);
    if (!headerMatch) continue;
    const [, key, value] = headerMatch;
    currentHeaders[key] = value;
  }

  flush();
  return rules;
};

const cloudflarePathToNextSource = (cfPath) => {
  if (cfPath === "/*/draft*") return "/:lang/draft/:path*";

  if (cfPath.endsWith("/*")) {
    return `${cfPath.slice(0, -2)}/:path*`;
  }

  if (cfPath.endsWith("*")) {
    const base = cfPath.slice(0, -1);
    if (base.endsWith("/")) return `${base}:path*`;
    return `${base}/:path*`;
  }

  return cfPath;
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
  "NEXT_PUBLIC_ENABLE_GUIDE_AUTHORING",
  readEnv("NEXT_PUBLIC_ENABLE_GUIDE_AUTHORING", "ENABLE_GUIDE_AUTHORING", "VITE_ENABLE_GUIDE_AUTHORING"),
);
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
  // Keep react-i18next bundled to avoid invalid hook calls during prerender.
  serverExternalPackages: (sharedConfig.serverExternalPackages ?? []).filter(
    (name) => name !== "react-i18next",
  ),
  async headers() {
    const headersPath = path.join(__dirname, "public", "_headers");
    if (!fs.existsSync(headersPath)) return [];

    const rules = parseCloudflareHeadersFile(fs.readFileSync(headersPath, "utf8"));
    return rules.map((rule) => ({
      source: cloudflarePathToNextSource(rule.path),
      headers: [{ key: "Cache-Control", value: rule.cacheControl }],
    }));
  },
  env: {
    ...(sharedConfig.env ?? {}),
    ...publicEnv,
  },
  webpack: (config, context) => {
    if (typeof sharedConfig.webpack === "function") {
      config = sharedConfig.webpack(config, context);
    }

    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@": path.resolve(__dirname, "src"),
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

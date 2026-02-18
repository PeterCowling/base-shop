// packages/next-config/next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";

import { baseConfig, withShopCode } from "./index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, "../..");

const coreEnv = {
  SHOP_CODE: process.env.SHOP_CODE,
};

export default withShopCode(coreEnv.SHOP_CODE, {
  outputFileTracingRoot: repoRoot,
  webpack(config, { isServer, webpack, nextRuntime }) {
    // Preserve existing tweaks from the base config
    if (typeof baseConfig.webpack === "function") {
      config = baseConfig.webpack(config, { isServer });
    }

    // Existing aliases…
    config.resolve ??= {};
    config.resolve.alias ??= {};
    // Prefer TypeScript sources for extensionless imports in workspace packages.
    // (Fully-specified ESM imports like "./file.js" are handled via `extensionAlias` below.)
    config.resolve.extensions = [
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".mjs",
      ".json",
      ...(config.resolve.extensions || []),
    ];
    // Allow TS sources to use Node ESM-style ".js" specifiers (tsc emits ".js"
    // but Next may transpile from source in workspace packages).
    config.resolve.extensionAlias ??= {};
    config.resolve.extensionAlias[".js"] ??= [".ts", ".tsx", ".js", ".jsx"];
    config.resolve.extensionAlias[".mjs"] ??= [".mts", ".mjs"];
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../template-app/src"),
      "drizzle-orm": false,
      // Allow platform-core theme loader to resolve local theme fixtures
      "@themes-local": path.resolve(__dirname, "../themes"),
      "@acme/design-system": path.resolve(__dirname, "../design-system/src"),
      "@acme/cms-ui": path.resolve(__dirname, "../cms-ui/src"),
      "@acme/lib": path.resolve(__dirname, "../lib/src"),
      "@acme/seo": path.resolve(__dirname, "../seo/src"),
      // Keep explicit i18n alias: removing this currently breaks template-app Next builds
      "@acme/i18n": path.resolve(__dirname, "../i18n/dist"),
    };

    // Map built-in node modules consistently.
    // Skip for edge runtime — node:* modules are unavailable there and the
    // replacement would cause webpack to fail on imports in nodejs-only files
    // that happen to be compiled by the edge-route loader pass in Next.js 15.
    if (nextRuntime !== "edge") {
      for (const mod of [
        "assert",
        "buffer",
        "child_process",
        "crypto",
        "fs",
        "http",
        "https",
        "module",
        "path",
        "stream",
        "string_decoder",
        "timers",
        "url",
        "util",
        "vm",
        "zlib",
      ]) {
        config.resolve.alias[`node:${mod}`] = mod;
      }

      if (webpack?.NormalModuleReplacementPlugin) {
        config.plugins ??= [];
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
            resource.request = resource.request.replace(/^node:/, "");
          }),
        );
      }
    }

    return config;
  },
});

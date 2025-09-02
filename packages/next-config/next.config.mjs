// packages/next-config/next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseConfig, withShopCode } from "./index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coreEnv = {
  SHOP_CODE: process.env.SHOP_CODE,
};

export default withShopCode(coreEnv.SHOP_CODE, {
  eslint: { ignoreDuringBuilds: true },
  webpack(config, { isServer }) {
    // Preserve existing tweaks from the base config
    if (typeof baseConfig.webpack === "function") {
      config = baseConfig.webpack(config, { isServer });
    }

    // Existing aliases…
    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../template-app/src"),
      "@i18n": path.resolve(__dirname, "../i18n/src"),
      "drizzle-orm": false,

      // === NEW ALIASES ===
      // Allow imports like "@ui/components/…" to resolve to packages/ui/src
      "@ui": path.resolve(__dirname, "../ui/src"),
      // Allow imports like "@platform-core/components/…" to resolve to packages/platform-core/src
      "@platform-core": path.resolve(__dirname, "../platform-core/src"),
    };

    // Map built-in node modules consistently (unchanged)
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

    return config;
  },
});

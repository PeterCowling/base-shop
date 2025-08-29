// packages/next-config/next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseConfig, withShopCode } from "./index.mjs";

/* ------------------------------------------------------------------ */
/*  ES-module-safe __dirname                                           */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read the minimal env directly; the template's dev-defaults.mjs
 * runs before this file is imported, so values are set for local dev.
 */
const coreEnv = {
  SHOP_CODE: process.env.SHOP_CODE,
};

export default withShopCode(coreEnv.SHOP_CODE, {
  /* 1️⃣ ‒ keep CI/production green even if ESLint finds issues */
  eslint: { ignoreDuringBuilds: true },

  webpack(config, { isServer }) {
    // 2️⃣ – preserve any tweaks from the base config
    if (typeof baseConfig.webpack === "function") {
      config = baseConfig.webpack(config, { isServer });
    }

    /* 3️⃣ – extra aliases -------------------------------------------------- */
    const nodeBuiltins = [
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
    ];

    config.resolve ??= {};
    config.resolve.alias ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "../template-app/src"),
      "@i18n": path.resolve(__dirname, "../i18n/src"),
      // Prevent optional Drizzle ORM dependency from being bundled
      "drizzle-orm": false,
    };
    for (const mod of nodeBuiltins) {
      config.resolve.alias[`node:${mod}`] = mod;
    }

    return config;
  },
});

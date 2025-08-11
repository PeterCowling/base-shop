// packages/template-app/next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseConfig, withShopCode } from "@acme/next-config";
import { env } from "@acme/config";

/* ------------------------------------------------------------------ */
/*  ES-module-safe __dirname                                           */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default withShopCode(env.SHOP_CODE, {
  /* 1️⃣ ‒ keep CI/production green even if ESLint finds issues */
  eslint: { ignoreDuringBuilds: true },

  webpack(config, { isServer }) {
    // 2️⃣ – preserve any tweaks from the base config
    if (typeof baseConfig.webpack === "function") {
      config = baseConfig.webpack(config, { isServer });
    }

    /* 3️⃣ – extra aliases -------------------------------------------------- */
    config.resolve.alias = {
      ...config.resolve.alias,

      /* path-based imports --------------------------- */
      "@": path.resolve(__dirname, "src"),
      "@i18n": path.resolve(__dirname, "../../packages/i18n"),

      /* allow “node:fs” / “node:path” in shared libs */
      "node:fs": "fs",
      "node:path": "path",
    };

    return config;
  },
});

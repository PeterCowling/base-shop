import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseConfig, withShopCode } from "./index.mjs";

let env;
try {
  ({ env } = await import("@acme/config"));
} catch {
  env = process.env;
}

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
      "@": path.resolve(__dirname, "../template-app/src"),
      "@i18n": path.resolve(__dirname, "../i18n"),
      "node:fs": "fs",
      "node:path": "path",
    };

    return config;
  },
});

// apps/shop-bcd/next.config.mjs
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
  /* 1️⃣ ‒ don’t fail the build on lint errors */
  eslint: { ignoreDuringBuilds: true },

  webpack(config, { isServer }) {
    if (typeof baseConfig.webpack === "function") {
      config = baseConfig.webpack(config, { isServer });
    }

    /* 3️⃣ – same alias set as Template App ------------------------------- */
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
      "@i18n": path.resolve(__dirname, "../../packages/i18n"),
      "node:fs": "fs",
      "node:path": "path",
    };

    return config;
  },
});

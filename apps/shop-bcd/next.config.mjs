// apps/shop-bdc/next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import base from "../cms/next.config.mjs";

/* ------------------------------------------------------------------ */
/*  ES-module-safe __dirname                                           */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
export default {
  ...base,

  /* 1️⃣ ‒ don’t fail the build on lint errors */
  eslint: { ignoreDuringBuilds: true },

  webpack(config, { isServer }) {
    if (typeof base.webpack === "function") {
      config = base.webpack(config, { isServer });
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

  env: {
    ...base.env,
    SHOP_CODE: "bcd",
  },
};

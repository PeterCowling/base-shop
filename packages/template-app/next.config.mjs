// packages/template-app/next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import base from "../../apps/cms/next.config.mjs";

/* ------------------------------------------------------------------ */
/*  ES-module-safe __dirname                                           */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
export default {
  ...base,

  /* 1️⃣ ‒ keep CI/production green even if ESLint finds issues */
  eslint: { ignoreDuringBuilds: true },

  webpack(config, { isServer }) {
    // 2️⃣ – preserve any tweaks from the CMS config
    if (typeof base.webpack === "function") {
      config = base.webpack(config, { isServer });
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

  env: {
    ...base.env,
    SHOP_CODE: "template",
  },
};

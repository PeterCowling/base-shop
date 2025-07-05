// packages/template-app/next.config.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";
import base from "../../apps/cms/next.config.mjs";

/* ------------------------------------------------------------------ */
/*  ES-module-safe __dirname                                          */
/* ------------------------------------------------------------------ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
export default {
  ...base,

  webpack(config) {
    // preserve any webpack tweaks from the CMS config
    if (typeof base.webpack === "function") {
      config = base.webpack(config);
    }

    /* --------------------------------------------------------------
       Alias so Webpack can resolve both TS/TSX *and* JSON under
       `@i18n/*` (code lives in src/, locale files live at package root)
    -------------------------------------------------------------- */
    config.resolve.alias = {
      ...config.resolve.alias,
      "@i18n": path.resolve(__dirname, "../../packages/i18n"),
    };

    return config;
  },

  env: {
    ...base.env,
    SHOP_CODE: "template",
  },
};

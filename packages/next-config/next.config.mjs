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
      // Allow platform-core theme loader to resolve local theme fixtures
      "@themes-local": path.resolve(__dirname, "../themes"),

      // === NEW ALIASES ===
      // Allow imports like "@ui/components/…" to resolve to packages/ui/src
      "@ui": path.resolve(__dirname, "../ui/src"),
      // Support existing "@ui/src" imports
      "@ui/src": path.resolve(__dirname, "../ui/src"),
      // Allow imports like "@platform-core/components/…" to resolve to packages/platform-core/src
      "@platform-core": path.resolve(__dirname, "../platform-core/src"),
      // Route @acme/config to built output to avoid .js stub pitfalls in src
      "@acme/config": path.resolve(__dirname, "../config/dist"),
      "@acme/date-utils": path.resolve(__dirname, "../date-utils/src"),
      "@acme/email": path.resolve(__dirname, "../email/src"),
      "@acme/email-templates": path.resolve(__dirname, "../email-templates/src"),
      "@acme/design-tokens": path.resolve(__dirname, "../design-tokens/src"),
      "@acme/sanity": path.resolve(__dirname, "../sanity/src"),
      "@acme/lib": path.resolve(__dirname, "../lib/src"),
      "@acme/stripe": path.resolve(__dirname, "../stripe/src"),
      "@acme/tailwind-config": path.resolve(__dirname, "../tailwind-config/src"),
      "@acme/zod-utils": path.resolve(__dirname, "../zod-utils/src"),
      // Allow imports using the published package name to resolve without a build
      "@acme/shared-utils": path.resolve(__dirname, "../shared-utils/src"),
      // Allow imports like "@shared-utils" to resolve to packages/shared-utils/src
      "@shared-utils": path.resolve(__dirname, "../shared-utils/src"),
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

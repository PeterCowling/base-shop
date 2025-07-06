// /tailwind.config.mjs
// Use workspace source paths to avoid requiring built packages
import { createRequire } from "node:module";
import tokens from "./packages/design-tokens/index.ts";
import preset from "./packages/tailwind-config/src/index.ts";

/* ------------------------------------------------------------
 *  Runtime diagnostics — module resolution + preset sanity
 * ------------------------------------------------------------ */
const require = createRequire(import.meta.url);

let resolvedPresetPath = "<unresolved>";
try {
  resolvedPresetPath = require.resolve("@acme/tailwind-config");
  // eslint-disable-next-line no-console
  console.log(
    `[tailwind.config] ✅  @acme/tailwind-config resolved → ${resolvedPresetPath}`
  );
} catch (err) {
  // eslint-disable-next-line no-console
  console.error(
    "[tailwind.config] ❌  @acme/tailwind-config could NOT be resolved.\n" +
      "Is the package in pnpm-workspace.yaml? Did you run `pnpm install`?",
    err
  );
}

// eslint-disable-next-line no-console
console.log(
  "[tailwind.config] ℹ️  preset keys:",
  preset && typeof preset === "object" ? Object.keys(preset) : "not an object"
);

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [tokens, preset],
  content: [
    "./apps/**/*.{ts,tsx,mdx}",
    "./packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    ".storybook/**/*.{ts,tsx,mdx}",
    // Exclude dependencies and build outputs to avoid slow glob matching
    "!**/node_modules",
    "!**/dist",
    "!**/.next",
  ],
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;

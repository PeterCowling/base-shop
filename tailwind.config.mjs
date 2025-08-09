// /tailwind.config.mjs
// Use workspace source paths to avoid requiring built packages
import tokens from "./packages/design-tokens/index.ts";
import preset from "./packages/tailwind-config/src/index.ts";

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [tokens, preset],
  darkMode: ["class", ".theme-dark"],
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

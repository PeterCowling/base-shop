import tokens from "./packages/design-tokens/dist/index.js";
import preset from "./packages/tailwind-config/dist/index.js";

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [tokens, preset],
  darkMode: ["class", ".theme-dark"],
  content: [
    "./apps/**/*.{ts,tsx,mdx}",
    "./packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    ".storybook/**/*.{ts,tsx,mdx}",
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


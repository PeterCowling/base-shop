import tokens from "@acme/design-tokens";
import preset from "@acme/tailwind-config";

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [preset],
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
    tokens,
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};

export default config;


// packages/template-app/tailwind.config.mjs
// Shared TailwindCSS configuration for shop apps
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import workspaces directly to avoid requiring built packages
import tokens from "../design-tokens/index.ts";
import preset from "../tailwind-config/src/index.ts";

// Resolve absolute paths so content globs work when re-exported
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

/** @type {import('tailwindcss').Config} */
const config = {
  presets: [tokens, preset],
  darkMode: ["class", ".theme-dark"],
  content: [
    path.join(rootDir, "apps/**/*.{ts,tsx,mdx}"),
    path.join(rootDir, "packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}"),
    path.join(rootDir, ".storybook/**/*.{ts,tsx,mdx}"),
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


import path from "node:path";
import { fileURLToPath } from "node:url";

import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";
import logicalProps from "./plugins/logical-props.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "..");

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class", ".theme-dark"],
  content: [
    path.join(rootDir, "apps/**/*.{ts,tsx,mdx}"),
    path.join(
      rootDir,
      "packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}"
    ),
    path.join(rootDir, ".storybook/**/*.{ts,tsx,mdx}"),
    "!**/node_modules",
    "!**/dist",
    "!**/.next",
  ],
  plugins: [forms, containerQueries, logicalProps],
};

export default config;

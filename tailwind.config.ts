// /tailwind.config.ts  (keeps the repo working even when you CD into /packages/ui)
import preset from "@acme/tailwind-config";
import type { Config } from "tailwindcss";

const config: Config = {
  presets: [preset],

  /* ①  NEVER scan node_modules or dist — only source directories.
     ②  Point at every place in your repo where Tailwind classes live. */
  content: [
    "./apps/**/*.{ts,tsx,mdx}",
    "./packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    ".storybook/**/*.{ts,tsx,mdx}",
  ],
};

export default config;

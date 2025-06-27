// .storybook/main.ts

import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";
import tailwindcss from "tailwindcss";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: { builder: { viteConfigPath: "./vite.storybook.ts" } },
  },

  env: { CORE_DISABLE_TELEMETRY: "1" },
  staticDirs: ["../public"],

  // Find every .stories.ts/.tsx file inside any package’s /ui directory
  stories: ["../packages/ui/**/*.stories.@(ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
    "@storybook/addon-themes",
    "@storybook/addon-viewport",
  ],

  /**
   * Extend the Vite config Storybook generates so we can:
   *  – inject Tailwind via PostCSS
   *  – expose monorepo aliases (design tokens, Tailwind config)
   */
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      css: {
        postcss: {
          plugins: [tailwindcss()],
        },
      },
      resolve: {
        alias: {
          "@acme/design-tokens": path.resolve(
            __dirname,
            "../packages/design-tokens/src"
          ),
          "@acme/tailwind-config": path.resolve(
            __dirname,
            "../packages/tailwind-config/src"
          ),
        },
      },
      optimizeDeps: { entries: [] },
    });
  },
};

export default config;

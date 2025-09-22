// .storybook/main.ts

import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: { builder: { viteConfigPath: "./vite.storybook.ts" } },
  },

  env: { CORE_DISABLE_TELEMETRY: "1" },
  staticDirs: ["../public"],

  // Find every .stories.ts/.tsx file inside any package’s /ui directory
  stories: [
    "../packages/ui/**/*.stories.@(ts|tsx)",
    "./stories/**/*.stories.@(ts|tsx)",
  ],

  addons: [
    "@storybook/addon-links",
    // Essentials are largely built-in on SB9; keep only specific addons we use
    "@storybook/addon-a11y",
    // interactions addon is pinned to SB8 and incompatible with SB9
    "@storybook/addon-themes",
    "@storybook/addon-viewport",
  ],

  // Configure Webpack aliases for workspace-local packages used in stories
  webpackFinal: async (config) => {
    config.resolve ??= {} as any;
    (config.resolve as any).alias = {
      ...((config.resolve as any).alias ?? {}),
      "@themes-local": path.resolve(__dirname, "../packages/themes"),
      "@acme/design-tokens": path.resolve(
        __dirname,
        "../packages/design-tokens/src"
      ),
      "@acme/tailwind-config": path.resolve(
        __dirname,
        "../packages/tailwind-config/src"
      ),
    };
    return config;
  },

  // Aliases and PostCSS are configured in vite.storybook.ts
};

export default config;

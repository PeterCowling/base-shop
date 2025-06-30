// .storybook/main.ts

import type { StorybookConfig } from "@storybook/nextjs";

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
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-interactions",
    "@storybook/addon-themes",
    "@storybook/addon-viewport",
  ],

  // Aliases and PostCSS are configured in vite.storybook.ts
};

export default config;

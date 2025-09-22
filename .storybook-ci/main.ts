import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: { builder: { viteConfigPath: "./vite.storybook.ts" } },
  },

  env: { CORE_DISABLE_TELEMETRY: "1" },
  staticDirs: ["../public"],

  // Limit CI to internal stories only
  stories: ["../.storybook/stories/**/*.stories.@(ts|tsx)"],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-viewport",
  ],

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
};

export default config;


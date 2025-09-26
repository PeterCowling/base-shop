// .storybook/main.ts

import type { StorybookConfig } from "@storybook/nextjs";
import path from "node:path";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: {
      builder: {
        // Explicitly use Vite builder for faster startup + HMR
        name: "@storybook/builder-vite",
        viteConfigPath: "./vite.storybook.ts",
      },
    },
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

  docs: { autodocs: true },

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
      // Force UI stories to use the pure data-only module to avoid server imports
      "@acme/platform-core/products$": path.resolve(
        __dirname,
        "../packages/platform-core/src/products/index.ts"
      ),
      // Stub server-only module used by Next server code paths
      "server-only": false,
      // Map node: scheme to bare names or stubs to avoid UnhandledSchemeError in Webpack
      "node:fs": false,
      "node:path": false,
      "node:crypto": false,
      "node:module": false,
      // Some files import the bare 'module' builtin; stub it in browser
      module: false,
    };
    // Provide resolve.fallback for Node core modules to silence Webpack 5 errors
    (config.resolve as any).fallback = {
      ...((config.resolve as any).fallback ?? {}),
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },

  // Aliases and PostCSS are configured in vite.storybook.ts
};

export default config;

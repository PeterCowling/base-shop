// .storybook/main.ts

import type { StorybookConfig } from "@storybook/nextjs";
import type { Configuration as WebpackConfiguration, ResolveOptions } from "webpack";
import path from "node:path";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    options: {
      builder: {
        // Explicitly use Vite builder for faster startup + HMR
        name: "@storybook/builder-vite", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
        viteConfigPath: "./vite.storybook.ts", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      },
    },
  },

  env: { CORE_DISABLE_TELEMETRY: "1" },
  staticDirs: ["../public"],

  // Find stories and MDX docs across UI package and local Storybook docs
  stories: [
    "../packages/ui/**/*.stories.@(ts|tsx)", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "../packages/ui/**/*.mdx", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "./stories/**/*.stories.@(ts|tsx)", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "./stories/**/*.mdx", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
  ],

  addons: [
    "@storybook/addon-links", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    // Essentials are largely built-in on SB9; keep only specific addons we use
    "@storybook/addon-a11y", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    // interactions addon is pinned to SB8 and incompatible with SB9
    "@storybook/addon-themes", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "@storybook/addon-viewport", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "storybook-addon-pseudo-states", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "storybook-addon-designs", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
  ],

  docs: { autodocs: true },

  // Configure Webpack aliases for workspace-local packages used in stories
  webpackFinal: async (config: WebpackConfiguration) => {
    type AliasMap = Record<string, string | false>;

    // Ensure resolve exists
    config.resolve = config.resolve ?? {};

    // Merge alias entries without using any
    const existingAlias: AliasMap = (config.resolve.alias ?? {}) as AliasMap;
    const newAlias: AliasMap = {
      ...existingAlias,
      "@themes-local": path.resolve(__dirname, "../packages/themes"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "@platform-core/contexts/ThemeContext": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(
        __dirname,
        "./mocks/ThemeContext.tsx"
      ),
      "@acme/design-tokens": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(
        __dirname,
        "../packages/design-tokens/src"
      ),
      "@acme/tailwind-config": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(
        __dirname,
        "../packages/tailwind-config/src"
      ),
      // Force UI stories to use the pure data-only module to avoid server imports
      "@acme/platform-core/products$": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(
        __dirname,
        "../packages/platform-core/src/products/index.ts"
      ),
      // Stub server-only module used by Next server code paths
      "server-only": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      // Map node: scheme to bare names or stubs to avoid UnhandledSchemeError in Webpack
      "node:fs": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "node:path": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "node:crypto": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "node:module": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      // Some files import the bare 'module' builtin; stub it in browser
      module: false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    };
    config.resolve.alias = newAlias as ResolveOptions["alias"];

    // Provide resolve.fallback for Node core modules
    const existingFallback = (config.resolve.fallback ?? {}) as Record<string, string | false>;
    config.resolve.fallback = {
      ...existingFallback,
      fs: false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path: false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      crypto: false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    } as ResolveOptions["fallback"];
    return config;
  },

  // Aliases and PostCSS are configured in vite.storybook.ts
};

export default config;

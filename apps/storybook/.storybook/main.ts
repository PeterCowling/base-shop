// .storybook/main.ts

import type { StorybookConfig } from "@storybook/nextjs";
import type { Configuration as WebpackConfiguration, ResolveOptions } from "webpack";
import path from "node:path";

import { coverageAddon } from "./coverage";

const config: StorybookConfig = {
  // Use the Webpack 5 builder explicitly per SB9 docs
  framework: {
    name: "@storybook/nextjs", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
  },
  core: {
    builder: {
      name: "@storybook/builder-webpack5", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      options: {
        // Disable aggressive caching/lazy compilation to stabilize HMR
        fsCache: false,
        lazyCompilation: false,
      },
    },
  },

  env: { CORE_DISABLE_TELEMETRY: "1" },
  staticDirs: ["../../../public"],

  // Find stories and MDX docs across UI package and local Storybook docs
  stories: [
    "../../../packages/ui/**/*.stories.@(ts|tsx)", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "./stories/**/*.stories.@(ts|tsx)", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "./stories/**/*.mdx", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
  ],

  addons: [
    "@storybook/addon-links", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    // Essentials are largely built-in on SB9; keep only specific addons we use
    "@storybook/addon-a11y", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "@storybook/addon-docs", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "@storybook/addon-measure", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "@storybook/addon-outline", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    "@chromatic-com/storybook", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    // interactions addon is pinned to SB8 and incompatible with SB9
    "@storybook/addon-themes", // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    coverageAddon,
    // Viewport addon removed in SB9; use built-in viewport tool via parameters
    // "storybook-addon-pseudo-states", // disabled: incompatible with SB8
    // "storybook-addon-designs", // disabled: incompatible with SB8
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
      "@themes-local": path.resolve(__dirname, "../../../packages/themes"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "@acme/i18n": path.resolve(__dirname, "../../../packages/i18n/src"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "@acme/i18n/package.json": path.resolve(__dirname, "../../../packages/i18n/package.json"),
      "@acme/types": path.resolve(__dirname, "../../../packages/types/src"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "@acme/types/package.json": path.resolve(__dirname, "../../../packages/types/package.json"),
      "@acme/zod-utils": path.resolve(__dirname, "../../../packages/zod-utils/src"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "@acme/zod-utils/package.json": path.resolve(__dirname, "../../../packages/zod-utils/package.json"),
      // Use Jest-style mocks for Next client modules when running in Storybook
      "next/image": path.resolve(__dirname, "../../../__mocks__/next/image.js"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "next/navigation": path.resolve(__dirname, "../../../__mocks__/next/navigation.js"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "next/headers": path.resolve(__dirname, "../../../__mocks__/next/headers.js"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "@platform-core/contexts/ThemeContext": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(
        __dirname,
        "./mocks/ThemeContext.tsx"
      ),
      "@acme/design-tokens": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(__dirname, "../../../packages/design-tokens/src"),
      "@acme/tailwind-config": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(__dirname, "../../../packages/tailwind-config/src"),
      // Force UI stories to use the pure data-only module to avoid server imports
      "@acme/platform-core/products$": // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      path.resolve(__dirname, "../../../packages/platform-core/src/products/index.ts"),
      // Stub server-only module used by Next server code paths
      "server-only": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      // Map node: scheme to bare names or stubs to avoid UnhandledSchemeError in Webpack
      "node:fs": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "node:path": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "node:crypto": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "node:module": false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      // Some files import the bare 'module' builtin; stub it in browser
      module: false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      // Third-party SDK not needed in Storybook bundles
      openai: false, // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      // Storybook blocks live in addon-docs; alias to avoid extra dep
      "@storybook/blocks": require.resolve("@storybook/addon-docs/blocks"),
      // Deduplicate Emotion to avoid multiple ThemeContexts between blocks/MDX
      "@emotion/react": require.resolve("@emotion/react"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
      "@emotion/styled": require.resolve("@emotion/styled"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
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

    // Filter noisy Next.js export warnings that are unavoidable when mocking the modules
    const warningPatterns = [
      /export '.*' \(imported as '.*'\) was not found in 'next\/image'/,
      /export '.*' \(imported as '.*'\) was not found in 'next\/navigation'/,
    ];
    const ignoreWarnings = Array.isArray(config.ignoreWarnings)
      ? config.ignoreWarnings
      : config.ignoreWarnings
        ? [config.ignoreWarnings]
        : [];
    config.ignoreWarnings = [...ignoreWarnings, ...warningPatterns];

    // Disable Webpack asset/entrypoint size hints — Storybook bundles are expected to be large
    config.performance = {
      ...(config.performance ?? {}),
      hints: false,
    };

    return config;
  },

  // Aliases and PostCSS are configured in vite.storybook.ts
};

export default config;

// This file has been automatically migrated to valid ESM format by Storybook.
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// .storybook/main.ts
import type { StorybookConfig } from "@storybook/nextjs";
import type { Configuration as WebpackConfiguration, ResolveOptions } from "webpack";
import webpack from "webpack";

import { getStorybookAliases } from "./aliases.ts";
import { coverageAddon } from "./coverage.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const enableChromaticAddon = process.env.STORYBOOK_ENABLE_CHROMATIC_ADDON === "true";

const config: StorybookConfig = {
  // Use the Webpack 5 builder explicitly per SB9 docs
  framework: {
    name: getAbsolutePath("@storybook/nextjs"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
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
    path.resolve(__dirname, "../../../packages/ui/**/*.stories.@(ts|tsx)"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    path.resolve(__dirname, "./stories/**/*.stories.@(ts|tsx)"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
    path.resolve(__dirname, "./stories/**/*.mdx"), // i18n-exempt -- ABC-123 [ttl=2025-12-31]
  ],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-docs"),
    // Chromatic add-on triggers noisy ariaLabel warnings in SB11; enable only when explicitly requested
    ...(enableChromaticAddon ? [getAbsolutePath("@chromatic-com/storybook")] : []),
    getAbsolutePath("@storybook/addon-themes"),
    coverageAddon,
    // Viewport addon removed in SB9; use built-in viewport tool via parameters
    // "storybook-addon-pseudo-states", // disabled: incompatible with SB8
    // "storybook-addon-designs", // disabled: incompatible with SB8
  ],

  // Configure Webpack aliases for workspace-local packages used in stories
  // Aliases and PostCSS are configured in vite.storybook.ts
  webpackFinal: async (config: WebpackConfiguration) => {
    type AliasMap = Record<string, string | false>;

    // Ensure resolve exists
    config.resolve = config.resolve ?? {};

    // Merge alias entries without using any
    const existingAlias: AliasMap = (config.resolve.alias ?? {}) as AliasMap;
    const newAlias: AliasMap = {
      ...existingAlias,
      ...getStorybookAliases(),
    };
    config.resolve.alias = newAlias as ResolveOptions["alias"];
    const existingExtensionAlias = config.resolve.extensionAlias ?? {};
    config.resolve.extensionAlias = {
      ...existingExtensionAlias,
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    config.resolve.extensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

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

    // Normalize node: scheme imports to bare modules to avoid UnhandledSchemeError
    config.plugins = [
      ...(config.plugins ?? []),
      new webpack.NormalModuleReplacementPlugin(/^node:(.*)$/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    ];

    return config;
  }
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

import type { StorybookConfig } from "@storybook/nextjs";
import type { Configuration as WebpackConfiguration, ResolveOptions } from "webpack";
import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import webpack from "webpack";

import { coverageAddon } from "../.storybook/coverage.ts";
import { getStorybookAliases } from "../.storybook/aliases.ts";
/* i18n-exempt file -- DS-2410 non-UI Storybook config strings [ttl=2026-01-01] */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
  },

  core: {
    builder: {
      name: "@storybook/builder-webpack5",
      options: {
        fsCache: false,
        lazyCompilation: false,
      },
    },
  },

  env: { CORE_DISABLE_TELEMETRY: "1" },
  staticDirs: ["../../../public"],

  // CI Storybook: curated, fast subset. Include internal stories plus core atoms/molecules/organisms for visual/a11y guardrails.
  // Include MDX docs for internal pages where useful (non-interactive)
  stories: [
    path.resolve(__dirname, "../.storybook/stories/**/*.stories.@(ts|tsx)"),
    path.resolve(__dirname, "../.storybook/stories/**/*.mdx"),
    // Core atomic system coverage
    path.resolve(__dirname, "../../../packages/ui/src/components/atoms/**/*.stories.@(ts|tsx)"),
    path.resolve(__dirname, "../../../packages/ui/src/components/molecules/**/*.stories.@(ts|tsx)"),
    path.resolve(__dirname, "../../../packages/ui/src/components/organisms/**/*.stories.@(ts|tsx)"),
    path.resolve(__dirname, "../../../packages/ui/src/components/cms/blocks/**/*.stories.@(ts|tsx)"),
    // Allowlist a handful of Matrix stories for a11y/visual gates
    path.resolve(__dirname, "../../../packages/ui/src/components/organisms/OrderSummary.Matrix.stories.tsx"),
    path.resolve(__dirname, "../../../packages/ui/src/components/organisms/ProductVariantSelector.Matrix.stories.tsx"),
    path.resolve(__dirname, "../../../packages/ui/src/components/organisms/ProductGallery.Matrix.stories.tsx"),
    path.resolve(__dirname, "../../../packages/ui/src/components/cms/blocks/ShowcaseSection.Matrix.stories.tsx"),
    path.resolve(__dirname, "../../../packages/ui/src/components/cms/blocks/CollectionSection.client.Matrix.stories.tsx"),
    // Page Builder flows (PB-N06) – add/reorder, style, template apply, locale/device, checkout composition
    path.resolve(__dirname, "../../../packages/ui/src/components/cms/PageBuilder.stories.tsx"),
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-a11y",
    "@chromatic-com/storybook",
    "@storybook/addon-themes",
    "@storybook/addon-docs",
    coverageAddon,
  ],

  webpackFinal: async (config: WebpackConfiguration) => {
    const resolve: ResolveOptions = config.resolve ?? {};
    const existingAlias =
      typeof resolve.alias === "object" && resolve.alias !== null
        ? resolve.alias
        : {};

    const aliases: NonNullable<ResolveOptions["alias"]> = {
      ...existingAlias,
      ...getStorybookAliases(),
      "@storybook/test": path.resolve(__dirname, "../.storybook/mocks/storybook-test.ts"),
      "node:fs": false,
      "node:path": false,
      fs: false,
      path: false,
      "node:crypto": false,
      "node:module": false,
      module: false,
      "server-only": false,
    };

    config.resolve = { ...resolve, alias: aliases };

    const existingFallback = (config.resolve?.fallback ?? {}) as Record<string, false | string>;
    config.resolve.fallback = {
      ...existingFallback,
      fs: false,
      path: false,
      crypto: false,
      module: false,
    };

    config.plugins = [
      ...(config.plugins ?? []),
      new webpack.NormalModuleReplacementPlugin(/^node:(.*)$/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    ];

    return config;
  },
};

export default config;

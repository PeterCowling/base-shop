import path, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/nextjs";
import type { Configuration as WebpackConfiguration, ResolveOptions } from "webpack";
import webpack from "webpack";

import { getStorybookAliases } from "../.storybook/aliases.ts";
import { coverageAddon } from "../.storybook/coverage.ts";
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

  // CI Storybook: curated, fast subset.
  // Keep internal diagnostics stories plus a small explicit allowlist that
  // underpins smoke and ci-tagged runner coverage.
  stories: [
    path.resolve(__dirname, "../.storybook/stories/**/*.stories.@(ts|tsx)"),
    // Explicit smoke contract stories used by storybook:smoke:ci
    path.resolve(__dirname, "../../../packages/ui/src/components/atoms/Tooltip.stories.tsx"),
    path.resolve(__dirname, "../../../packages/ui/src/components/molecules/FormField.stories.tsx"),
    // Allowlist Matrix stories for ci-tagged interaction coverage
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
    const existingExtensionAlias = config.resolve.extensionAlias ?? {};
    config.resolve.extensionAlias = {
      ...existingExtensionAlias,
      ".js": [".ts", ".tsx", ".js"],
      ".jsx": [".tsx", ".jsx"],
    };
    config.resolve.extensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

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

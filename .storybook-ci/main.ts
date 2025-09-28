import type { StorybookConfig } from "@storybook/nextjs";
import type { Configuration as WebpackConfiguration, ResolveOptions } from "webpack";
import path from "node:path";
/* i18n-exempt file -- DS-2410 non-UI Storybook config strings [ttl=2026-01-01] */

const config: StorybookConfig = {
  framework: {
    name: "@storybook/nextjs",
    options: { builder: { viteConfigPath: "./vite.storybook.ts" } },
  },

  env: { CORE_DISABLE_TELEMETRY: "1" },
  staticDirs: ["../public"],

  // CI Storybook: curated, fast subset. Include internal stories and a few allowlisted Matrix stories.
  // Include MDX docs for internal pages where useful (non-interactive)
  stories: [
    "../.storybook/stories/**/*.stories.@(ts|tsx)",
    "../.storybook/stories/**/*.mdx",
    // Allowlist a handful of Matrix stories for a11y/visual gates
    "../packages/ui/src/components/organisms/OrderSummary.Matrix.stories.tsx",
    "../packages/ui/src/components/organisms/ProductVariantSelector.Matrix.stories.tsx",
    "../packages/ui/src/components/organisms/ProductGallery.Matrix.stories.tsx",
    "../packages/ui/src/components/cms/blocks/ShowcaseSection.Matrix.stories.tsx",
    "../packages/ui/src/components/cms/blocks/CollectionSection.client.Matrix.stories.tsx",
  ],

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-viewport",
  ],

  webpackFinal: async (config: WebpackConfiguration) => {
    const resolve: ResolveOptions = config.resolve ?? {};
    const existingAlias =
      typeof resolve.alias === "object" && resolve.alias !== null
        ? resolve.alias
        : {};

    const aliases: NonNullable<ResolveOptions["alias"]> = {
      ...existingAlias,
      "@platform-core/contexts/ThemeContext": path.resolve(
        __dirname,
        "../.storybook/mocks/ThemeContext.tsx"
      ),
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

    config.resolve = { ...resolve, alias: aliases };
    return config;
  },
};

export default config;

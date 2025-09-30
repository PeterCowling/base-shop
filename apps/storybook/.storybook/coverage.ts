import type { AddonOptionsVite, AddonOptionsWebpack } from "@storybook/addon-coverage";

type CoverageOptionShape = NonNullable<AddonOptionsVite["istanbul"]> &
  NonNullable<AddonOptionsWebpack["istanbul"]>;

const includeGlobs = [
  "packages/ui/src/**/*.{ts,tsx,js,jsx}",
  "apps/storybook/.storybook/stories/**/*.{ts,tsx,js,jsx,mdx}",
];

const excludeGlobs = [
  "**/__tests__/**",
  "**/*.mock.*",
  "**/*.stories.ts",
  "**/*.stories.tsx",
  "**/*.stories.js",
  "**/*.stories.jsx",
  "**/*.stories.mdx",
  "**/*.Matrix.stories.tsx",
];

const extensions = [".ts", ".tsx", ".js", ".jsx"] as const;

export const coverageOptions: CoverageOptionShape = {
  include: includeGlobs,
  exclude: excludeGlobs,
  extension: [...extensions],
};

export const coverageAddon = {
  name: "@storybook/addon-coverage",
  options: {
    istanbul: coverageOptions,
  },
} as const;

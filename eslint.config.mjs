// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser"; // still needed for parser
import tsPlugin from "@typescript-eslint/eslint-plugin";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import dsPlugin from "@acme/eslint-plugin-ds";
import securityPlugin from "eslint-plugin-security";
import { fixupPluginRules } from "@eslint/compat";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  /* ▸ Global setup */
  {
    ignores: [
      "node_modules/",
      "**/dist/**",
      "packages/auth/dist/",
      "packages/configurator/bin/**",
      "**/.next/**",
      "**/build/**",
      "**/coverage/**",
      "**/index.js",
      "packages/ui/src/**/*.js",
      "packages/ui/src/**/*.d.ts",
      "packages/ui/src/**/*.d.ts.map",
      "apps/*/src/**/*.js",
      "apps/*/src/**/*.d.ts",
      "apps/*/src/**/*.js.map",
      "scripts/**/*.js",
      "packages/config/test/**",
      "**/__tests__/**",
      "**/__mocks__/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.d.ts",
      "**/jest.setup*.{ts,tsx}",
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/jest.config.*",
      "**/postcss.config.*",
      "packages/config/jest.preset.cjs",
      "apps/api/jest.config.cjs",
      "apps/api/postcss.config.cjs",
    ],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },

  /* ▸ Next.js presets (bring in @typescript-eslint plugin once) */
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  /* ▸ Security rules */
  {
    plugins: { security: fixupPluginRules(securityPlugin) },
    rules: {
      ...securityPlugin.configs.recommended.rules,
      "security/detect-object-injection": "off",
    },
  },

  /* ▸ Your repo-wide TypeScript rules (NO plugins key!) */
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./apps/*/tsconfig.json",
          "./packages/*/tsconfig.json",
          "./packages/*/tsconfig.eslint.json",
        ],
        projectService: true,
        allowDefaultProject: true,
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      // add more TS-only rules here
    },
  },

  /* ▸ Design system token enforcement (global) */
  {
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-raw-color": "error",
      "ds/no-raw-font": "error",
      // Scope the strict Tailwind color check to CMS to avoid breaking other apps
      "ds/no-raw-tailwind-color": "off",
    },
  },

  /* ▸ CMS-only: disallow raw Tailwind palette and arbitrary colors */
  {
    files: ["apps/cms/**/*.{ts,tsx,js,jsx,mdx}"],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-raw-tailwind-color": "error",
      // Prevent low-contrast hero patterns (phase in as a warning first)
      "ds/no-hero-primary-foreground": "warn",
    },
  },

  /* ▸ design-tokens uses generated dist files; lint without TS project */
  {
    files: ["packages/design-tokens/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },

  /* ▸ i18n package linting without TS project */
  {
    files: ["packages/i18n/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },

  /* ▸ tailwind-config package linting without TS project */
  {
    files: ["packages/tailwind-config/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },

  /* ▸ platform-core root files without TS project */
  {
    files: [
      "packages/platform-core/defaultFilterMappings.ts",
      "packages/platform-core/prisma/**/*.{ts,tsx,js,jsx}",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },

  /* ▸ Allow generated declaration files without a TS project */
  {
    files: ["**/dist/**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },

  /* ▸ Scripts directory override */
  {
    files: ["scripts/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [path.join(__dirname, "scripts/tsconfig.eslint.json")],
        tsconfigRootDir: __dirname,
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {},
  },

  /* ▸ Boundaries rules (unchanged) */
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "atoms", pattern: "packages/ui/components/atoms/*" },
        { type: "molecules", pattern: "packages/ui/components/molecules/*" },
        { type: "organisms", pattern: "packages/ui/components/organisms/*" },
        { type: "templates", pattern: "packages/ui/components/templates/*" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "atoms", allow: [] },
            { from: "molecules", allow: ["atoms"] },
            { from: "organisms", allow: ["atoms", "molecules"] },
            { from: "templates", allow: ["atoms", "molecules", "organisms"] },
          ],
        },
      ],
      "@next/next/no-html-link-for-pages": "off",
    },
  },

  /* ▸ Prevent direct inventory backend imports */
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/inventory.json.server",
                "**/inventory.prisma.server",
                "**/inventory.stub.server",
              ],
              message:
                "Import inventory repositories via inventory.server.ts façade instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "packages/platform-core/src/repositories/inventory.server.ts",
      "**/__tests__/**",
      "**/*.test.*",
      "**/*.spec.*",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },

  /* ▸ Test files relaxations */
  /* ▸ Test files: disallow hsl(var(--...)) literals that break contrast checks */
  {
    files: ["**/__tests__/**/*.{ts,tsx,js,jsx}", "**/*.test.{ts,tsx,js,jsx}", "**/*.spec.{ts,tsx,js,jsx}"],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-hsl-var-in-tests": "error",
    },
  },

  /* ▸ Enforce UI component layering */
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./packages/ui/src/components/atoms",
              from: "./packages/ui/src/components/molecules",
            },
            {
              target: "./packages/ui/src/components/atoms",
              from: "./packages/ui/src/components/organisms",
            },
            {
              target: "./packages/ui/src/components/atoms",
              from: "./packages/ui/src/components/templates",
            },
            {
              target: "./packages/ui/src/components/molecules",
              from: "./packages/ui/src/components/organisms",
            },
            {
              target: "./packages/ui/src/components/molecules",
              from: "./packages/ui/src/components/templates",
            },
            {
              target: "./packages/ui/src/components/organisms",
              from: "./packages/ui/src/components/templates",
            },
          ],
        },
      ],
    },
  },

  /* ▸ Treat UI Storybook files as non-project to avoid TS project errors */
  {
    files: ["packages/ui/**/*.stories.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Storybook stories often contain inline hooks in render functions
      "react-hooks/rules-of-hooks": "off",
    },
  },

  /* ▸ Page builder uses dynamic, permissive typing */
  {
    files: ["packages/ui/src/components/cms/page-builder/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

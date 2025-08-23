// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser"; // still needed for parser
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import { fixupPluginRules } from "@eslint/compat";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  /* ▸ Global setup */
  {
    ignores: [
      "**/dist/**",
      "packages/auth/dist/",
      "**/.next/**",
      "**/index.js",
      "packages/ui/src/**/*.js",
      "packages/ui/src/**/*.d.ts",
      "packages/ui/src/**/*.d.ts.map",
      "apps/*/src/**/*.js",
      "apps/*/src/**/*.d.ts",
      "apps/*/src/**/*.js.map",
      "**/*.d.ts",
    ],
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

  /* ▸ Your repo-wide TypeScript rules (NO plugins key!) */
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"],
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

  /* ▸ Test files relaxations */
  {
    files: ["**/__tests__/**/*.{ts,tsx,js,jsx}", "**/*.test.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  /* ▸ Enforce UI component layering */
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
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
];

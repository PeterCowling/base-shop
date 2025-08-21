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
  /* ▸ Global ignores ─ JS/JSX are skipped entirely */
  {
    ignores: [
      "**/dist/**",
      "**/.next/**",
      "**/index.js",
      "**/*.js",
      "**/*.jsx",
    ],
  },

  /* ▸ Next.js presets (bring in @typescript-eslint plugin once) */
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  /* ▸ Your repo-wide TypeScript rules (NO plugins key!) */
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json", "./apps/api/tsconfig.json"],
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
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

  /* ▸ Enforce UI component layering */
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    plugins: { import: fixupPluginRules(importPlugin) },
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

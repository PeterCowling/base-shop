import tsParser from "@typescript-eslint/parser";

import baseConfig from "../../eslint.config.mjs";

const config = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  {
    ignores: ["src/**/*.js", "src/**/*.d.ts", "**/*.d.ts"],
  },
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
      "ds/min-tap-size": "off",
      "ds/enforce-layout-primitives": "off",
      "ds/container-widths-only-at": "off",
      "ds/no-physical-direction-classes-in-rtl": "off",
      "ds/no-arbitrary-tailwind": "off",
      complexity: ["error", 70],
      "max-lines-per-function": [
        "error",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["error", 12],
      "promise/param-names": "off",
    },
  },
  {
    files: ["src/**/*.stories.{ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
      "react-hooks/rules-of-hooks": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}", "__tests__/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hsl-var-in-tests": "off",
      "promise/param-names": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/components/cms/page-builder/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/**/story-utils/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-exports": "off",
    },
  },
];

export default config;

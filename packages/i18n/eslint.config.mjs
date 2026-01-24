import tsParser from "@typescript-eslint/parser";

import baseConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["src/**/*.js", "src/**/*.d.ts"],
  },
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx,js,jsx}", "scripts/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/consistent-type-exports": "off",
      "ds/no-hardcoded-copy": "off",
      "ds/require-disable-justification": "off",
    },
  },
  {
    files: ["scripts/**/*.{ts,tsx}"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: [
      "src/tokenization/pii-scanner.ts",
      "src/tokenization/tokenizer.ts",
    ],
    rules: {
      "security/detect-unsafe-regex": "off",
      "security/detect-non-literal-regexp": "off",
    },
  },
];

export default config;

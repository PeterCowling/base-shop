import tsParser from "@typescript-eslint/parser";

import baseConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["src/**/*.js", "src/**/*.d.ts", "**/*.d.ts"],
  },
  ...baseConfig,
  {
    files: [
      "src/createShop/assetIngest.ts",
      "src/media/imageProcessing.ts",
      "src/productTemplates.ts",
      "src/stripeConnect/shopIntegration.ts",
      "src/themeRegistry/index.ts",
    ],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["src/logging/redaction.ts"],
    rules: {
      "security/detect-unsafe-regex": "off",
    },
  },
  {
    files: ["defaultFilterMappings.ts", "prisma/**/*.{ts,tsx}"],
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
  {
    files: ["src/**/__tests__/**/*.{ts,tsx,js,jsx}", "__tests__/**/*.{ts,tsx,js,jsx}", "src/**/*.{spec,test}.{ts,tsx,js,jsx}"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
      "ds/require-disable-justification": "off",
      complexity: ["error", 75],
      "max-depth": ["error", 7],
      "max-lines-per-function": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
];

export default config;

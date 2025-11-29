import baseConfig from "../../eslint.config.mjs";

const config = [
  ...baseConfig,
  // Enforce M6 rules explicitly for CMS app sources (defensive wiring)
  {
    files: ["src/**/*.{ts,tsx,mdx}"],
    rules: {
      "ds/require-aspect-ratio-on-media": "error",
      "ds/no-naked-img": "error",
      "ds/no-overflow-hazards": "error",
      "ds/absolute-parent-guard": "error",
      "ds/no-nonlayered-zindex": "error",
      "ds/no-unsafe-viewport-units": "error",
    },
  },
  // CMS does not require translations; allow hardcoded text in this app
  {
    files: ["src/**/*.{ts,tsx,js,jsx,mdx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },
  {
    files: [
      "src/**/__tests__/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
    rules: {
      "ds/no-raw-color": "off",
      "ds/no-naked-img": "off",
      "ds/require-aspect-ratio-on-media": "off",
      "react/display-name": "off",
    },
  },
  // Cypress + middleware: lint outside TS project to avoid projectService errors
  {
    files: [
      "cypress.config.mjs",
      "cypress/**/*.{ts,tsx}",
      "middleware.ts"
    ],
    languageOptions: {
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Config and test harness code use dynamic paths and fixture regexes
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-unsafe-regex": "off",
      // Cypress support/harness are not user-facing UI; allow inline copy and bare disables
      "ds/no-hardcoded-copy": "off",
      "ds/require-disable-justification": "off",
    },
  },

  // CMS app: treat tap-size rule as non-blocking while UI is iterated
  {
    files: ["src/**/*.{ts,tsx,mdx}"],
    rules: {
      "ds/min-tap-size": "off",
    },
  },
];

export default config;

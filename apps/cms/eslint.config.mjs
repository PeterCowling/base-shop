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
      // Type-aware rules require project config which we've disabled
      "@typescript-eslint/consistent-type-exports": "off",
      // Config and test harness code use dynamic paths and fixture regexes
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-unsafe-regex": "off",
      // Cypress support/harness are not user-facing UI; allow inline copy and bare disables
      "ds/no-hardcoded-copy": "off",
      "ds/require-disable-justification": "off",
      // Cypress tests have deeply nested describe/context/it blocks
      "max-nested-callbacks": "off",
      "max-lines-per-function": "off",
      // Cypress config may use console for debug output
      "no-console": "off",
    },
  },

  // CMS app: treat tap-size rule as non-blocking while UI is iterated
  {
    files: ["src/**/*.{ts,tsx,mdx}"],
    rules: {
      "ds/min-tap-size": "off",
    },
  },

  // CMS shop editor wiring: allow `any` for component config
  {
    files: ["src/app/cms/shop/*/settings/editorSections.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // CMS app: relaxed complexity limits (admin UI with complex forms and configurators)
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 60],
      "max-lines-per-function": [
        "error",
        { max: 600, skipBlankLines: true, skipComments: true },
      ],
      "max-nested-callbacks": ["error", 6],
      // CMS uses any types in component config wiring
      "@typescript-eslint/no-explicit-any": "off",
      // CMS services may log during development
      "no-console": "off",
      // Allow import duplicates (path alias resolution issues)
      "import/no-duplicates": "off",
      // Disable promise param naming in CMS - many use short names in test patterns
      "promise/param-names": "off",
    },
  },

  // CMS root-level files (instrumentation.ts, etc.)
  {
    files: ["*.ts", "*.tsx"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  // CMS root-level __tests__ directory
  {
    files: ["__tests__/**/*.{ts,tsx}"],
    rules: {
      "promise/param-names": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
];

export default config;

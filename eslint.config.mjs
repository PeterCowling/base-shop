// eslint.config.mjs
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser"; // still needed for parser
import tsPlugin from "@typescript-eslint/eslint-plugin";
import boundaries from "eslint-plugin-boundaries";
import importPlugin from "eslint-plugin-import";
import dsPlugin from "@acme/eslint-plugin-ds";
import securityPlugin from "eslint-plugin-security";
import { fixupPluginRules } from "@eslint/compat";
import jsxA11y from "eslint-plugin-jsx-a11y";
import testingLibrary from "eslint-plugin-testing-library";
import storybook from "eslint-plugin-storybook";
import noOnlyTests from "eslint-plugin-no-only-tests";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import promisePlugin from "eslint-plugin-promise";
// Optional: Tailwind plugin is currently incompatible with Tailwind v4's exports in some versions
let tailwindcss;
try {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  tailwindcss = (await import("eslint-plugin-tailwindcss")).default;
} catch (e) {
  // Best-effort: continue without Tailwind plugin
}
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import eslintIgnorePatterns from "./tools/eslint-ignore-patterns.cjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

// Utility: turn off all ds/* rules (useful for the plugin's own test files)
const offAllDsRules = Object.fromEntries(
  Object.keys((dsPlugin && dsPlugin.rules) || {}).map((name) => [
    `ds/${name}`,
    "off",
  ])
);

export default [
  /* ▸ Global setup */
  {
    ignores: eslintIgnorePatterns,
  },
  /* ▸ Baseline DX plugins (no new rules except Tailwind contradicting classes) */
  // Baseline DX plugins are provided by Next/other configs; avoid redefining to prevent Flat config conflicts.
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Register baseline plugin objects and enable only Tailwind's contradicting class rule
    plugins: {
      ...(tailwindcss ? { tailwindcss } : {}),
      "jsx-a11y": jsxA11y,
      "testing-library": testingLibrary,
    },
    rules: tailwindcss
      ? {
          "tailwindcss/no-contradicting-classname": "error",
        }
      : {},
  },

  /* ▸ UI published components: disallow Tailwind palette colors; use tokens */
  {
    files: ["packages/ui/src/components/**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "packages/ui/src/components/cms/**/*",
      // Operations are internal admin tools; relax palette color restrictions
      "packages/ui/src/components/organisms/operations/**/*",
      // StatusIndicator uses semantic palette colors for status states
      "packages/ui/src/components/atoms/StatusIndicator/**/*",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\b(?:text|bg|border)-(?:white|black|slate|zinc|gray|neutral|stone|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink)(?:-[0-9]{2,3})?\\b/ ]",
          message:
            "Use token-based utilities (e.g., text-foreground, bg-bg, border-danger) instead of Tailwind palette colors in published UI.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateLiteral[quasis.0.value.raw=/.*\\b(?:text|bg|border)-(?:white|black|slate|zinc|gray|neutral|stone|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink)(?:-[0-9]{2,3})?\\b.*/ ]",
          message:
            "Avoid Tailwind palette colors in published UI; prefer token utilities.",
        },
      ],
    },
  },

  /* ▸ Token enforcement (palette classes + inline hex) across UI + Storybook */
  {
    files: [
      "packages/ui/src/components/**/*.{ts,tsx,js,jsx}",
      "apps/storybook/.storybook/**/*.{ts,tsx,js,jsx}",
    ],
    ignores: [
      "**/__tests__/**/*",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.d.ts",
      // Operations are internal admin tools; relax palette color restrictions
      "packages/ui/src/components/organisms/operations/**/*",
      // StatusIndicator uses semantic palette colors for status states
      "packages/ui/src/components/atoms/StatusIndicator/**/*",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='className'] Literal[value=/\\b(?:text|bg|border)-(?:white|black|slate|zinc|gray|neutral|stone|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink)(?:-[0-9]{2,3})?\\b/ ]",
          message:
            "Use token-based utilities (e.g., text-foreground, bg-background, border-border) instead of Tailwind palette colors.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] TemplateLiteral[quasis.0.value.raw=/.*\\b(?:text|bg|border)-(?:white|black|slate|zinc|gray|neutral|stone|red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink)(?:-[0-9]{2,3})?\\b.*/ ]",
          message:
            "Avoid Tailwind palette colors; prefer token utilities.",
        },
        {
          selector:
            "JSXAttribute[name.name='style'] ObjectExpression > Property[key.name=/color|background|borderColor/i] Literal[value=/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/]",
          message:
            "Avoid inline hex colors; use token-based classes or CSS variables instead.",
        },
      ],
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
  /* ▸ Relax noisy security rules in email package tests */
  {
    files: [
      "packages/email/**/__tests__/**/*.{ts,tsx,js,jsx}",
      "packages/email/__tests__/**/*.{ts,tsx,js,jsx}",
    ],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-require": "off",
    },
  },

  /* ▸ platform-core tests: allow dynamic tmp file paths */
  {
    files: [
      "packages/platform-core/**/__tests__/**/*.{ts,tsx,js,jsx}",
      "packages/platform-core/__tests__/**/*.{ts,tsx,js,jsx}",
      "packages/platform-core/**/*.{spec,test}.{ts,tsx,js,jsx}",
    ],
    rules: {
      // Tests create temporary fixture files/directories; paths are scoped and safe
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["scripts/src/seed-test-data.ts"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["scripts/src/component-names.ts"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  /* ▸ Serverless functions: allow dynamic filesystem paths rooted at DATA_ROOT */
  {
    files: ["functions/src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  /* ▸ Business OS agent runner + repo utilities: allow dynamic filesystem paths */
  {
    files: [
      "apps/business-os/src/agent-runner/**/*.{ts,tsx,js,jsx}",
      "apps/business-os/src/lib/repo/**/*.{ts,tsx,js,jsx}",
    ],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
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
          "./tsconfig.test.json",
          "./test/tsconfig.json",
          "./apps/*/tsconfig.json",
          "./packages/*/tsconfig.json",
          "./packages/*/tsconfig.eslint.json",
          "./packages/*/scripts/tsconfig.json",
          "./functions/tsconfig.json",
          "./scripts/tsconfig.eslint.json",
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
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // add more TS-only rules here
    },
  },

  /* ▸ MCP server scripts: allow default project (no type-aware lint) */
  {
    files: ["packages/mcp-server/scripts/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: false,
        allowDefaultProject: true,
      },
    },
    rules: {
      // Scripts are inherently procedural; keep guardrails but allow more complexity/depth.
      complexity: ["error", 80],
      "max-depth": ["error", 10],
    },
  },

  /* ▸ Design system token enforcement (global) */
  {
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-raw-color": "error",
      "ds/no-raw-font": "error",
      // Baseline raw Tailwind palette usage repo-wide; stricter enforcement in CMS
      "ds/no-raw-tailwind-color": "warn",
      // Governance: require ticketed eslint-disable justifications (baseline warn; overridden later per scope)
      "ds/require-disable-justification": [
        "warn",
        { ticketPattern: "[A-Z]{2,}(?:-[A-Z0-9]{2,})*-\\d+" },
      ],
    },
  },

  /* ▸ Allow raw colors in platform-core validation tests */
  {
    files: ["packages/platform-core/src/validation/__tests__/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "ds/no-raw-color": "off",
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

  /* ▸ Design-system motion safety: ban transition-all in DS + mirrored atoms */
  {
    files: [
      "packages/design-system/src/**/*.{ts,tsx}",
      "packages/ui/src/components/atoms/**/*.{ts,tsx}",
    ],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-transition-all": "error",
    },
  },

  /* ▸ M1 baseline: default warnings for token/arbitrary/important rules */
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-raw-spacing": "warn",
      "ds/no-raw-typography": "warn",
      "ds/no-raw-radius": "warn",
      "ds/no-raw-shadow": "warn",
      "ds/no-raw-zindex": "warn",
      "ds/no-arbitrary-tailwind": "warn",
      "ds/no-important": "warn",
      // M3 baseline warnings
      "ds/require-min-w-0-in-flex": "warn",
      "ds/forbid-fixed-heights-on-text": "warn",
      "ds/require-breakpoint-modifiers": "warn",
      // M4 baseline warnings
      "ds/no-hardcoded-copy": "warn",
      "ds/no-physical-direction-classes-in-rtl": "warn",
      // M2 baseline warnings
      "ds/no-negative-margins": "warn",
      "ds/no-margins-on-atoms": "warn",
      "ds/enforce-layout-primitives": "warn",
      "ds/container-widths-only-at": "warn",
      // M5 baseline warnings
      "ds/enforce-focus-ring-token": "warn",
      "ds/min-tap-size": ["warn", { min: 40 }],
      "ds/no-misused-sr-only": "warn",
      
    },
  },

  /* ▸ CMS/UI globs: enforce token/arbitrary/important as errors */
  {
    files: [
      "packages/ui/src/components/**/*.{ts,tsx}",
      "apps/**/src/**/*.{ts,tsx}",
    ],
    plugins: { ds: dsPlugin },
    rules: {
      // Governance: escalate in CMS/UI/app shells
      "ds/require-disable-justification": "error",
      // Media and layout safety
      "ds/require-aspect-ratio-on-media": "error",
      "ds/no-naked-img": "error",
      "ds/absolute-parent-guard": "error",
      "ds/no-nonlayered-zindex": "error",
      "ds/no-unsafe-viewport-units": "error",
      "ds/no-raw-spacing": "error",
      "ds/no-raw-typography": "error",
      "ds/no-raw-radius": "error",
      "ds/no-raw-shadow": "error",
      // z-index: error in CMS/UI; remains warn elsewhere
      "ds/no-raw-zindex": "error",
      "ds/no-arbitrary-tailwind": "error",
      "ds/no-important": "error",
      // M3 rules as errors in CMS/UI paths
      "ds/require-min-w-0-in-flex": "error",
      "ds/forbid-fixed-heights-on-text": "error",
      "ds/require-breakpoint-modifiers": "error",
      // M4 rules as errors in CMS/UI paths
      "ds/no-hardcoded-copy": "error",
      "ds/no-physical-direction-classes-in-rtl": "error",
      // M2 rules as errors in CMS/UI paths
      "ds/no-negative-margins": "error",
      "ds/no-margins-on-atoms": "error",
      "ds/enforce-layout-primitives": "error",
      "ds/container-widths-only-at": "error",
      // M5 rules as errors in CMS/UI paths
      "ds/enforce-focus-ring-token": "error",
      "ds/no-misused-sr-only": "error",
      
    },
  },

  /* ▸ Global DS tap-size baseline: treat as warning unless explicitly overridden */
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "ds/min-tap-size": ["warn", { min: 44 }],
    },
  },
  {
    files: ["apps/cochlearfit/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "ds/no-unsafe-viewport-units": "off",
      "ds/no-nonlayered-zindex": "off",
    },
  },
  // Downgrade no-hardcoded-copy in TS-only files to ease server/logic migration
  {
    files: [
      "apps/**/src/**/*.ts",
      "packages/ui/src/**/*.ts",
    ],
    rules: {
      "ds/no-hardcoded-copy": "warn",
    },
  },

  /* ▸ Try-on Cloudflare provider: non-UI copy (logged errors) */
  {
    files: ["packages/lib/src/tryon/providers/cloudflare.ts"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ API publish-upgrade test helpers: allow module assignment shim */
  {
    files: [
      "apps/api/src/routes/shop/*/__tests__/publish-upgrade.test-helpers.ts",
    ],
    rules: {
      "@next/next/no-assign-module-variable": "off",
    },
  },

  /* ▸ UI Page Builder: enforce icon-only Button sizing (warning during migration) */
  {
    files: ["packages/ui/src/components/cms/page-builder/**/*.{ts,tsx}"],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/icon-button-size": "error",
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
  /* ▸ config env schema lives at package root; lint without TS project */
  {
    files: ["packages/config/env-schema.ts"],
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
    files: ["packages/configurator/**/*.{ts,tsx,js,jsx}"],
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
  {
    files: ["packages/tailwind-config/plugins/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["packages/editorial/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["test/unit/**"],
    rules: {
      "security/detect-non-literal-require": "off",
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["test/unit/init-shop/**"],
    rules: {
      "ds/no-raw-color": "off",
    },
  },
  {
    files: [
      "apps/cms/src/app/cms/configurator/components/__tests__/**/*.{ts,tsx,js,jsx}",
    ],
    rules: {
      "react/display-name": "off",
    },
  },
  /* ▸ UI story-utils helpers: lint without TS project (Storybook-only types) */
  {
    files: [
      // When linting from repo root
      "packages/ui/src/story-utils/**/*.{ts,tsx,js,jsx}",
      "packages/ui/src/components/story-utils/**/*.{ts,tsx,js,jsx}",
      // When linting from within the @acme/ui package (cwd=packages/ui)
      "src/story-utils/**/*.{ts,tsx,js,jsx}",
      "src/components/story-utils/**/*.{ts,tsx,js,jsx}",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
        ecmaFeatures: { jsx: true },
      },
    },
  },

  /* ▸ eslint-plugin-ds: allow 'any' in parser utilities */
  {
    files: ["packages/eslint-plugin-ds/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // Allow authoring rule messages and test strings without tripping DS rules
      "ds/no-hardcoded-copy": "off",
      "ds/no-raw-font": "off",
    },
  },

  /* ▸ eslint-plugin-ds rule sources: allow dynamic/specific regexes */
  {
    files: ["packages/eslint-plugin-ds/src/**/*.ts"],
    rules: {
      // Rule implementations legitimately construct regex from known arrays/config
      // and use bounded patterns. Silence security plugin noise here.
      "security/detect-non-literal-regexp": "off",
      "security/detect-unsafe-regex": "off",
    },
  },

  /* ▸ eslint-plugin-ds tests: treat as fixtures; disable ds rules and regex noise */
  {
    files: ["packages/eslint-plugin-ds/tests/**/*.{ts,tsx,js,jsx}"],
    // Lint tests without TS project to match other test overrides
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
    rules: {
      ...offAllDsRules,
      "security/detect-non-literal-regexp": "off",
      "security/detect-unsafe-regex": "off",
    },
  },

  /* ▸ Cypress specs: relax strict TS comments and 'any' for test ergonomics */
  {
    files: ["**/*.cy.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "ds/no-raw-color": "off",
      "ds/no-hsl-var-in-tests": "off",
    },
  },

  /* ▸ Cypress support files: allow unused overwrite arguments */
  {
    files: ["apps/cms/cypress/support/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "ds/no-hardcoded-copy": "off",
      "ds/require-disable-justification": "off",
    },
  },

  /* ▸ End-to-end test specs: allow raw colors and expression-style assertions */
  {
    files: ["test/e2e/__tests__/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "ds/no-raw-color": "off",
      "ds/no-hsl-var-in-tests": "off",
    },
  },

  /* ▸ CMS tests: relax raw color checks and React display-name in test modules */
  {
    files: [
      "apps/cms/src/**/__tests__/**/*.{ts,tsx,js,jsx}",
      "apps/cms/src/**/*.test.{ts,tsx}",
    ],
    rules: {
      "ds/no-raw-color": "off",
      "react/display-name": "off",
    },
  },

  /* ▸ CMS shop settings UI: treat tap-size as warning while design is iterated */
  {
    files: [
      "apps/cms/src/app/cms/shop/*/settings/seo/SeoAdvancedSettings.tsx",
      "apps/cms/src/app/cms/shop/*/themes/TypographySettings.tsx",
    ],
    rules: {
      "ds/min-tap-size": "warn",
    },
  },

  /* ▸ CMS shop editor sections: allow any in config wiring */
  {
    files: ["apps/cms/src/app/cms/shop/*/settings/editorSections.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
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

  /* ▸ Allow declaration files without a TS project */
  {
    files: ["**/*.d.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
    plugins: { ds: dsPlugin, "@typescript-eslint": tsPlugin },
    rules: {
      // d.ts files are type declarations; relax rules that don't apply
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
      // Declaration files may include raw font stacks as string literal types
      // (e.g., "sans-serif", "monospace"). These are not authored UI code
      // paths and should not be subject to DS enforcement.
      "ds/no-raw-font": "off",
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
  {
    files: ["scripts/seo-audit.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },
  /* ▸ App scripts: parse without a TS project */
  {
    files: ["apps/*/scripts/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },

  /* ▸ Cypress configs/support: parse outside TS project */
  {
    files: [
      "apps/cms/cypress.config.mjs",
      "apps/cms/cypress/**/*.{ts,tsx}",
      "apps/cms/middleware.ts",
    ],
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
      // Config and test harness code use dynamic paths and fixture regexes
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-unsafe-regex": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Type-aware rules cannot be used without project config
      "@typescript-eslint/consistent-type-exports": "off",
    },
  },

  /* ▸ Scripts plain JS: lint without a TS project */
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      // Node scripts may use require() ergonomically
      "@typescript-eslint/no-require-imports": "off",
      // Scripts often pass dynamic file paths; relax noisy security rule
      "security/detect-non-literal-fs-filename": "off",
    },
  },

  /* ▸ cover-me-pretty tests: relax strict TS rules for try-on API fixtures */
  {
    files: ["apps/cover-me-pretty/__tests__/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  /* ▸ cover-me-pretty app: relax strict DS + TS rules for try-on/AI prototype code */
  {
    files: ["apps/cover-me-pretty/src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "ds/min-tap-size": "warn",
      "ds/require-aspect-ratio-on-media": "warn",
      "ds/no-naked-img": "warn",
      "ds/no-physical-direction-classes-in-rtl": "warn",
      "ds/enforce-layout-primitives": "warn",
      "ds/enforce-focus-ring-token": "warn",
      "ds/no-unsafe-viewport-units": "warn",
    },
  },

  /* ▸ Tools (storybook coverage) override */
  {
    files: ["tools/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: [path.join(__dirname, "tools/tsconfig.eslint.json")],
        tsconfigRootDir: __dirname,
        // Ensure we use the explicit project rather than the TS project service
        projectService: false,
        // Allow parsing even if a file falls outside the project (IDE edge cases)
        allowDefaultProject: true,
      },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {},
  },

  /* ▸ test-utils helpers: allow ergonomic any/require usage */
  {
    files: ["packages/test-utils/src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  /* ▸ Dummy theme tokens: parse outside TS project to avoid project service errors */
  {
    files: ["packages/themes/dummy/tailwind-tokens/src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
    },
  },

  /* ▸ Root Storybook config: parse without a TS project */
  {
    files: [
      "apps/storybook/.storybook/**/*.{ts,tsx,js,jsx}",
      "apps/storybook/.storybook-ci/**/*.{ts,tsx,js,jsx}",
      "apps/storybook/.storybook-composed/**/*.{ts,tsx,js,jsx}",
    ],
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
      ...offAllDsRules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  /* ▸ Root plopfile: parse without a TS project */
  {
    files: ["plopfile.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
      },
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
            {
              group: [
                "@acme/*/src/**",
                "@acme/ui/src/**",
                "@acme/platform-core/src/**",
              ],
              message:
                "Import from package public entrypoints (e.g. @acme/<pkg> or documented subpaths) instead of src/* internals.",
            },
          ],
        },
      ],
    },
  },

  /* ▸ Deprecate presentation imports from @acme/ui (migrate to @acme/design-system) */
  {
    files: ["apps/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "warn",
        {
          patterns: [
            {
              group: ["@acme/ui/atoms", "@acme/ui/atoms/*"],
              message:
                "Import presentation primitives from @acme/design-system/primitives instead of @acme/ui/atoms.",
            },
            {
              group: ["@acme/ui/components/atoms/primitives", "@acme/ui/components/atoms/primitives/*"],
              message:
                "Import primitives from @acme/design-system/primitives instead.",
            },
            {
              group: ["@acme/ui/components/atoms/shadcn", "@acme/ui/components/atoms/shadcn/*"],
              message:
                "Import from @acme/design-system/shadcn instead.",
            },
            {
              group: ["@acme/ui/utils/style", "@acme/ui/utils/style/*"],
              message:
                "Import style utils (cn, cssVars, boxProps) from @acme/design-system/utils/style instead.",
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
    files: [
      "**/__tests__/**/*.{ts,tsx,js,jsx}",
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/*.cy.{ts,tsx,js,jsx}",
    ],
    // Lint tests without requiring inclusion in a TS project
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-hsl-var-in-tests": "error",
      // Tests/specs/Cypress can carry literal copy for assertions/fixtures
      "ds/no-hardcoded-copy": "off",
      // Tests don't author fonts; avoid false positives from words like "timestamp"/"times"
      "ds/no-raw-font": "off",
      // Allow require() style imports in tests for mocking ergonomics
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  /* ▸ eslint-plugin-ds tests: exempt from no-hsl-var-in-tests (they validate the rule) */
  {
    files: ["packages/eslint-plugin-ds/tests/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "ds/no-hsl-var-in-tests": "off",
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

  /* ▸ Package layering: prevent platform-core depending on UI or apps */
  {
    files: ["packages/platform-core/**/*.{ts,tsx,js,jsx}"],
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./packages/ui/src",
              from: "./packages/platform-core/src",
              message:
                "@acme/platform-core must not depend on @acme/ui; keep domain logic UI-agnostic and consume UI from apps or CMS packages instead.",
            },
            {
              target: "./apps",
              from: "./packages/platform-core/src",
              message:
                "@acme/platform-core must not import from apps; expose APIs in platform-core and consume them from apps instead.",
            },
          ],
        },
      ],
    },
  },

  /* ▸ Package layering: design-system cannot import from cms-ui or ui */
  {
    files: ["packages/design-system/**/*.{ts,tsx,js,jsx}"],
    plugins: { import: importPlugin },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@acme/cms-ui", "@acme/cms-ui/*"],
              message:
                "@acme/design-system cannot depend on @acme/cms-ui; design system is the base layer.",
            },
            {
              group: ["@acme/ui", "@acme/ui/*"],
              message:
                "@acme/design-system cannot depend on @acme/ui; design system is the base layer.",
            },
          ],
        },
      ],
    },
  },

  /* ▸ Package layering: cms-ui CAN import from ui (cms-ui is the higher layer)
   * The layering is: design-system (lowest) → ui (middle) → cms-ui (highest)
   * cms-ui may import from both ui and design-system.
   * This is intentional - see docs/plans/ui-architecture-consolidation-plan.md
   */

  /* ▸ Package layering: ui shims can import from cms-ui (backward compat only) */
  {
    files: ["packages/ui/src/shims/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Override the cms-ui restriction for shim files only
      "no-restricted-imports": "off",
    },
  },

  /* ▸ Package layering: ui production code cannot import from cms-ui (except shims) */
  {
    files: ["packages/ui/src/**/*.{ts,tsx,js,jsx}"],
    ignores: ["packages/ui/src/shims/**/*.{ts,tsx,js,jsx}"],
    plugins: { import: importPlugin },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@acme/cms-ui", "@acme/cms-ui/*"],
              message:
                "@acme/ui production code cannot depend on @acme/cms-ui; import from @acme/design-system instead.",
            },
          ],
        },
      ],
    },
  },

  /* ▸ UI atoms/primitives seldom contain user-facing copy — relax i18n rule */
  {
    files: ["packages/ui/src/components/atoms/primitives/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
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
      "react-hooks/exhaustive-deps": "off",
      // Stories are dev-only; allow copy and relax DS layout constraints
      "ds/no-hardcoded-copy": "off",
      "ds/enforce-layout-primitives": "off",
      "ds/no-margins-on-atoms": "off",
      "ds/min-tap-size": "off",
      "ds/container-widths-only-at": "off",
      "ds/no-physical-direction-classes-in-rtl": "off",
      // Relax additional UI-hardening rules for dev-only stories
      "react/forbid-dom-props": "off",
      "react/no-array-index-key": "off",
      "react/jsx-no-constructed-context-values": "off",
      "react/no-unstable-nested-components": "off",
      "react/jsx-no-useless-fragment": "off",
      "react/self-closing-comp": "off",
      "react/jsx-no-target-blank": "off",
      "react/no-unescaped-entities": "off",
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/alt-text": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/interactive-supports-focus": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/media-has-caption": "off",
      "jsx-a11y/role-has-required-aria-props": "off",
      "jsx-a11y/no-aria-hidden-on-focusable": "off",
      // Stories can use plain <img> for simplicity; not production code
      "@next/next/no-img-element": "off",
    },
  },

  /* ▸ UI test files: relax rules for test ergonomics */
  {
    files: ["packages/ui/**/*.test.{ts,tsx}", "packages/ui/**/__tests__/**/*.{ts,tsx}"],
    rules: {
      // Tests are dev-only; disable copy and DS rules
      "ds/no-hardcoded-copy": "off",
      ...offAllDsRules,
      // Relax a11y and React rules for test fixtures
      "jsx-a11y/no-autofocus": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "react/no-unescaped-entities": "off",
      "react/forbid-dom-props": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  /* ▸ Page builder uses dynamic, permissive typing */
  {
    files: ["packages/ui/src/components/cms/page-builder/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  /* ▸ UI templates and CMS: downgrade strict DS layout rules to warnings to enable incremental refactors */
  {
    files: [
      "packages/ui/src/components/templates/**/*.{ts,tsx}",
      "packages/ui/src/components/cms/**/*.{ts,tsx}",
    ],
    ignores: ["**/*.stories.{ts,tsx}"],
    rules: {
      // Keep governance at error for CMS/templates
      "ds/require-disable-justification": "error",
      "ds/enforce-layout-primitives": "warn",
      "ds/no-margins-on-atoms": "warn",
      "ds/min-tap-size": ["warn", { min: 40 }],
      "ds/container-widths-only-at": "warn",
      "ds/no-arbitrary-tailwind": "warn",
      "ds/no-physical-direction-classes-in-rtl": "warn",
      // Keep copy enforcement as error for product UI; CMS/templates can be iterated with warnings
      "ds/no-hardcoded-copy": "warn",
    },
  },

  

  /* ▸ UI package: temporarily downgrade strict rules to warnings to unblock lint */
  {
    files: ["packages/ui/src/**/*.{ts,tsx}"],
    // Do not apply this downgrade to published UI components, tests, or stories; they are handled elsewhere
    ignores: [
      "packages/ui/src/components/**/*.{ts,tsx}",
      "**/*.test.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}",
      "**/*.stories.{ts,tsx}",
    ],
    rules: {
      // Governance: warn in UI package during migration
      "ds/require-disable-justification": "warn",
      // TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",

      // Design system – token and layout rules as warnings in UI package
      "ds/no-raw-color": "warn",
      "ds/no-raw-spacing": "warn",
      "ds/no-raw-typography": "warn",
      "ds/no-raw-radius": "warn",
      "ds/no-raw-shadow": "warn",
      "ds/no-raw-zindex": "warn",
      // Allow specific safe arbitrary values to reduce noise
      // - CSS variable functions for ring tokens
      // - calc() for transforms/layout math
      // - Percentages specifically for translate-x/translate-y utilities
      "ds/no-arbitrary-tailwind": [
        "warn",
        {
          allowedFunctions: ["var", "calc"],
          allowedContentPatterns: ["^-?\\d+(?:\\.\\d+)?%$"],
          allowedUtilities: ["translate-x", "translate-y"],
        },
      ],
      "ds/no-important": "warn",
      "ds/require-min-w-0-in-flex": "warn",
      "ds/forbid-fixed-heights-on-text": "warn",
      "ds/require-breakpoint-modifiers": "warn",
      "ds/no-hardcoded-copy": "warn",
      "ds/no-physical-direction-classes-in-rtl": "warn",
      "ds/no-negative-margins": "warn",
      "ds/no-margins-on-atoms": "warn",
      "ds/enforce-layout-primitives": "warn",
      "ds/container-widths-only-at": "warn",
      "ds/enforce-focus-ring-token": "warn",
      "ds/min-tap-size": ["warn", { min: 40 }],
      "ds/no-misused-sr-only": "warn",

      // React ergonomics in legacy areas
      "react-hooks/rules-of-hooks": "warn",
      "react/no-unescaped-entities": "warn",

      // Disable published UI syntax restriction while migrating tokens
      "no-restricted-syntax": "off",
    },
  },

  /* ▸ Published UI components: enforce copy as errors */
  {
    files: [
      "packages/ui/src/components/atoms/**/*.{ts,tsx}",
      "packages/ui/src/components/molecules/**/*.{ts,tsx}",
      "packages/ui/src/components/organisms/**/*.{ts,tsx}",
    ],
    ignores: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "error",
    },
  },

  /* ▸ UI hardening: Published components — enforce robust a11y, interaction and layout */
  {
    files: [
      "packages/ui/src/components/atoms/**/*.{ts,tsx}",
      "packages/ui/src/components/molecules/**/*.{ts,tsx}",
      "packages/ui/src/components/organisms/**/*.{ts,tsx}",
    ],
    ignores: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      // Accessibility fundamentals
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/label-has-associated-control": [
        "error",
        { controlComponents: ["Select", "RadioGroup", "Checkbox"] },
      ],
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/no-noninteractive-element-interactions": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/no-autofocus": "error",
      "jsx-a11y/media-has-caption": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/no-aria-hidden-on-focusable": "error",

      // Interaction and state stability
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-no-constructed-context-values": "warn",
      "react/no-unstable-nested-components": "warn",
      "react/no-array-index-key": "error",
      "react/jsx-no-useless-fragment": "warn",
      "react/self-closing-comp": "warn",

      // Governance/perf
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // Discourage inline styles in published UI; prefer tokens/utilities
      "react/forbid-dom-props": ["error", { forbid: ["style"] }],

      // Tailwind hygiene (only if plugin is present at runtime)
      ...(tailwindcss
        ? {
            "tailwindcss/classnames-order": "warn",
            "tailwindcss/no-unnecessary-arbitrary-value": "error",
          }
        : {}),
    },
  },

  /* ▸ UI hardening: General UI package (warn-level to enable incremental cleanup) */
  {
    files: ["packages/ui/src/**/*.{ts,tsx}"],
    // Do not apply this general block to published components — they use stricter rules above
    ignores: [
      "packages/ui/src/components/atoms/**/*.{ts,tsx}",
      "packages/ui/src/components/molecules/**/*.{ts,tsx}",
      "packages/ui/src/components/organisms/**/*.{ts,tsx}",
    ],
    rules: {
      // Accessibility fundamentals
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/label-has-associated-control": [
        "warn",
        { controlComponents: ["Select", "RadioGroup", "Checkbox"] },
      ],
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/media-has-caption": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/no-aria-hidden-on-focusable": "warn",

      // Interaction and state stability
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react/jsx-no-target-blank": "warn",
      "react/jsx-no-constructed-context-values": "warn",
      "react/no-unstable-nested-components": "warn",
      "react/no-array-index-key": "warn",
      "react/jsx-no-useless-fragment": "warn",
      "react/self-closing-comp": "warn",

      // Governance/perf
      "no-console": ["warn", { allow: ["error", "warn"] }],
      // Prefer tokens/utilities; allow escapes with justification during migration
      "react/forbid-dom-props": ["warn", { forbid: ["style"] }],

      // Tailwind hygiene (only if plugin is present at runtime)
      ...(tailwindcss
        ? {
            "tailwindcss/classnames-order": "warn",
            "tailwindcss/no-unnecessary-arbitrary-value": "warn",
          }
        : {}),
    },
  },

  /* ▸ Temporary suppression: treat hardcoded copy in select packages as off while compliance work is underway */
  {
    files: [
      "packages/ui/**/*.{ts,tsx}",
      "packages/mcp-cloudflare/**/*.{ts,tsx}",
      "packages/mcp-server/**/*.{ts,tsx}",
      "packages/lib/**/*.{ts,tsx}",
    ],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ MSW fixtures: disable hardcoded-copy (test-only strings) */
  {
    files: ["test/msw/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ Test shims: disable hardcoded-copy noise in stub error strings */
  {
    files: ["test/shims/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ CMS-only override: track min tap target 44px as warning (HIG baseline) */
  {
    files: ["apps/cms/**"],
    rules: {
      "ds/min-tap-size": "off",
    },
  },

  /* ▸ Reception app: internal tooling, not localized yet */
  {
    files: ["apps/reception/**"],
    rules: {
      ...offAllDsRules,
      // Reception is a legacy internal tool; DS governance rules are enforced as part of the
      // design-system migration plan, not as a lint gate today.
      "max-lines-per-function": "off",
      "max-depth": "off",
      "max-params": "off",
      "complexity": "off",
    },
  },

  /* ▸ Tests final override: keep copy/any relaxed even within UI package */
  {
    files: [
      "**/__tests__/**/*.{ts,tsx,js,jsx}",
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
    ],
    // Lint tests without requiring inclusion in a TS project
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
      "ds/no-hardcoded-copy": "off",
      // Also ensure font stack rule is disabled in tests to prevent matches on identifiers
      "ds/no-raw-font": "off",
      // Allow raw colors in test fixtures (e.g., mock data with "#123" strings)
      "ds/no-raw-color": "off",
      // Governance: do not require ticket IDs on eslint-disable in tests
      // Tests often toggle rules for fixtures/mocks; enforcing ticket IDs adds noise
      "ds/require-disable-justification": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Tests frequently stub media with raw <img> and omit aspect helpers
      "@next/next/no-img-element": "off",
      // Tests may execute bundled Next artifacts that assign to `module`
      "@next/next/no-assign-module-variable": "off",
      "ds/no-naked-img": "off",
      "ds/require-aspect-ratio-on-media": "off",
      // Allow unused vars in tests (e.g., destructured helpers)
      "@typescript-eslint/no-unused-vars": "off",
      // Layout ergonomics: not relevant in unit tests
      "ds/min-tap-size": "off",
      "ds/no-margins-on-atoms": "off",
      "ds/enforce-layout-primitives": "off",
    },
  },
  /* ▸ Storybook recommended rules for stories */
  {
    files: ["**/*.stories.{ts,tsx,js,jsx,mdx}"],
    // Stories are dev-only and often live outside the TS project graph.
    // Lint them without requiring inclusion in a TS project.
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: null,
        projectService: false,
        allowDefaultProject: true,
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { storybook },
    rules: {
      ...(storybook.configs?.recommended?.rules || {}),
      ...offAllDsRules,
      "@typescript-eslint/no-explicit-any": "off",
    },
  },

  /* ▸ Brikette scripts: CLI diagnostics are non-UI */
  {
    files: ["apps/brikette/scripts/**/*.{ts,tsx,js,jsx}"],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ SEO/Structured data components: Schema.org literals are non-UI (SEO-315) */
  {
    files: [
      "**/components/seo/**/*.{ts,tsx,js,jsx}",
      "**/*StructuredData*.{ts,tsx,js,jsx}",
      "**/utils/seo*.{ts,tsx,js,jsx}",
      "**/utils/schema/**/*.{ts,tsx,js,jsx}",
    ],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ Locale stub fixtures: test/dev fallbacks, not user-facing */
  {
    files: ["**/locales/**/*.stub/**/*.{ts,tsx,js,jsx}"],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ Root scripts: CLI/build tooling diagnostics are non-UI */
  {
    files: ["scripts/**/*.{ts,tsx,js,jsx}"],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ Requested exceptions: disable no-hardcoded-copy in specific apps/packages */
  {
    files: [
      // Apps
      "apps/cms/**/*.{ts,tsx,js,jsx,mdx}",
      "apps/dashboard/**/*.{ts,tsx,js,jsx,mdx}",
      "apps/cover-me-pretty/**/*.{ts,tsx,js,jsx,mdx}",
      "apps/cochlearfit/**/*.{ts,tsx,js,jsx,mdx}",
      // Packages
      "packages/auth/**/*.{ts,tsx,js,jsx}",
      "packages/email/**/*.{ts,tsx,js,jsx}",
      "packages/email-templates/**/*.{ts,tsx,js,jsx}",
      "packages/platform-machine/**/*.{ts,tsx,js,jsx}",
      "packages/platform-core/**/*.{ts,tsx,js,jsx}",
      "packages/stripe/**/*.{ts,tsx,js,jsx}",
      // Sanity plugin (and core sanity package, for completeness)
      "packages/plugins/sanity/**/*.{ts,tsx,js,jsx}",
      "packages/sanity/**/*.{ts,tsx,js,jsx}",
      "packages/types/**/*.{ts,tsx,js,jsx}",
      "packages/config/**/*.{ts,tsx,js,jsx}",
      "packages/zod-utils/**/*.{ts,tsx,js,jsx}",
      "packages/themes/**/*.{ts,tsx,js,jsx}",
      "packages/tailwind-config/**/*.{ts,tsx,js,jsx}",
      "packages/shared-utils/**/*.{ts,tsx,js,jsx}",
      "packages/i18n/**/*.{ts,tsx,js,jsx}",
      "packages/date-utils/**/*.{ts,tsx,js,jsx}",
      "packages/configurator/**/*.{ts,tsx,js,jsx}",
    ],
    plugins: { ds: dsPlugin },
    rules: {
      "ds/no-hardcoded-copy": "off",
      // Translation catalogs regularly include raw strings and disable directives.
      // Allow eslint-disable comments without ticket references so files can be generated safely.
      "ds/require-disable-justification": "off",
    },
  },

  /* ▸ UI operations components: internal admin tools, exempt from strict DS/a11y rules */
  {
    files: ["packages/ui/src/components/organisms/operations/**/*.{ts,tsx}"],
    ignores: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      // Operations are internal admin tools (CMS, dashboards); not customer-facing, no i18n needed
      // Full exemption from DS rules - these are admin-only components with different UX requirements
      "ds/no-hardcoded-copy": "off",
      "ds/min-tap-size": "off",
      "ds/enforce-layout-primitives": "off",
      "ds/container-widths-only-at": "off",
      "ds/no-physical-direction-classes-in-rtl": "off",
      "ds/enforce-focus-ring-token": "off",
      "ds/no-arbitrary-tailwind": "off",
      "ds/no-nonlayered-zindex": "off",
      "ds/absolute-parent-guard": "off",
      "ds/no-unsafe-viewport-units": "off",
      // Relaxed a11y for internal tools - admin users have different requirements
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/no-autofocus": "off",
      // Relaxed React rules for internal tools
      "react/no-array-index-key": "off",
      "react/forbid-dom-props": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  /* ▸ UI design system internals: ErrorBoundary, ThemeToggle, StatusIndicator use hardcoded defaults */
  {
    files: [
      "packages/ui/src/components/ErrorBoundary.tsx",
      "packages/ui/src/components/atoms/ThemeToggle.tsx",
      "packages/ui/src/components/atoms/StatusIndicator/**/*.{ts,tsx}",
    ],
    ignores: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      // DS internal components with hardcoded fallback strings; not customer-facing
      "ds/no-hardcoded-copy": "off",
      // ErrorBoundary is a fallback UI - exempt from strict DS rules
      "ds/no-unsafe-viewport-units": "off",
      "ds/container-widths-only-at": "off",
      "ds/min-tap-size": "off",
    },
  },

  /* ▸ UI hooks and utils: internal tooling */
  {
    files: [
      "packages/ui/src/hooks/**/*.{ts,tsx}",
      "packages/ui/src/utils/**/*.{ts,tsx}",
      "packages/ui/src/context/**/*.{ts,tsx}",
      "packages/ui/src/providers/**/*.{ts,tsx}",
    ],
    ignores: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      // Hooks, utils, context, providers are internal tooling; not customer-facing copy
      "ds/no-hardcoded-copy": "off",
      "ds/enforce-focus-ring-token": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },

  /* ▸ UI molecules and legacy organisms: downgrade strict rules during migration */
  {
    files: [
      "packages/ui/src/molecules/**/*.{ts,tsx}",
      "packages/ui/src/organisms/**/*.{ts,tsx}",
      "packages/ui/src/atoms/**/*.{ts,tsx}",
    ],
    ignores: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "warn",
      "ds/min-tap-size": "warn",
      "ds/enforce-layout-primitives": "warn",
      "ds/container-widths-only-at": "warn",
      "ds/no-physical-direction-classes-in-rtl": "warn",
    },
  },

  /* ▸ UI storefront components: downgrade during migration */
  {
    files: [
      "packages/ui/src/components/organisms/StorefrontFooter.tsx",
      "packages/ui/src/components/organisms/StorefrontProductCard.tsx",
      "packages/ui/src/components/organisms/FilterDrawer.tsx",
    ],
    ignores: ["**/*.stories.{ts,tsx}", "**/*.test.{ts,tsx}", "**/__tests__/**/*.{ts,tsx}"],
    rules: {
      // Storefront components receive copy via props from the app layer (which handles i18n)
      "ds/no-hardcoded-copy": "off",
      "ds/no-physical-direction-classes-in-rtl": "warn",
      "ds/enforce-focus-ring-token": "warn",
      "ds/no-arbitrary-tailwind": "warn",
      "ds/container-widths-only-at": "warn",
      "react/forbid-dom-props": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
    },
  },

  /* ▸ UI type compatibility shims: declaration files with non-UI strings */
  {
    files: ["packages/ui/types-compat/**/*.d.ts"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ LINT-02: Prevent .only in tests (eslint-plugin-no-only-tests) */
  {
    files: [
      // TypeScript test files
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      // JavaScript test files
      "**/*.test.js",
      "**/*.test.jsx",
      "**/*.spec.js",
      "**/*.spec.jsx",
      // ESM test files
      "**/*.test.mjs",
      "**/*.spec.mjs",
      // Cypress files
      "**/*.cy.ts",
      "**/*.cy.tsx",
      // Directory-based test files
      "**/__tests__/**/*.{ts,tsx,js,jsx,mjs}",
      "**/e2e/**/*.{ts,tsx,js,jsx}",
      "**/playwright/**/*.{ts,tsx,js,jsx}",
    ],
    plugins: { "no-only-tests": noOnlyTests },
    rules: {
      "no-only-tests/no-only-tests": "error",
    },
  },

  /* ▸ LINT-08: Console and debugger enforcement */
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error", "info", "debug"] }],
      "no-debugger": "error",
    },
  },
  /* ▸ LINT-08: Exception for CLI scripts */
  {
    files: ["scripts/**/*.{ts,js,mjs}", "tools/**/*.{ts,js,mjs}"],
    rules: {
      "no-console": "off",
      complexity: "off",
      "max-lines-per-function": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-require": "off",
      "security/detect-unsafe-regex": "off",
      "ds/no-hardcoded-copy": "off",
    },
  },

  /* ▸ LINT-04: Import sorting (eslint-plugin-simple-import-sort) */
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            // Side effects (e.g., CSS imports, polyfills)
            ["^\\u0000"],
            // Node.js builtins
            ["^node:"],
            // React/Next first, then other external packages (NOT starting with @acme)
            ["^react", "^next", "^(?!@acme)@?\\w"],
            // Internal packages (@acme/*)
            ["^@acme/"],
            // Internal aliases (@/)
            ["^@/"],
            // Parent imports (..)
            ["^\\.\\."],
            // Sibling imports (./)
            ["^\\."],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
    },
  },

  /* ▸ LINT-05: Promise rules (eslint-plugin-promise) */
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: { promise: promisePlugin },
    rules: {
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/no-return-in-finally": "error",
      "promise/valid-params": "error",
      // Disabled initially due to high violation count
      "promise/always-return": "off",
      "promise/catch-or-return": "off",
      "promise/no-nesting": "off",
      "promise/no-promise-in-callback": "off",
      "promise/no-callback-in-promise": "off",
    },
  },

  /* ▸ LINT-03: TypeScript strict rules (consistent type imports) */
  /* consistent-type-imports is NOT type-aware, safe for all TS files */
  /* Excludes .d.ts files which legitimately use import() type annotations */
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
  /* ▸ LINT-03: consistent-type-exports IS type-aware, must exclude project:null files */
  {
    files: ["**/*.{ts,tsx}"],
    ignores: [
      // All patterns that have project: null in the config
      "**/__tests__/**/*",
      "**/*.test.*",
      "**/*.spec.*",
      "**/*.cy.*",
      "**/*.stories.*",
      "packages/design-tokens/**/*",
      "packages/config/env-schema.ts",
      "packages/configurator/**/*",
      "packages/i18n/**/*",
      "packages/tailwind-config/**/*",
      "packages/ui/**/story-utils/**/*",
      "packages/eslint-plugin-ds/tests/**/*",
      "packages/platform-core/defaultFilterMappings.ts",
      "packages/platform-core/prisma/**/*",
      "**/*.d.ts",
      "scripts/**/*",
      "apps/*/scripts/**/*",
      "apps/cms/cypress.config.mjs",
      "apps/cms/cypress/**/*",
      "apps/cms/middleware.ts",
      "packages/themes/dummy/tailwind-tokens/src/**/*",
      "apps/storybook/.storybook*/**/*",
      "plopfile.ts",
    ],
    rules: {
      "@typescript-eslint/consistent-type-exports": [
        "error",
        {
          fixMixedExportsWithInlineTypeSpecifier: true,
        },
      ],
    },
  },
  /* ▸ LINT-03b: Disable type-aware rules for project:null files (override for flat config merge order) */
  {
    files: [
      "apps/cms/cypress/**/*.{ts,tsx}",
      "apps/cms/cypress.config.mjs",
      "apps/cms/middleware.ts",
    ],
    rules: {
      "@typescript-eslint/consistent-type-exports": "off",
    },
  },

  /* ▸ LINT-01: Complexity limits */
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      complexity: ["error", 20],
      "max-depth": ["error", 5],
      "max-nested-callbacks": ["error", 4],
      "max-params": ["error", 6],
      "max-lines-per-function": [
        "error",
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ LINT-01: Relaxed limits for cover-me-pretty (tenant prototype runtime) */
  {
    files: ["apps/cover-me-pretty/src/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 45],
      "max-lines-per-function": [
        "error",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ Cochlearfit policy copy: length rules are not helpful */
  {
    files: ["apps/cochlearfit/src/components/policies/**/*.{ts,tsx}"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  /* ▸ LINT-01: Relaxed limits for test files (describe/it nesting is normal) */
  {
    files: [
      "**/*.test.{ts,tsx,js,jsx,mjs}",
      "**/*.spec.{ts,tsx,js,jsx,mjs}",
      "**/__tests__/**/*.{ts,tsx,js,jsx,mjs}",
    ],
    rules: {
      complexity: ["error", 40],
      "max-nested-callbacks": ["error", 6],
      "max-lines-per-function": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ LINT-01: Relaxed limits for MCP adapter (tool handlers are inherently complex) */
  {
    files: ["packages/mcp-cloudflare/**/*.ts"],
    rules: {
      complexity: ["error", 40],
      "max-lines-per-function": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ LINT-01: Relaxed limits for MCP server (tool handlers are inherently complex) */
  {
    files: ["packages/mcp-server/**/*.ts"],
    rules: {
      complexity: ["error", 55],
      "max-lines-per-function": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ MCP server scripts: allow extra complexity/depth */
  {
    files: ["packages/mcp-server/scripts/**/*.ts"],
    rules: {
      complexity: ["error", 80],
      "max-depth": ["error", 10],
    },
  },
  /* ▸ LINT-01: Relaxed limits for ESLint plugin (AST visitors are inherently complex) */
  {
    files: ["packages/eslint-plugin-ds/**/*.{ts,js,mjs}"],
    rules: {
      complexity: ["error", 45],
    },
  },
  /* ▸ LINT-01: Relaxed limits for dashboard pages (admin UI components are inherently complex) */
  {
    files: ["apps/dashboard/src/pages/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 30],
      "max-lines-per-function": [
        "error",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ LINT-01: Relaxed limits for platform-core (domain logic is inherently complex) */
  {
    files: ["packages/platform-core/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 75],
      "max-depth": ["error", 7],
      "max-lines-per-function": [
        "error",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ LINT-01: Relaxed limits for lib (utility algorithms can be complex) */
  {
    files: ["packages/lib/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 45],
    },
  },
  /* ▸ LINT-01: Relaxed limits for platform-machine (state machine logic is complex) */
  {
    files: ["packages/platform-machine/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 25],
    },
  },
  /* ▸ LINT-01: Relaxed limits for UI package (large component library with complex page builder) */
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 70],
      "max-lines-per-function": [
        "error",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["error", 12],
      // Disable promise param naming in UI tests - many use short names in promise-based test patterns
      "promise/param-names": "off",
    },
  },
  /* ▸ LINT-01: Relaxed limits for template-app (complex boilerplate with API route handlers) */
  {
    files: ["packages/template-app/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 65],
    },
  },
  /* ▸ LINT-01: Relaxed limits for email package (complex email rendering/sending logic) */
  {
    files: ["packages/email/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 25],
    },
  },
  /* ▸ LINT-01: Product-pipeline is large; ease max-lines/complexity enforcement until refactor */
  {
    files: ["apps/product-pipeline/**/*.{ts,tsx,js,jsx}"],
    rules: {
      complexity: ["error", 70],
      "max-lines-per-function": [
        "error",
        { max: 700, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ Workaround: Disable import resolver rules for dashboard (tsconfig extends path issue) */
  {
    files: ["apps/dashboard/**/*.{ts,tsx}"],
    rules: {
      "import/no-duplicates": "off",
    },
  },
  /* ▸ Workaround: Disable import resolver rules for skylar (tsconfig extends path issue) */
  {
    files: ["apps/skylar/**/*.{ts,tsx}"],
    rules: {
      "import/no-duplicates": "off",
      "import/no-unresolved": "off",
    },
  },
  /* ▸ LINT-01: Relaxed limits for skylar pages (complex page components) */
  {
    files: ["apps/skylar/src/app/**/*.{ts,tsx}"],
    rules: {
      "max-lines-per-function": [
        "error",
        { max: 300, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  /* ▸ LINT-01: Relaxed limits for CMS app (admin UI with complex forms and configurators) */
  {
    files: ["apps/cms/src/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 60],
      "max-lines-per-function": [
        "error",
        { max: 550, skipBlankLines: true, skipComments: true },
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
  /* ▸ LINT-08: Scripts are non-UI tooling (disable DS/security noise and complexity limits) */
  {
    ignores: ["scripts/src/**/*.d.ts"],
  },
  {
    files: ["scripts/**/*.{ts,js,mjs}", "tools/**/*.{ts,js,mjs}"],
    languageOptions: {
      parserOptions: {
        project: null,
        projectService: false,
      },
    },
    rules: {
      ...offAllDsRules,
      complexity: "off",
      "max-lines-per-function": "off",
      "max-depth": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-exports": "off",
      "prefer-const": "off",
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-require": "off",
      "security/detect-unsafe-regex": "off",
      "no-console": "off",
    },
  },
  /* ▸ LINT-01: Transitional limits for cms-ui page-builder (ported legacy implementation) */
  {
    files: ["packages/cms-ui/src/page-builder/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 80],
      "max-lines-per-function": [
        "error",
        { max: 600, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["error", 10],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  /* ▸ LINT-01: Transitional complexity limits for cms-ui (blocks, nav, media) */
  {
    files: [
      "packages/cms-ui/src/blocks/**/*.{ts,tsx}",
      "packages/cms-ui/src/media/**/*.{ts,tsx}",
      "packages/cms-ui/src/nav/**/*.{ts,tsx}",
    ],
    rules: {
      complexity: ["error", 35],
    },
  },
  /* ▸ LINT-01: Relaxed limits for Reception app (legacy internal tooling) */
  {
    files: ["apps/reception/src/**/*.{ts,tsx}"],
    rules: {
      ...offAllDsRules,
      complexity: ["error", 60],
      "max-lines-per-function": [
        "error",
        { max: 800, skipBlankLines: true, skipComments: true },
      ],
      "max-nested-callbacks": ["error", 8],
      "max-depth": ["error", 8],
      "max-params": ["error", 8],
      "no-console": "off",
    },
  },
  {
    files: ["apps/handbag-configurator/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      complexity: "off",
      "max-lines-per-function": "off",
      "security/detect-non-literal-fs-filename": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    files: [
      "apps/handbag-configurator/src/app/**/*.{ts,tsx}",
      "apps/handbag-configurator/src/ui/**/*.{ts,tsx}",
    ],
    rules: {
      "ds/no-hardcoded-copy": [
        "error",
        {
          ignorePatterns: [
            "radial-gradient",
            "linear-gradient",
            "repeating-linear-gradient",
            "repeating-radial-gradient",
            "rgba\\(",
            "Validation request failed",
            "Request failed",
          ],
        },
      ],
      "ds/no-raw-color": "error",
      "ds/no-raw-font": "error",
      "ds/no-raw-typography": "error",
      "ds/no-arbitrary-tailwind": "error",
    },
  },
  {
    files: ["apps/handbag-configurator/src/viewer/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": [
        "error",
        {
          ignorePatterns: [
            "radial-gradient",
            "linear-gradient",
            "repeating-linear-gradient",
            "repeating-radial-gradient",
            "rgba\\(",
            "^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$",
          ],
        },
      ],
    },
  },

  /* ▸ Prime guest portal: early development, DS rules disabled (matches .eslintrc.cjs intent).
   *   Must be after the catch-all complexity/max-lines block so "off" wins. */
  {
    files: ["apps/prime/**"],
    rules: {
      ...offAllDsRules,
      "max-lines-per-function": "off",
      "complexity": "off",
    },
  },
  /* ▸ Business OS guide authoring: internal tool — relax DS rules.
   *   Must be after catch-all blocks so "off" wins. */
  {
    files: [
      "apps/business-os/src/app/guides/**/*.{ts,tsx}",
      "apps/business-os/src/app/api/guides/**/*.{ts,tsx}",
      "apps/business-os/src/lib/guide-authoring/**/*.{ts,tsx}",
    ],
    rules: {
      ...offAllDsRules,
      "max-lines-per-function": "off",
      "complexity": "off",
    },
  },
];

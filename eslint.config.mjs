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
      "**/*.d.ts.map",
      "**/*.json",
      "**/index.js",
      "packages/ui/src/**/*.js",
      "packages/ui/src/**/*.d.ts",
      "packages/ui/src/**/*.d.ts.map",
      "apps/*/src/**/*.js",
      "apps/*/src/**/*.d.ts",
      "apps/*/src/**/*.js.map",
      "scripts/**/*.js",
      "packages/config/test/**",
      "**/__mocks__/**",
      "**/*.d.ts",
      "**/jest.setup*.{ts,tsx}",
      "**/jest.config.*",
      "**/postcss.config.*",
      "packages/config/jest.preset.cjs",
      "apps/api/jest.config.cjs",
      "apps/api/postcss.config.cjs",
    ],
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
    ignores: ["packages/ui/src/components/cms/**/*"],
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
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
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
      // Governance: require ticketed eslint-disable justifications (baseline warn; overridden later per scope)
      "ds/require-disable-justification": "warn",
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
      "ds/min-tap-size": ["error", { min: 40 }],
      "ds/no-misused-sr-only": "error",
      
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

  /* ▸ Cypress specs: relax strict TS comments and 'any' for test ergonomics */
  {
    files: ["**/*.cy.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
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
      // Stories are dev-only; allow copy and relax DS layout constraints
      "ds/no-hardcoded-copy": "off",
      "ds/enforce-layout-primitives": "off",
      "ds/no-margins-on-atoms": "off",
      "ds/min-tap-size": "off",
      "ds/container-widths-only-at": "off",
      "ds/no-physical-direction-classes-in-rtl": "off",
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
      // Governance: do not require ticket IDs on eslint-disable in tests
      // Tests often toggle rules for fixtures/mocks; enforcing ticket IDs adds noise
      "ds/require-disable-justification": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      // Tests frequently stub media with raw <img> and omit aspect helpers
      "@next/next/no-img-element": "off",
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
  /* ▸ Final stories override: ensure copy checks are disabled for stories */
  {
    files: ["**/*.stories.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },

  
];

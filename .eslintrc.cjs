// .eslintrc.cjs  ── root of the monorepo
module.exports = {
  /* …your existing config… */
  plugins: ["@typescript-eslint", "security"],
  ignorePatterns: [
    "**/dist/**", // compiled packages
    "packages/auth/dist/",
    "**/.next/**", // Next.js build output
    "**/storybook-static/**", // generated Storybook bundles
    "**/index.js",
    "**/*.d.ts.map",
    "**/jest.config.*",
  ],
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
            message: "Import inventory repositories via inventory.server.ts façade instead.",
          },
        ],
      },
    ],
  },
  overrides: [
    // Disable noisy security filename rule in tests (temp paths are expected)
    {
      files: [
        "**/__tests__/**/*.{ts,tsx,js,jsx}",
        "**/*.test.{ts,tsx,js,jsx}",
        "**/*.spec.{ts,tsx,js,jsx}",
      ],
      rules: {
        "security/detect-non-literal-fs-filename": "off",
        "security/detect-non-literal-require": "off",
      },
    },
    // Allow common test ergonomics and silence DS copy checks in tests/specs
    {
      files: [
        "**/__tests__/**/*.{ts,tsx,js,jsx}",
        "**/*.test.{ts,tsx,js,jsx}",
        "**/*.spec.{ts,tsx,js,jsx}",
      ],
      rules: {
        // Tests/specs can include literal copy and flexible typing/imports
        "ds/no-hardcoded-copy": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-require-imports": "off",
      },
    },
    // Storybook stories are dev-only; relax strict DS rules and i18n copy
    {
      files: ["packages/ui/**/*.stories.{ts,tsx}", "**/*.stories.{ts,tsx}"],
      rules: {
        "ds/no-hardcoded-copy": "off",
        "ds/enforce-layout-primitives": "off",
        "ds/no-margins-on-atoms": "off",
        "ds/min-tap-size": "off",
        "ds/container-widths-only-at": "off",
        "ds/no-physical-direction-classes-in-rtl": "off",
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
    {
      files: [
        "packages/page-builder/**/*.{ts,tsx}",
        "packages/seo/**/*.{ts,tsx}",
        "**/page-builder/**/*.{ts,tsx}",
        "**/seo/**/*.{ts,tsx}",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
    {
      files: ["**/*.js"],
      rules: {
        // Don't apply TypeScript-specific lint rules to plain JavaScript files
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-var-requires": "off",
      },
    },
    // Prevent raw white/black Tailwind color tokens in shipped UI components; use design tokens instead.
    {
      files: ["packages/ui/src/**/*.{ts,tsx}"],
      excludedFiles: ["**/*.stories.{ts,tsx}", "**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: 'Literal[value=/(#(?:fff|ffffff|000|000000))|\\b(bg|text|border|ring|from|via|to)-(white|black)\\b/]',
            message: "Use design tokens (surface/fg/overlay) instead of raw white/black colors.",
          },
        ],
      },
    },
    {
      files: ["packages/config/src/env/*.js"],
      rules: {
        "import/extensions": "off",
        "no-restricted-exports": "off",
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "off",
      },
    },
  ],
};

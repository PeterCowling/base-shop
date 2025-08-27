// .eslintrc.cjs  ── root of the monorepo
module.exports = {
  /* …your existing config… */
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    "**/dist/**", // compiled packages
    "packages/auth/dist/",
    "**/.next/**", // Next.js build output
    "**/index.js",
    "**/*.d.ts",
  ],
  overrides: [
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

// .eslintrc.cjs  ── root of the monorepo
module.exports = {
  /* …your existing config… */
  plugins: ["@typescript-eslint"],
  ignorePatterns: [
    "**/dist/**", // compiled packages
    "**/.next/**", // Next.js build output
    "**/index.js",
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
  ],
};

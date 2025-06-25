// .eslintrc.cjs  ── root of the monorepo
module.exports = {
  /* …your existing config… */
  ignorePatterns: [
    "**/dist/**", // compiled packages
    "**/.next/**", // Next.js build output
    "**/index.js",
  ],
};

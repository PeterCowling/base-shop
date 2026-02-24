import baseConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["src/**/*.js", "src/**/*.d.ts", "**/*.d.ts"],
  },
  ...baseConfig,
  {
    files: ["src/format/money.ts"],
    rules: {
      "security/detect-unsafe-regex": "off",
    },
  },
  /* ▸ lib utilities operate on internal/controlled filesystem paths — fs filename rule is noisy */
  {
    files: ["src/**/*.{ts,tsx,js}"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
      complexity: ["error", 45],
    },
  },
];

export default config;

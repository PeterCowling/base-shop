import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["jest.config.cjs", "postcss.config.cjs"],
  },
  ...rootConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 45],
      "max-lines-per-function": [
        "error",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  // Local overrides for cover-me-pretty try-on/AI prototype:
  // relax strict TS rules within this app only.
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default config;

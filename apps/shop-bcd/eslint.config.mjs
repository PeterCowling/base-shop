import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["jest.config.cjs", "postcss.config.cjs"],
  },
  ...rootConfig,
  // Local overrides for shop-bcd try-on/AI prototype:
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

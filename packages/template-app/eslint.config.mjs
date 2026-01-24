import baseConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["src/**/*.js", "src/**/*.d.ts", "**/*.d.ts"],
  },
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      complexity: ["error", 65],
    },
  },
  {
    files: ["scripts/**/*.{js,mjs,cjs,ts,tsx}"],
    rules: {
      "security/detect-non-literal-regexp": "off",
    },
  },
];

export default config;

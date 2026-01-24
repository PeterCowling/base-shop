import baseConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["src/**/*.js", "src/**/*.d.ts", "**/*.d.ts"],
  },
  ...baseConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },
];

export default config;

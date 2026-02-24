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
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/**/*.stories.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "src/**/__tests__/**/*.{ts,tsx}",
    ],
    rules: {
      "ds/no-raw-radius": "error",
      "ds/no-hardcoded-rounded-class": "error",
      "ds/no-overflow-hazards": "error",
      "ds/require-min-w-0-in-flex": "error",
      "ds/require-content-bleed-guards": "error",
    },
  },
];

export default config;

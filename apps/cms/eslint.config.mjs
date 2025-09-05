import baseConfig from "../../eslint.config.mjs";

const config = [
  ...baseConfig,
  {
    files: [
      "src/**/__tests__/**",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
    ],
    rules: {
      "ds/no-raw-color": "off",
    },
  },
];

export default config;

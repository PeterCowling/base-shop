import baseConfig from "../../eslint.config.mjs";

export default [
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

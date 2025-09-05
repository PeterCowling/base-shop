import baseConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["postcss.config.cjs", "jest.config.cjs"],
  },
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

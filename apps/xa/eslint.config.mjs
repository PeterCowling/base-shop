import rootConfig from "../../eslint.config.mjs";

const config = [
  {
    ignores: ["postcss.config.cjs", "next.config.mjs", "public/sw.js"],
  },
  ...rootConfig,
  {
    files: ["instrumentation.ts", "src/lib/demoProducts.ts"],
    rules: {
      "ds/no-hardcoded-copy": "off",
    },
  },
  {
    files: ["src/app/__tests__/**/*.test.tsx"],
    rules: {
      "security/detect-non-literal-fs-filename": "off",
      "security/detect-non-literal-require": "off",
    },
  },
];

export default config;

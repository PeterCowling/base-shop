/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 config globs are not user-facing copy */
import baseConfig from "../../tailwind.config.mjs";

const baseTheme = baseConfig.theme ?? {};
const baseExtend = baseTheme.extend ?? {};

/** @type {import('tailwindcss').Config} */
const config = {
  ...baseConfig,
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "../../packages/{ui,platform-core,platform-machine,i18n,themes}/**/*.{ts,tsx,mdx}",
    "!**/__tests__/**",
    "!**/*.test.{ts,tsx}",
    "!**/*.spec.{ts,tsx}",
    "!**/node_modules/**",
  ],
  theme: {
    ...baseTheme,
    extend: {
      ...baseExtend,
    },
  },
  plugins: [...(baseConfig.plugins ?? [])],
};

export default config;

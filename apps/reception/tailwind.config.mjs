// apps/reception/tailwind.config.mjs
import baseConfig from "@acme/tailwind-config/tailwind.config.mjs";

/** @type {import('tailwindcss').Config} */
const config = {
  ...baseConfig,
  theme: {
    extend: {
      colors: {
        // Dark mode colors used throughout the Reception app
        darkBg: '#000000',
        darkSurface: '#333333',
        darkAccentGreen: '#a8dba8',
        darkAccentOrange: '#ffd89e',
      },
    },
  },
};

export default config;

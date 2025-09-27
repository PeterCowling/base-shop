import baseConfig from "../../eslint.config.mjs";

const config = [
  ...baseConfig,
  // Enforce M6 rules explicitly for CMS app sources (defensive wiring)
  {
    files: ["src/**/*.{ts,tsx,mdx}"],
    rules: {
      "ds/require-aspect-ratio-on-media": "error",
      "ds/no-naked-img": "error",
      "ds/no-overflow-hazards": "error",
      "ds/absolute-parent-guard": "error",
      "ds/no-nonlayered-zindex": "error",
      "ds/no-unsafe-viewport-units": "error",
    },
  },
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

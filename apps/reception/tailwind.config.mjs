import baseConfig from "../../tailwind.config.mjs";

const receptionColorBridge = {
  darkBg: "hsl(var(--reception-dark-bg))",
  darkSurface: "hsl(var(--reception-dark-surface))",
  darkAccentGreen: "hsl(var(--reception-dark-accent-green))",
  darkAccentOrange: "hsl(var(--reception-dark-accent-orange))",
  darkBorder: "hsl(var(--reception-dark-border))",
  "surface-dark": "hsl(var(--reception-surface-dark))",
  "accent-hospitality": "hsl(var(--reception-accent-hospitality))",
};

const baseTheme = baseConfig.theme ?? {};
const baseExtend = baseTheme.extend ?? {};
const baseExtendColors = baseExtend.colors ?? {};

const theme = {
  ...baseTheme,
  extend: {
    ...baseExtend,
    colors: {
      ...baseExtendColors,
      ...receptionColorBridge,
    },
  },
};

const receptionTailwindConfig = {
  ...baseConfig,
  theme,
};

export default receptionTailwindConfig;

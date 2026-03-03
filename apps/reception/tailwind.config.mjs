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
const baseExtendSpacing = baseExtend.spacing ?? {};
const baseExtendFontSize = baseExtend.fontSize ?? {};
const baseExtendWidth = baseExtend.width ?? {};
const baseExtendMinWidth = baseExtend.minWidth ?? {};
const baseExtendHeight = baseExtend.height ?? {};
const baseExtendMinHeight = baseExtend.minHeight ?? {};
const baseExtendMaxHeight = baseExtend.maxHeight ?? {};
const baseExtendScale = baseExtend.scale ?? {};
const baseExtendTransitionDuration = baseExtend.transitionDuration ?? {};
const baseExtendGridTemplateColumns = baseExtend.gridTemplateColumns ?? {};
const baseExtendZIndex = baseExtend.zIndex ?? {};

const receptionSpacing = {
  "50px": "50px",
  "75px": "75px",
  "100px": "100px",
};

const receptionWidths = {
  "100px": "100px",
  "120px": "120px",
  "125px": "125px",
  "150px": "150px",
  "175px": "175px",
  "200px": "200px",
  "300px": "300px",
};

const receptionMinWidths = {
  "220px": "220px",
  "225px": "225px",
  "40rem": "40rem",
};

const receptionHeights = {
  "60vh": "60vh",
  "80px": "80px",
};

const receptionMinHeights = {
  "30vh": "30vh",
  "55px": "55px",
  "80vh": "80vh",
};

const receptionMaxHeights = {
  "38rem": "38rem",
  "60vh": "60vh",
};

const receptionFontSizes = {
  "0_65rem": "0.65rem",
  "ops-micro": ["0.625rem", { lineHeight: "0.875rem" }],
  "10px": "10px",
  "11px": "11px",
  "13px": "13px",
};

const receptionScale = {
  97: "0.97",
  102: "1.02",
};

const receptionTransitionDuration = {
  800: "800ms",
};

const receptionGridTemplateColumns = {
  "auto-fill-7": "repeat(auto-fill,minmax(7rem,1fr))",
};

const receptionZIndex = {
  1: "1",
};

const theme = {
  ...baseTheme,
  extend: {
    ...baseExtend,
    colors: {
      ...baseExtendColors,
      ...receptionColorBridge,
    },
    spacing: {
      ...baseExtendSpacing,
      ...receptionSpacing,
    },
    width: {
      ...baseExtendWidth,
      ...receptionWidths,
    },
    minWidth: {
      ...baseExtendMinWidth,
      ...receptionMinWidths,
    },
    height: {
      ...baseExtendHeight,
      ...receptionHeights,
    },
    minHeight: {
      ...baseExtendMinHeight,
      ...receptionMinHeights,
    },
    maxHeight: {
      ...baseExtendMaxHeight,
      ...receptionMaxHeights,
    },
    fontSize: {
      ...baseExtendFontSize,
      ...receptionFontSizes,
    },
    scale: {
      ...baseExtendScale,
      ...receptionScale,
    },
    transitionDuration: {
      ...baseExtendTransitionDuration,
      ...receptionTransitionDuration,
    },
    gridTemplateColumns: {
      ...baseExtendGridTemplateColumns,
      ...receptionGridTemplateColumns,
    },
    zIndex: {
      ...baseExtendZIndex,
      ...receptionZIndex,
    },
  },
};

const receptionTailwindConfig = {
  ...baseConfig,
  theme,
};

export default receptionTailwindConfig;

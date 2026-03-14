import baseConfig from "../../tailwind.config.mjs";

const receptionColorBridge = {
  darkBg: "var(--reception-dark-bg)",
  darkSurface: "var(--reception-dark-surface)",
  darkAccentGreen: "var(--reception-dark-accent-green)",
  darkAccentOrange: "var(--reception-dark-accent-orange)",
  darkBorder: "var(--reception-dark-border)",
  "surface-dark": "var(--reception-surface-dark)",
  "accent-hospitality": "var(--reception-accent-hospitality)",
};

const receptionSemanticColors = {
  surface: "hsl(var(--surface-1, var(--color-bg)))",
  "surface-1": "hsl(var(--surface-1, var(--color-bg)))",
  "surface-2": "hsl(var(--surface-2, var(--color-bg)))",
  "surface-3": "hsl(var(--surface-3, var(--color-bg)))",
  panel: "hsl(var(--color-panel, var(--surface-2, var(--color-bg))))",
  inset: "hsl(var(--color-inset, var(--surface-2, var(--color-bg))))",
  input: "hsl(var(--surface-input, var(--surface-2, var(--color-bg))))",
  "muted-foreground": "hsl(var(--color-fg-muted, var(--color-fg)))",
  "border-strong": "hsl(var(--color-border-strong))",
  "border-muted": "hsl(var(--color-border-muted))",
  "table-row-hover": "hsl(var(--color-table-row-hover, var(--surface-2, var(--color-bg))))",
  "table-row-alt": "hsl(var(--color-table-row-alt, var(--surface-1, var(--color-bg))))",
  "surface-elevated": "hsl(var(--color-surface-elevated, var(--surface-2, var(--color-bg))))",
  "primary-main": "hsl(var(--color-primary))",
  "primary-dark": "hsl(var(--color-primary-dark, var(--color-primary)))",
  "primary-light": "hsl(var(--color-primary-soft, var(--color-primary)))",
  "primary-fg": "hsl(var(--color-primary-fg))",
  "primary-hover": "hsl(var(--color-primary-hover, var(--color-primary)))",
  "primary-active": "hsl(var(--color-primary-active, var(--color-primary)))",
  "info-main": "hsl(var(--color-info))",
  "info-dark": "hsl(var(--color-info-dark, var(--color-info)))",
  "info-light": "hsl(var(--color-info-soft, var(--color-info)))",
  "success-main": "hsl(var(--color-success))",
  "success-dark": "hsl(var(--color-success-dark, var(--color-success)))",
  "success-light": "hsl(var(--color-success-soft, var(--color-success)))",
  "warning-main": "hsl(var(--color-warning))",
  "warning-dark": "hsl(var(--color-warning-dark, var(--color-warning)))",
  "warning-light": "hsl(var(--color-warning-soft, var(--color-warning)))",
  "error-main": "hsl(var(--color-danger))",
  "error-dark": "hsl(var(--color-danger-dark, var(--color-danger)))",
  "error-light": "hsl(var(--color-danger-soft, var(--color-danger) / 0.12))",
  "danger-fg": "hsl(var(--color-danger-fg))",
  "success-fg": "hsl(var(--color-success-fg))",
  "warning-fg": "hsl(var(--color-warning-fg))",
  "info-fg": "hsl(var(--color-info-fg))",
};

// Shade vars now contain full hsl() values in the generated CSS file.
// Use var(...) directly — no hsl() wrapper needed (Tailwind v4 cascade fix).
const receptionShadeColors = {
  "pinkShades-row1": "var(--color-pinkShades-row1)",
  "pinkShades-row2": "var(--color-pinkShades-row2)",
  "pinkShades-row3": "var(--color-pinkShades-row3)",
  "pinkShades-row4": "var(--color-pinkShades-row4)",
  "coffeeShades-row1": "var(--color-coffeeShades-row1)",
  "coffeeShades-row2": "var(--color-coffeeShades-row2)",
  "coffeeShades-row3": "var(--color-coffeeShades-row3)",
  "beerShades-row1": "var(--color-beerShades-row1)",
  "beerShades-row2": "var(--color-beerShades-row2)",
  "wineShades-row1": "var(--color-wineShades-row1)",
  "wineShades-row2": "var(--color-wineShades-row2)",
  "wineShades-row3": "var(--color-wineShades-row3)",
  "teaShades-row1": "var(--color-teaShades-row1)",
  "teaShades-row2": "var(--color-teaShades-row2)",
  "greenShades-row1": "var(--color-greenShades-row1)",
  "greenShades-row2": "var(--color-greenShades-row2)",
  "greenShades-row3": "var(--color-greenShades-row3)",
  "warmGreenShades-row1": "var(--color-warmGreenShades-row1)",
  "warmGreenShades-row2": "var(--color-warmGreenShades-row2)",
  "warmGreenShades-row3": "var(--color-warmGreenShades-row3)",
  "warmGreenShades-row4": "var(--color-warmGreenShades-row4)",
  "warmGreenShades-row5": "var(--color-warmGreenShades-row5)",
  "purpleShades-row1": "var(--color-purpleShades-row1)",
  "purpleShades-row2": "var(--color-purpleShades-row2)",
  "spritzShades-row1": "var(--color-spritzShades-row1)",
  "spritzShades-row2": "var(--color-spritzShades-row2)",
  "orangeShades-row1": "var(--color-orangeShades-row1)",
  "orangeShades-row2": "var(--color-orangeShades-row2)",
  "orangeShades-row3": "var(--color-orangeShades-row3)",
  "orangeShades-row4": "var(--color-orangeShades-row4)",
  "orangeShades-row5": "var(--color-orangeShades-row5)",
  "grayishShades-row1": "var(--color-grayishShades-row1)",
  "grayishShades-row2": "var(--color-grayishShades-row2)",
  "grayishShades-row3": "var(--color-grayishShades-row3)",
  "grayishShades-row4": "var(--color-grayishShades-row4)",
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
const baseExtendFontFamily = baseExtend.fontFamily ?? {};

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

const receptionFontFamily = {
  heading: "var(--font-sans)",
  body: "var(--font-sans)",
};

const theme = {
  ...baseTheme,
  extend: {
    ...baseExtend,
    colors: {
      ...baseExtendColors,
      ...receptionColorBridge,
      ...receptionSemanticColors,
      ...receptionShadeColors,
    },
    fontFamily: {
      ...baseExtendFontFamily,
      ...receptionFontFamily,
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

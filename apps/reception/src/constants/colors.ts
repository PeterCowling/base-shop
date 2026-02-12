export const darkPalette = {
  // Deprecated legacy values retained for reference only.
  // Runtime styling now resolves through semantic token aliases in globals.css.
  darkBg: "#000000",
  darkSurface: "#333333",
  darkAccentGreen: "#a8dba8",
  darkAccentOrange: "#ffd89e",
} as const;

export type DarkPalette = typeof darkPalette;

export const darkPaletteTokenMap = {
  darkBg: "--reception-dark-bg",
  darkSurface: "--reception-dark-surface",
  darkAccentGreen: "--reception-dark-accent-green",
  darkAccentOrange: "--reception-dark-accent-orange",
} as const;

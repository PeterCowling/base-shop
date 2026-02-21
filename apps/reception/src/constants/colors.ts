export const darkPalette = {
  // Deprecated legacy values retained for reference only.
  // Runtime styling now resolves through semantic token aliases in globals.css.
  /* eslint-disable-next-line ds/no-raw-color -- REC-02: legacy constants consumed only by token bridge */
  darkBg: "#000000",
  /* eslint-disable-next-line ds/no-raw-color -- REC-02: legacy constants consumed only by token bridge */
  darkSurface: "#333333",
  /* eslint-disable-next-line ds/no-raw-color -- REC-02: legacy constants consumed only by token bridge */
  darkAccentGreen: "#a8dba8",
  /* eslint-disable-next-line ds/no-raw-color -- REC-02: legacy constants consumed only by token bridge */
  darkAccentOrange: "#ffd89e",
} as const;

export type DarkPalette = typeof darkPalette;

export const darkPaletteTokenMap = {
  darkBg: "--reception-dark-bg",
  darkSurface: "--reception-dark-surface",
  darkAccentGreen: "--reception-dark-accent-green",
  darkAccentOrange: "--reception-dark-accent-orange",
} as const;

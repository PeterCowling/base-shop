// src/libs/reservation-grid/src/lib/constants/theme.ts

import type { TTheme } from "../interfaces/theme.interface";

const THEME: TTheme = {
  "font.face": "sans-serif",
  "font.size": "14px",
  "color.text": "var(--rvg-color-text)",
  "color.background": "var(--rvg-color-background)",
  "color.border": "var(--rvg-color-border)",
  "color.today": "var(--rvg-color-today)",
  "color.selected": "var(--rvg-color-selected)",
  "color.weekend": "var(--rvg-color-weekend)",
  "width.title": "50%",
  "width.info": "50%",
  "date.status": {
    free: "var(--rvg-color-free)",
    disabled: "var(--rvg-color-inaccessible)",
    awaiting: "var(--rvg-color-awaiting)",
    confirmed: "var(--rvg-color-confirmed)",
  },
};

export { THEME };

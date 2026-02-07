// File: /src/libs/reservation-grid/src/lib/interfaces/theme.interface.ts

import type { TDateStatus } from "./grid.interface";

/**
 * Now TTheme doesn't need a generic param.
 * "date.status" is simply a record keyed by TDateStatus (which includes "free", "disabled", etc. plus custom strings).
 */
export interface TTheme {
  "font.face": string;
  "font.size": string;
  "color.text": string;
  "color.background": string;
  "color.border": string;
  "color.today": string;
  "color.selected": string;
  "color.weekend": string;
  "width.title": string;
  "width.info": string;
  "date.status": Record<TDateStatus, string>;
}

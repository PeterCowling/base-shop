// src/libs/reservation-grid/src/lib/interfaces/mainContext.interface.ts (or similar)
import type { TClickCellEventData } from "./grid.interface";
import type { TLocale, TLocaleKey } from "./locale.interface";
import type { TTheme } from "./theme.interface";
// Import the payload type definition correctly
import type { ReservationMovePayload } from "../../../types/dndTypes";

export interface TMainContext<TCustomStatus extends string = never> {
  start: string;
  end: string;
  locale: TLocaleKey | TLocale;
  highlightToday?: boolean;
  showInfo?: boolean;
  theme?: TTheme<TCustomStatus>;
  selectedColumns?: string[];
  selectedRows?: string[];
  onClickTitle?: (id: string) => void;
  onClickCell?: (eventData: TClickCellEventData<TCustomStatus>) => void;

  // --- DND Props ---
  roomNumber?: string; // Added: To provide context for drag source
  onReservationMove?: (payload: ReservationMovePayload<TCustomStatus>) => void;
}

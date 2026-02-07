// File: /src/libs/reservation-grid/src/lib/interfaces/grid.interface.ts

export interface TGridRow {
  id: string;
  title: string;
  info?: string;
  days: TGridCell[];
}

export interface TGridCell {
  id: string;
  date: string;
  label: string;
  dayType: TDayType;
  dayStatus: TDateStatus;
  today?: boolean;
  weekend?: boolean;
  selected?: boolean;
  clickable?: boolean;
}

export interface TClickCellEventData {
  id: string;
  date: string;
  dayType: TDayType;
  dayStatus: TDateStatus;
}

/**
 * Instead of a generic parameter, define TDateStatus as "free" | ... plus custom string.
 * This way your code can hold any additional string status but doesn't need generics.
 */
export type TDateStatus =
  | "free"
  | "disabled"
  | "awaiting"
  | "confirmed"
  | string;

export type TDayType = "past" | "future" | "present" | string;

/**
 * TGridProps is the main prop set for the ReservationGrid.
 */
export interface TGridProps {
  data: TGridRow[];
  start: string; // e.g. "2023-01-01"
  end: string; // e.g. "2023-03-01"
  title?: string;
  hasInfoColumn?: boolean;
  highlightToday?: boolean;
  locale?: string;
  onClickCell?: (data: TClickCellEventData) => void;
}

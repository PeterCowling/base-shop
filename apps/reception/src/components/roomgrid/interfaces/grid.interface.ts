type TDefaultDateStatus = "free" | "awaiting" | "confirmed" | "disabled";
type TDatePosition = "none" | "start" | "middle" | "end";

type TDateStatus<TCustomStatus extends string = never> =
  | TDefaultDateStatus
  | TCustomStatus;

type TDayType =
  | "single.free"
  | "single.disabled"
  | "single.full"
  | "single.start"
  | "single.end"
  | "intersection"
  | "free"
  | "disabled"
  | "busy"
  | "arrival"
  | "departure";

type TClickCellEventData<TCustomStatus extends string = never> = {
  id: string;
  date: string;
  dayType: TDayType;
  dayStatus: TDateStatus<TCustomStatus>[];
};

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

export type { TClickCellEventData, TDatePosition, TDateStatus, TDayType };

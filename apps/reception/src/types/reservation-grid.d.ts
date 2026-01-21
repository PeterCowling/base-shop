declare module "@daminort/reservation-grid" {
  export interface TClickCellEventData<TStatus = string> {
    id: string;
    date: string;
    dayType: "single" | "start" | "between" | "end" | string;
    dayStatus: TStatus | TStatus[];
  }
  export interface TGridProps<TStatus = string> {
    start: string;
    end: string;
    highlightToday?: boolean;
    title?: string;
    data: unknown;
    theme?: unknown;
    locale?: string;
    onClickCell?: (data: TClickCellEventData<TStatus>) => void;
  }
  export function ReservationGrid<TStatus = string>(
    props: TGridProps<TStatus>
  ): JSX.Element;
  export const THEME: unknown;
}

import "./rvg.css";

import type { ReactElement } from "react";
import { memo } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import type { TGridProps } from "./components/Grid";
import { Grid } from "./components/Grid";
import { THEME } from "./constants/theme";
import type { TDaysRange, TDaysRangeOptions } from "./interfaces/daysRange.interface";
import type {
  TClickCellEventData,
  TDatePosition,
  TDateStatus,
  TDayType,
} from "./interfaces/grid.interface";
import type { TLocale, TLocaleKey, TLocales } from "./interfaces/locale.interface";
import type { TMainContext } from "./interfaces/mainContext.interface";
import type { TReservedPeriod } from "./interfaces/reservedPeriod";
import type { TRow } from "./interfaces/row";
import type { TTheme } from "./interfaces/theme.interface";

type ReservationGridProps<TCustomStatus extends string = never> = TGridProps<TCustomStatus>;

function ReservationGridInner<TCustomStatus extends string = never>(
  props: TGridProps<TCustomStatus>
): ReactElement {
  return (
    <DndProvider backend={HTML5Backend}>
      <Grid<TCustomStatus> {...props} />
    </DndProvider>
  );
}

const ReservationGrid = memo(ReservationGridInner) as typeof ReservationGridInner;

export type {
  ReservationGridProps,
  TClickCellEventData,
  TDatePosition,
  TDateStatus,
  TDaysRange,
  TDaysRangeOptions,
  TDayType,
  TGridProps,
  TLocale,
  TLocaleKey,
  TLocales,
  TMainContext,
  TReservedPeriod,
  TRow,
  TTheme,
};

export { ReservationGrid, THEME };

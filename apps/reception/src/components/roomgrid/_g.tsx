// src/component/roomgrid/g.tsx

import "./rvg.css";

import type { TGridProps } from "./components/Grid";
import { Grid } from "./components/Grid";
import { THEME } from "./constants/theme";
import type {
  TDaysRange,
  TDaysRangeOptions,
} from "./interfaces/daysRange.interface";
import type {
  TClickCellEventData,
  TDatePosition,
  TDateStatus,
  TDayType,
} from "./interfaces/grid.interface";
import type {
  TLocale,
  TLocaleKey,
  TLocales,
} from "./interfaces/locale.interface";
import type { TMainContext } from "./interfaces/mainContext.interface";
import type { TReservedPeriod } from "./interfaces/reservedPeriod";
import type { TRow } from "./interfaces/row";
import type { TTheme } from "./interfaces/theme.interface";

function ReservationGrid<TCustomStatus extends string = never>(
  props: TGridProps<TCustomStatus>
) {
  return <Grid {...props} />;
}

export type {
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

// src/libs/reservation-grid/src/lib/components/Row/Row.interface.ts

import type { ReactNode } from "react";

import type { TDateStatus, TDayType } from "../../interfaces/grid.interface";
import type { TRow } from "../../interfaces/row";

type TRowProps<TCustomStatus extends string = never> = Omit<
  TRow<TCustomStatus>,
  "title" | "info"
> & {
  selected: boolean;
  title: string | ReactNode;
  info: string | ReactNode;
};

type TDayParams<TCustomStatus extends string = never> = {
  dayType: TDayType;
  dayStatus: TDateStatus<TCustomStatus>[];
};

export type { TDayParams, TRowProps };

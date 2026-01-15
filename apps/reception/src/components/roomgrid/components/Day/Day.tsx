import type { FC } from "react";

import type { TDayProps } from "./Day.interface";
import {
  Intersection,
  SingleDisabled,
  SingleEnd,
  SingleFree,
  SingleFull,
  SingleStart,
} from "../../components/Days";
import type { TDayType } from "../../interfaces/grid.interface";
import type { TDaysProps } from "../Days/Days.interface";

const days: Partial<Record<TDayType, FC<TDaysProps>>> = {
  "single.free": SingleFree,
  "single.disabled": SingleDisabled,
  "single.full": SingleFull,
  "single.start": SingleStart,
  "single.end": SingleEnd,
  intersection: Intersection,
  free: SingleFree,
  disabled: SingleDisabled,
  busy: SingleFull,
  arrival: SingleStart,
  departure: SingleEnd,
};

const Day: FC<TDayProps> = ({ type, topColor, bottomColor }) => {
  const Component: FC<TDaysProps> = days[type] ?? SingleFree;

  return <Component topColor={topColor} bottomColor={bottomColor} />;
};

export { Day };

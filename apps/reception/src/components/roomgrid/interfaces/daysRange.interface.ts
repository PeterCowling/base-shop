// src/interfaces/daysRange.interface.ts

/**
 * Represents the options used to create a day range.
 */
import { type TLocale } from "./locale.interface";

export interface TDaysRangeOptions {
  start: string;
  end: string;
  locale: TLocale;
}

/**
 * Represents an individual day in the range.
 */
export interface TDaysRange {
  value: string;
  date: number;
  day: string;
  isWeekend: boolean;
  isToday: boolean;
}

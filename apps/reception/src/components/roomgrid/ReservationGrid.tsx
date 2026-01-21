// src/components/roomgrid/ReservationGrid.tsx
/**
 * Custom ReservationGrid component to replace @daminort/reservation-grid
 *
 * A lightweight table-based reservation grid that displays booking periods
 * across a date range with customizable status colors.
 */

import type { ReactElement } from "react";
import { memo, useMemo } from "react";

import { createDaysRange } from "../../utils/dateUtils";
import type { TDaysRange } from "./interfaces/daysRange.interface";
import type { TLocale, TLocaleKey } from "./interfaces/locale.interface";
import { LOCALES } from "./constants/locales";
import { GridCell } from "./GridCell";
import type { TReservedPeriod } from "./interfaces/reservedPeriod";
import "./rvg.css";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface TClickCellEventData<TStatus = string> {
  /** Row identifier (e.g., bed ID). */
  id: string;
  /** ISO-8601 date string for the clicked cell. */
  date: string;
  /** Position of the day inside the booking period. */
  dayType: "free" | "busy" | "arrival" | "departure" | string;
  /** Status or list of statuses assigned to the day. */
  dayStatus: TStatus | TStatus[];
}

export interface ReservationRow<TCustomStatus extends string = never> {
  id: string;
  title: string;
  info?: string;
  periods: TReservedPeriod<TCustomStatus>[];
}

export interface ReservationGridProps<TCustomStatus extends string = never> {
  /** Start date (YYYY-MM-DD) */
  start: string;
  /** End date (YYYY-MM-DD) */
  end: string;
  /** Row data with periods */
  data: ReservationRow<TCustomStatus>[];
  /** Theme config with status colors */
  theme?: {
    "date.status"?: Record<string, string>;
  };
  /** Highlight today's column */
  highlightToday?: boolean;
  /** Locale key for day abbreviations */
  locale?: string;
  /** Title column header */
  title?: string;
  /** Click handler for cells */
  onClickCell?: (data: TClickCellEventData<TCustomStatus>) => void;
}

/* -------------------------------------------------------------------------- */
/*                                 HELPERS                                    */
/* -------------------------------------------------------------------------- */

function isValidLocaleKey(key: string): key is TLocaleKey {
  return key in LOCALES;
}

function getLocaleData(locale: string): TLocale {
  if (isValidLocaleKey(locale)) {
    return LOCALES[locale];
  }
  return LOCALES.en;
}

/* -------------------------------------------------------------------------- */
/*                               COMPONENT                                    */
/* -------------------------------------------------------------------------- */

function ReservationGridInner<TCustomStatus extends string = never>({
  start,
  end,
  data,
  theme,
  highlightToday = false,
  locale = "en",
  title = "",
  onClickCell,
}: ReservationGridProps<TCustomStatus>): ReactElement {
  // Get locale data
  const localeData = useMemo(() => getLocaleData(locale), [locale]);

  // Generate date columns
  const daysRange = useMemo<TDaysRange[]>(
    () => createDaysRange({ start, end, locale: localeData }),
    [start, end, localeData]
  );

  // Status colors from theme
  const statusColors = theme?.["date.status"] ?? {};

  return (
    <div className="rvg-wrapper">
      <table className="rvg-table">
        <thead>
          <tr>
            {/* Title column header */}
            <th className="rvg-title rvg-fixed">{title}</th>
            {/* Date column headers */}
            {daysRange.map((day) => {
              const cellClasses = [
                "rvg-cell",
                day.isWeekend ? "weekend" : "",
                highlightToday && day.isToday ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <th key={day.value} className={cellClasses}>
                  <div className="day">
                    <div>
                      <div>{day.day}</div>
                      <div>{day.date}</div>
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {/* Row title (sticky) */}
              <td className="rvg-title rvg-fixed">{row.title}</td>
              {/* Date cells */}
              {daysRange.map((day) => (
                <GridCell<TCustomStatus>
                  key={`${row.id}-${day.value}`}
                  rowId={row.id}
                  date={day.value}
                  isWeekend={day.isWeekend}
                  isToday={highlightToday && day.isToday}
                  periods={row.periods}
                  statusColors={statusColors}
                  onClickCell={onClickCell}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const ReservationGrid = memo(ReservationGridInner) as typeof ReservationGridInner;

// src/components/roomgrid/ReservationGrid.tsx
/**
 * Custom ReservationGrid component to replace @daminort/reservation-grid
 *
 * A lightweight table-based reservation grid that displays booking periods
 * across a date range with customizable status colors.
 */

import "./rvg.css";

import type { ReactElement } from "react";
import { memo, useMemo } from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@acme/design-system/atoms";

import { createDaysRange } from "../../utils/dateUtils";

import { LOCALES } from "./constants/locales";
import { GridCell } from "./GridCell";
import type { TDaysRange } from "./interfaces/daysRange.interface";
import type { TLocale, TLocaleKey } from "./interfaces/locale.interface";
import type { TReservedPeriod } from "./interfaces/reservedPeriod";

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
      <Table className="rvg-table">
        <TableHeader>
          <TableRow>
            {/* Title column header */}
            <TableHead className="rvg-title rvg-fixed">{title}</TableHead>
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
                <TableHead key={day.value} className={cellClasses}>
                  <div className="day">
                    <div>
                      <div>{day.day}</div>
                      <div>{day.date}</div>
                    </div>
                  </div>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id}>
              {/* Row title (sticky) */}
              <TableCell className="rvg-title rvg-fixed">{row.title}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const ReservationGrid = memo(ReservationGridInner) as typeof ReservationGridInner;

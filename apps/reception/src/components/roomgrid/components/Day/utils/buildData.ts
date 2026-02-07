// File: /src/libs/reservation-grid/src/lib/utils/buildData.ts

import {
  formatItalyDate,
  generateDateRange,
  isToday,
  isWeekend,
} from "../../../../../utils/dateUtils";
import type { TGridCell, TGridRow } from "../../../interfaces/grid.interface";

/**
 * Builds an array of day objects between start and end dates (inclusive).
 * Each object includes:
 * - date: YYYY-MM-DD string
 * - label: e.g., "Sep 05" or "09/05" depending on locale
 * - weekend: boolean
 * - today: boolean
 */
export function buildDays(
  start: string,
  end: string,
  locale?: string
): Array<{
  date: string;
  label: string;
  weekend?: boolean;
  today?: boolean;
}> {
  return generateDateRange(start, end).map((dateStr) => {
    const weekend = isWeekend(dateStr);
    const today = isToday(dateStr);
    const label = buildDayLabel(new Date(dateStr), locale);

    return {
      date: dateStr,
      label,
      weekend,
      today,
    };
  });
}

/**
 * Builds grid rows (each row has an array of TGridCells).
 * Adjust to incorporate your data's structure.
 */
export function buildRows(
  data: TGridRow[], // your existing row data with { id, title, info, days[] }?
  days: Array<{
    date: string;
    label: string;
    weekend?: boolean;
    today?: boolean;
  }>,
  highlightToday?: boolean
): TGridRow[] {
  // For each row (like a bed, a room, or any resource),
  // map existing 'days' array to TGridCells that incorporate dayType/dayStatus, etc.
  return data.map((row) => {
    // row.days might be specialized to your existing booking logic
    // We'll assume row.days is empty in the raw data, and we produce them:
    const rowCells: TGridCell[] = days.map((d) => {
      // By default:
      const cell: TGridCell = {
        id: row.id, // Or something else that makes sense in your context
        date: d.date,
        label: d.label,
        dayType: "single.free", // default
        dayStatus: "free", // default
        today: highlightToday ? d.today : false,
        weekend: d.weekend,
        selected: false,
        clickable: true,
      };

      // If you have your own booking logic, you can override dayType/dayStatus here,
      // e.g. searching data for a date range. For example:
      // row.periods might store reservation info; if there's an active booking on this date,
      // set dayStatus = "confirmed" or any custom.
      // cell.dayStatus = findDayStatusInRow(row, d.date) || "free";

      return cell;
    });

    // Return the same TGridRow shape but with the newly built `days` array
    return {
      ...row,
      days: rowCells,
    };
  });
}

/**
 * Example day label builder—format or localize as needed.
 */
function buildDayLabel(dateObj: Date, _locale?: string): string {
  return formatItalyDate(dateObj);
}

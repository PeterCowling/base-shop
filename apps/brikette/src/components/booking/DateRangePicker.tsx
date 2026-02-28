"use client";

import React from "react";
import type { DateRange } from "react-day-picker";
import { DayPicker } from "react-day-picker";
import styles from "react-day-picker/dist/style.module.css";

import {
  getMaxCheckoutForStay,
  getMinCheckoutForStay,
} from "@/utils/bookingDateRules";
import { formatDate, formatDisplayDate } from "@/utils/dateUtils";

export type { DateRange };

const TEST_IDS = {
  helper: "date-range-picker-helper",
  summary: "date-range-summary",
  stayHelper: "date-range-stay-helper",
  clear: "date-range-clear",
} as const;

export interface DateRangePickerProps {
  /** Currently selected date range. */
  selected?: DateRange;
  /** Called whenever the range changes (including clear). */
  onRangeChange: (range: DateRange | undefined) => void;
  /**
   * Helper text shown below the picker when no complete range is selected.
   * Pass a translated string from `t("date.stayHelper")`.
   */
  stayHelperText?: string;
  /**
   * Label for the clear button.
   * Pass a translated string from `t("date.clearDates")`.
   */
  clearDatesText?: string;
  /** Optional extra class applied to the outer wrapper div. */
  className?: string;
}

/**
 * Returns a disabled-day predicate for DayPicker.
 *
 * When `from` is selected and `to` is not yet chosen, only days within
 * [from + HOSTEL_MIN_STAY_NIGHTS, from + HOSTEL_MAX_STAY_NIGHTS] are
 * selectable as `to`. All other days are disabled.
 */
function buildDisabledMatcher(
  selected: DateRange | undefined
): (day: Date) => boolean {
  return (day: Date): boolean => {
    // Only enforce constraints when the user is selecting `to` (from set, to absent)
    if (!selected?.from || selected?.to) return false;
    const fromIso = formatDate(selected.from);
    const minCheckout = getMinCheckoutForStay(fromIso);
    const maxCheckout = getMaxCheckoutForStay(fromIso);
    if (!minCheckout || !maxCheckout) return false;
    const dayIso = formatDate(day);
    return dayIso < minCheckout || dayIso > maxCheckout;
  };
}

/**
 * Builds the summary string "DD MMM → DD MMM (N nights)" from a complete range.
 * Returns null if the range is incomplete or has zero/negative nights.
 */
function buildSummary(selected: DateRange | undefined): string | null {
  if (!selected?.from || !selected?.to) return null;
  const nights = Math.round(
    (selected.to.getTime() - selected.from.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (nights <= 0) return null;
  const fromStr = formatDisplayDate(selected.from);
  const toStr = formatDisplayDate(selected.to);
  return `${fromStr} \u2192 ${toStr} (${nights} night${nights === 1 ? "" : "s"})`;
}

/**
 * `DateRangePicker` — a single-interaction range calendar for Brikette booking surfaces.
 *
 * - First click sets check-in (`from`); second click sets check-out (`to`).
 * - Enforces HOSTEL_MIN_STAY_NIGHTS / HOSTEL_MAX_STAY_NIGHTS via DayPicker's
 *   `disabled` Matcher when the user is selecting `to`.
 * - Shows a derived `DD MMM → DD MMM (N nights)` summary when a complete range
 *   is selected; shows the `stayHelperText` otherwise.
 * - "Clear dates" button resets the selection to undefined.
 *
 * @example
 * ```tsx
 * <DateRangePicker
 *   selected={range}
 *   onRangeChange={setRange}
 *   stayHelperText={t("date.stayHelper")}
 *   clearDatesText={t("date.clearDates")}
 * />
 * ```
 */
export function DateRangePicker({
  selected,
  onRangeChange,
  stayHelperText = "2\u20138 nights", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] fallback; callers pass t("date.stayHelper")
  clearDatesText = "Clear dates", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] fallback; callers pass t("date.clearDates")
  className,
}: DateRangePickerProps): React.JSX.Element {
  const disabledMatcher = buildDisabledMatcher(selected);
  const summary = buildSummary(selected);
  const hasCompleteRange = Boolean(selected?.from && selected?.to);

  function handleSelect(range: DateRange | undefined): void {
    onRangeChange(range);
  }

  function handleClear(): void {
    onRangeChange(undefined);
  }

  return (
    <div className={className}>
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        disabled={disabledMatcher}
        classNames={styles}
      />

      {/* Summary or helper text */}
      <div data-cy={TEST_IDS.helper} className="mt-2">
        {hasCompleteRange && summary ? (
          <span data-cy={TEST_IDS.summary}>{summary}</span>
        ) : (
          <span data-cy={TEST_IDS.stayHelper}>{stayHelperText}</span>
        )}
      </div>

      {/* Clear dates button */}
      <button
        type="button"
        data-cy={TEST_IDS.clear}
        onClick={handleClear}
        className="mt-1 block min-h-11 min-w-11"
      >
        {clearDatesText}
      </button>
    </div>
  );
}

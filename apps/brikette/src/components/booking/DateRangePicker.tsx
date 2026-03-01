"use client";

import React, { useEffect, useState } from "react";
import type { DateRange } from "react-day-picker";
import { DayPicker } from "react-day-picker";
import styles from "react-day-picker/dist/style.module.css";
import {
  ar, da, de, enUS, es, fr, hi, hu, it, ja, ko, nb, pl, pt, ru, sv, vi, zhCN,
} from "react-day-picker/locale";

import type { AppLanguage } from "@/i18n.config";
import {
  getMaxCheckoutForStay,
  getMinCheckoutForStay,
} from "@/utils/bookingDateRules";
import { formatDate, formatDisplayDate, safeParseIso } from "@/utils/dateUtils";

export type { DateRange };

// Maps AppLanguage codes to date-fns locale objects for DayPicker internationalisation.
// "no" maps to nb (Bokmål), "zh" maps to zhCN.
const DAYPICKER_LOCALE_MAP: Partial<Record<AppLanguage, typeof enUS>> = {
  ar, da, de, es, fr, hi, hu, it, ja, ko, no: nb, pl, pt, ru, sv, vi, zh: zhCN,
};

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
  /** UI language — drives DayPicker locale (month/weekday names). */
  lang?: AppLanguage;
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
  /**
   * Accessible label for the check-in date input.
   */
  checkInLabelText?: string;
  /**
   * Accessible label for the check-out date input.
   */
  checkOutLabelText?: string;
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
function useDayPickerCellSize(): number {
  const [size, setSize] = useState(32);
  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      setSize(w < 400 ? 30 : w < 640 ? 34 : 36);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export function DateRangePicker({
  selected,
  onRangeChange,
  stayHelperText = "2\u20138 nights", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] fallback; callers pass t("date.stayHelper")
  clearDatesText = "Clear dates", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] fallback; callers pass t("date.clearDates")
  checkInLabelText = "Check in", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] fallback label
  checkOutLabelText = "Check out", // i18n-exempt -- BRIK-0 [ttl=2026-12-31] fallback label
  lang,
  className,
}: DateRangePickerProps): React.JSX.Element {
  const cellSize = useDayPickerCellSize();
  const dayPickerLocale = lang ? (DAYPICKER_LOCALE_MAP[lang] ?? enUS) : enUS;
  const disabledMatcher = buildDisabledMatcher(selected);
  const summary = buildSummary(selected);
  const hasCompleteRange = Boolean(selected?.from && selected?.to);
  const selectedFromIso = selected?.from ? formatDate(selected.from) : "";
  const selectedToIso = selected?.to ? formatDate(selected.to) : "";
  const minCheckout = selectedFromIso ? getMinCheckoutForStay(selectedFromIso) ?? "" : "";

  function handleSelect(range: DateRange | undefined): void {
    onRangeChange(range);
  }

  function handleCheckInInputChange(value: string): void {
    const from = safeParseIso(value);
    if (!from) {
      onRangeChange(undefined);
      return;
    }

    const fromIso = formatDate(from);
    const minCheckoutIso = getMinCheckoutForStay(fromIso);
    const maxCheckoutIso = getMaxCheckoutForStay(fromIso);
    const currentToIso = selected?.to ? formatDate(selected.to) : "";

    const shouldResetCheckout =
      !currentToIso ||
      !minCheckoutIso ||
      !maxCheckoutIso ||
      currentToIso < minCheckoutIso ||
      currentToIso > maxCheckoutIso;

    const nextTo = shouldResetCheckout && minCheckoutIso ? safeParseIso(minCheckoutIso) : selected?.to;
    onRangeChange({ from, to: nextTo });
  }

  function handleCheckOutInputChange(value: string): void {
    const to = safeParseIso(value);
    if (!selected?.from) {
      onRangeChange(undefined);
      return;
    }
    onRangeChange({
      from: selected.from,
      to,
    });
  }

  function handleClear(): void {
    onRangeChange(undefined);
  }

  return (
    <div className={className}>
      <label className="sr-only">
        {checkInLabelText}
        <input
          type="date"
          aria-label={checkInLabelText}
          value={selectedFromIso}
          onChange={(event) => handleCheckInInputChange(event.target.value)}
        />
      </label>
      <label className="sr-only">
        {checkOutLabelText}
        <input
          type="date"
          aria-label={checkOutLabelText}
          value={selectedToIso}
          min={minCheckout}
          onChange={(event) => handleCheckOutInputChange(event.target.value)}
        />
      </label>
      <DayPicker
        mode="range"
        selected={selected}
        onSelect={handleSelect}
        disabled={disabledMatcher}
        locale={dayPickerLocale}
        classNames={styles}
        styles={{
          root: {
            "--rdp-accent-color": "var(--color-brand-primary)",
            "--rdp-accent-background-color": "rgba(var(--rgb-brand-primary), 0.08)",
            "--rdp-day-height": `${cellSize}px`,
            "--rdp-day-width": `${cellSize}px`,
            "--rdp-day_button-height": `${cellSize - 2}px`,
            "--rdp-day_button-width": `${cellSize - 2}px`,
          } as React.CSSProperties,
        }}
      />

      {/* Hidden helper text for tests / screen readers */}
      <span data-cy={TEST_IDS.helper} className="sr-only">
        {hasCompleteRange && summary ? (
          <span data-cy={TEST_IDS.summary}>{summary}</span>
        ) : (
          <span data-cy={TEST_IDS.stayHelper}>{stayHelperText}</span>
        )}
      </span>

      {/* Clear dates — centred under the calendar */}
      <div className="mt-1 flex justify-center">
        <button
          type="button"
          data-cy={TEST_IDS.clear}
          onClick={handleClear}
          className="min-h-11 min-w-11 text-sm font-medium text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-1"
        >
          {clearDatesText}
        </button>
      </div>
    </div>
  );
}

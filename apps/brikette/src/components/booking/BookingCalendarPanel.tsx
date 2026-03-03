"use client";

import { type ReactNode, useId } from "react";

import type { AppLanguage } from "@/i18n.config";
import { Minus, Plus } from "@/icons";
import { formatDisplayDate } from "@/utils/dateUtils";

import type { DateRange } from "./DateRangePicker";
import { DateRangePicker } from "./DateRangePicker";

type BookingCalendarPanelProps = {
  lang?: AppLanguage;
  range: DateRange;
  onRangeChange: (next: DateRange | undefined) => void;
  pax: number;
  onPaxChange: (next: number) => void;
  minPax?: number;
  maxPax?: number;
  stayHelperText: string;
  clearDatesText: string;
  checkInLabelText: string;
  checkOutLabelText: string;
  guestsLabelText: string;
  decreaseGuestsAriaLabel: string;
  increaseGuestsAriaLabel: string;
  actionSlot?: ReactNode;
};

export function BookingCalendarPanel({
  lang,
  range,
  onRangeChange,
  pax,
  onPaxChange,
  minPax = 1,
  maxPax = 8,
  stayHelperText,
  clearDatesText,
  checkInLabelText,
  checkOutLabelText,
  guestsLabelText,
  decreaseGuestsAriaLabel,
  increaseGuestsAriaLabel,
  actionSlot,
}: BookingCalendarPanelProps): JSX.Element {
  const guestsLabelId = useId();

  return (
    <div className="space-y-6 lg:flex lg:items-stretch lg:gap-6 lg:space-y-0">
      <DateRangePicker
        selected={range}
        onRangeChange={onRangeChange}
        stayHelperText={stayHelperText}
        clearDatesText={clearDatesText}
        checkInLabelText={checkInLabelText}
        checkOutLabelText={checkOutLabelText}
        lang={lang}
        className="lg:shrink-0"
      />
      <div className="flex flex-col items-center gap-3 lg:w-52 lg:flex-none">
        <div className="hidden w-full lg:flex lg:flex-col lg:gap-2">
          <div className="flex flex-col gap-1 rounded-xl border border-brand-outline/20 bg-brand-bg px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-text/70">
              {checkInLabelText}
            </span>
            <span className="text-sm font-semibold tabular-nums text-brand-heading">
              {range.from ? formatDisplayDate(range.from) : <span className="text-brand-text/30">—</span>}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-brand-outline/20 bg-brand-bg px-3 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-text/70">
              {checkOutLabelText}
            </span>
            <span className="text-sm font-semibold tabular-nums text-brand-heading">
              {range.to ? formatDisplayDate(range.to) : <span className="text-brand-text/30">—</span>}
            </span>
          </div>
        </div>

        <div className="hidden lg:block lg:flex-1" />

        <div className="flex w-full flex-col gap-1.5">
          <span id={guestsLabelId} className="text-sm font-semibold text-brand-heading">
            {guestsLabelText}
          </span>
          <div
            role="group"
            aria-labelledby={guestsLabelId}
            className="flex items-center overflow-hidden rounded-xl border border-brand-outline/40 bg-brand-bg shadow-sm"
          >
            <button
              type="button"
              onClick={() => onPaxChange(Math.max(minPax, pax - 1))}
              disabled={pax <= minPax}
              aria-label={decreaseGuestsAriaLabel}
              className="flex min-h-11 min-w-11 items-center justify-center text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span
              aria-live="polite"
              aria-atomic="true"
              className="flex-1 select-none text-center text-sm font-semibold tabular-nums text-brand-heading"
            >
              {pax}
            </span>
            <button
              type="button"
              onClick={() => onPaxChange(Math.min(maxPax, pax + 1))}
              disabled={pax >= maxPax}
              aria-label={increaseGuestsAriaLabel}
              className="flex min-h-11 min-w-11 items-center justify-center text-brand-primary transition-colors hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        {actionSlot}
      </div>
    </div>
  );
}

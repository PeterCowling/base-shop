import type { ReactElement } from "react";
import { memo, useCallback, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";

import { Button } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives";

import {
  buildQuickDateRange,
  formatDateForInput,
  getWeekdayShortLabel,
  parseDate,
} from "../../utils/dateUtils";

interface DateSelectorProps {
  selectedDate: string; // "YYYY-MM-DD"
  onDateChange: (date: string) => void;
  username?: string;
}

/**
 * Quick-select date buttons + an inline calendar picker available to all users.
 * The calendar expands inline below the button row to avoid popup timing races.
 */
function DateSelector({
  selectedDate,
  onDateChange,
  username: _username,
}: DateSelectorProps): ReactElement {
  const { today, yesterday, nextDays: nextFiveDays } = useMemo(
    () => buildQuickDateRange(5),
    []
  );

  const renderButton = useCallback(
    (label: string, day: string): ReactElement => {
      const isSelected = selectedDate === day;
      return (
        <Button
          key={day}
          className={`px-4 py-2 border rounded-lg text-sm font-medium text-center transition-colors ${
            isSelected
              ? "bg-primary-main text-primary-fg border-primary-main"
              : "bg-surface text-foreground border-border-strong hover:bg-surface-2"
          }`}
          onClick={() => onDateChange(day)}
        >
          {label}
        </Button>
      );
    },
    [selectedDate, onDateChange]
  );

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDayPickerSelect = useCallback(
    (date?: Date) => {
      if (date) {
        const newDate = formatDateForInput(date);
        if (newDate !== formatDateForInput(selectedDate)) {
          onDateChange(newDate);
        }
      }
      setIsCalendarOpen(false);
    },
    [onDateChange, selectedDate]
  );

  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-surface-2 rounded-lg border border-border-strong">
      {/* Top row: quick-select buttons + calendar toggle */}
      <div className="flex items-center justify-between gap-4">
        <Cluster gap={2}>
          {renderButton("Yesterday", yesterday)}
          {renderButton("Today", today)}
          {nextFiveDays.map((day) => renderButton(getWeekdayShortLabel(day), day))}
        </Cluster>

        <Button
          className={`shrink-0 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            isCalendarOpen
              ? "bg-primary-main text-primary-fg border-primary-main"
              : "bg-surface text-foreground border-border-strong hover:bg-surface-2"
          }`}
          onClick={() => setIsCalendarOpen((prev) => !prev)}
        >
          {selectedDate || "Select a date"}
        </Button>
      </div>

      {/* Inline calendar — expands below the button row, no popup timing race */}
      {isCalendarOpen && (
        <div className="border-t border-border-strong pt-3 flex justify-end">
          <DayPicker
            mode="single"
            selected={parseDate(selectedDate)}
            onSelect={handleDayPickerSelect}
            classNames={{
              root: "bg-surface border border-border-strong rounded-xl shadow-lg p-4 text-foreground",
              months: "relative",
              month: "space-y-3",
              month_caption: "flex items-center justify-center h-9",
              caption_label: "text-sm font-semibold text-foreground",
              nav: "absolute top-0 inset-x-0 flex justify-between",
              button_previous:
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
              button_next:
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
              chevron: "w-4 h-4 fill-current",
              month_grid: "border-collapse",
              weekdays: "flex",
              weekday:
                "flex h-9 w-9 items-center justify-center text-xs font-medium text-muted-foreground",
              weeks: "space-y-1 mt-1",
              week: "flex",
              day: "p-0",
              day_button:
                "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-foreground hover:bg-surface-2 transition-colors cursor-pointer",
              today: "font-bold text-primary-main/100",
              selected:
                "bg-primary-main/100 text-primary-fg/100 hover:bg-primary-main/100",
              outside: "opacity-30",
              disabled: "opacity-25 cursor-not-allowed",
            }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(DateSelector);

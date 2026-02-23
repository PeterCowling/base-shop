/* File: src/components/prepare/DateSelectorPP.tsx */
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import { Button } from "@acme/design-system/atoms";

import {
  buildQuickDateRange,
  formatDateForInput,
  getWeekdayShortLabel,
  parseLocalDate,
} from "../../utils/dateUtils";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  username?: string;
}

/**
 * The user picks from "Yesterday", "Today", + next 5 days.
 * If user is Pete, show a calendar popover for free date picking.
 */
export default function DateSelector({
  selectedDate,
  onDateChange,
  username,
}: DateSelectorProps): ReactElement {
  const isPete = username?.toLowerCase() === "pete";

  const { today: todayLocalStr, yesterday: yesterdayLocalStr, nextDays: nextFiveDays } =
    useMemo(() => buildQuickDateRange(5), []);

  function renderButton(label: string, dayStr: string): ReactElement {
    const isSelected = selectedDate === dayStr;
    return (
      <Button
        key={dayStr}
        onClick={() => onDateChange(dayStr)}
        className={`
          px-4 py-2 border rounded text-sm font-medium w-100px text-center
          transition-colors
          ${
            isSelected
              ? "bg-primary-main text-primary-fg border-primary-main dark:bg-darkAccentGreen dark:text-darkBg dark:border-darkAccentGreen"
              : "bg-surface text-foreground border-border-2 hover:bg-surface-2 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface"
          }
        `}
      >
        {label}
      </Button>
    );
  }

  const daySelectors = (
    <div className="flex items-center flex-wrap gap-2">
      {renderButton("Yesterday", yesterdayLocalStr)}
      {renderButton("Today", todayLocalStr)}
      {nextFiveDays.map((dayStr) => {
        const shortLabel = getWeekdayShortLabel(dayStr);
        return renderButton(shortLabel, dayStr);
      })}
    </div>
  );

  // For Pete only: display a popup calendar
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isCalendarOpen &&
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        toggleRef.current &&
        !toggleRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCalendarOpen]);

  const defaultNames = getDefaultClassNames();

  let toggleAndCalendar: ReactElement | null = null;
  if (isPete) {
    toggleAndCalendar = (
      <div className="relative">
        <Button
          ref={toggleRef}
          className="px-3 py-2 border rounded focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main text-sm"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
        >
          {selectedDate || "Select a date"}
        </Button>
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute z-10 mt-2"
            style={{ top: "100%", right: 0 }}
          >
            <DayPicker
              mode="single"
              selected={parseLocalDate(selectedDate)}
              onSelect={(selectedDay) => {
                if (selectedDay) {
                  // Convert the selected day to local YYYY-MM-DD
                  const newDateStr = formatDateForInput(selectedDay);
                  // If changed, call onDateChange
                  if (newDateStr !== selectedDate) {
                    onDateChange(newDateStr);
                  }
                }
                setIsCalendarOpen(false);
              }}
              classNames={{
                root: `${defaultNames.root} bg-surface shadow-lg p-5 rounded dark:bg-darkSurface dark:text-darkAccentGreen`,
                today: "border-warning-border",
                selected: "bg-warning text-primary-fg",
                chevron: `${defaultNames.chevron} fill-warning`,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative pb-5">
      <div className="flex items-center gap-2">
        {daySelectors}
        {toggleAndCalendar}
      </div>
    </div>
  );
}

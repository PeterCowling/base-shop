/* File: src/components/prepare/DateSelectorPP.tsx */
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

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
      <button
        key={dayStr}
        onClick={() => onDateChange(dayStr)}
        className={`
          px-4 py-2 border rounded text-sm font-medium w-[100px] text-center
          transition-colors
          ${
            isSelected
              ? "bg-primary-main text-white border-primary-main dark:bg-darkAccentGreen dark:text-darkBg dark:border-darkAccentGreen"
              : "bg-white text-gray-700 border-gray-400 hover:bg-gray-100 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface"
          }
        `}
      >
        {label}
      </button>
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
        <button
          ref={toggleRef}
          className="px-3 py-2 border rounded focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main text-sm"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
        >
          {selectedDate || "Select a date"}
        </button>
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
                root: `${defaultNames.root} bg-white shadow-lg p-5 rounded dark:bg-darkSurface dark:text-darkAccentGreen`,
                today: "border-amber-500",
                selected: "bg-amber-500 border-amber-500 text-white",
                chevron: `${defaultNames.chevron} fill-amber-500`,
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

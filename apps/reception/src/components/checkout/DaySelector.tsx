import type { ReactElement } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

// Import your existing date utilities
import {
  buildQuickDateRange,
  formatDateForInput,
  parseDate,
  getWeekdayShortLabel,
} from "../../utils/dateUtils";

interface DateSelectorProps {
  selectedDate: string; // "YYYY-MM-DD"
  onDateChange: (date: string) => void;
  username?: string;
}

/**
 * A quick-select + optional calendar for picking a date.
 */
function DateSelector({
  selectedDate,
  onDateChange,
  username,
}: DateSelectorProps): ReactElement {
  const isPete = username?.toLowerCase() === "pete";

  const { today, yesterday, nextDays: nextFiveDays } = useMemo(
    () => buildQuickDateRange(5),
    [],
  );

  /**
   * Renders a button for quickly selecting a date.
   * Uses a callback to avoid unnecessary re-renders.
   */
  const renderButton = useCallback(
    (label: string, day: string): ReactElement => {
      const isSelected = selectedDate === day;
      return (
        <button
          key={day}
          className={`
            px-4 py-2 border rounded text-sm font-medium w-[100px] text-center transition-colors
            ${
              isSelected
                ? "bg-primary-main text-white border-primary-main dark:bg-darkAccentGreen dark:text-darkBg dark:border-darkAccentGreen"
                : "bg-white text-gray-700 border-gray-400 hover:bg-gray-100 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface"
            }
          `}
          onClick={() => onDateChange(day)}
        >
          {label}
        </button>
      );
    },
    [selectedDate, onDateChange]
  );

  /**
   * Render the quick date selection buttons (yesterday, today, plus next 5 days).
   */
  const daySelectors: ReactElement = (
    <div className="flex items-center flex-wrap gap-2">
      {renderButton("Yesterday", yesterday)}
      {renderButton("Today", today)}
      {nextFiveDays.map((day) => {
        // Label is the weekday abbreviation, e.g., "Mon", "Tue"
        const shortLabel = getWeekdayShortLabel(day);
        return renderButton(shortLabel, day);
      })}
    </div>
  );

  // For "pete": show an optional toggleable calendar
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /**
   * Close the calendar if the user clicks outside of it.
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isCalendarOpen) {
        if (
          calendarRef.current &&
          !calendarRef.current.contains(event.target as Node) &&
          toggleRef.current &&
          !toggleRef.current.contains(event.target as Node)
        ) {
          setIsCalendarOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  /**
   * Use default class names from react-day-picker, but override some of them.
   */
  const defaultNames = getDefaultClassNames();

  /**
   * If the user is "Pete", we render a button and calendar popup for date selection.
   */
  let toggleAndCalendar: ReactElement | null = null;
  if (isPete) {
    toggleAndCalendar = (
      <div className="relative">
        <button
          ref={toggleRef}
          className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary-main text-sm"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
        >
          {selectedDate || "Select a date"}
        </button>
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute z-50 mt-2 bg-white shadow-lg rounded p-5 dark:bg-darkSurface"
            style={{ top: "100%", right: 0 }}
          >
            <DayPicker
              mode="single"
              selected={parseDate(selectedDate)}
              onSelect={(date) => {
                if (date) {
                  const newDate = formatDateForInput(date);
                  if (newDate !== selectedDate) {
                    onDateChange(newDate);
                  }
                }
                setIsCalendarOpen(false);
              }}
              classNames={{
                root: defaultNames.root,
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

  // The final layout, combining quick selectors and the optional calendar.
  return (
    <div className="relative pb-5 bg-gray-50 rounded border border-gray-400 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface">
      <div className="flex items-center gap-2">
        {daySelectors}
        {toggleAndCalendar}
      </div>
    </div>
  );
}

export default memo(DateSelector);

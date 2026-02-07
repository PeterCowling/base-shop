// src/components/checkins/DateSelectorCI.tsx

import type { ReactElement } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import {
  addDays,
  buildQuickDateRange,
  formatDateForInput,
  getWeekdayShortLabel,
  parseDate,
} from "../../utils/dateUtils";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  username?: string;
}

/**
 * DateSelector:
 * - Quick-select for Today and upcoming days.
 *   - Pete sees Yesterday and the next five days.
 *   - All others are limited to Today and Tomorrow.
 * - If username is "pete" or "peter" show an unrestricted DayPicker
 * - If username is "serena" show a DayPicker limited to tomorrow
 */
export default function DateSelector({
  selectedDate,
  onDateChange,
  username,
}: DateSelectorProps): ReactElement {
  const lowerName = username?.toLowerCase();
  const isPete = lowerName === "pete" || lowerName === "peter";
  const isSerena = lowerName === "serena";

  // Quick selectors
  const daysAhead = isPete ? 5 : 1;
  const { today, yesterday, nextDays } = useMemo(
    () => buildQuickDateRange(daysAhead),
    [daysAhead],
  );

  const handleQuickSelect = useCallback(
    (day: string) => {
      onDateChange(day);
    },
    [onDateChange],
  );

  const renderButton = useCallback(
    (label: string, day: string): ReactElement => {
      const isSelected = selectedDate === day;
      return (
        <button
          key={day}
          className={`
            px-4 py-2 border rounded text-sm font-medium w-[100px] text-center
            transition-colors
            ${
              isSelected
                ? "bg-primary-main text-white border-primary-main"
                : "bg-white text-gray-700 border-gray-400 hover:bg-gray-100 dark:bg-darkSurface dark:text-darkAccentGreen dark:border-darkSurface dark:hover:bg-darkSurface/70"
            }
          `}
          onClick={() => handleQuickSelect(day)}
        >
          {label}
        </button>
      );
    },
    [handleQuickSelect, selectedDate],
  );

  const daySelectors = useMemo(
    () => (
      <div className="flex items-center flex-wrap gap-2">
        {isPete && renderButton("Yesterday", yesterday)}
        {renderButton("Today", today)}
        {nextDays.map((day) => {
          const shortLabel = getWeekdayShortLabel(day);
          return renderButton(shortLabel, day);
        })}
      </div>
    ),
    [
      today,
      yesterday,
      isPete,
      nextDays,
      renderButton,
    ],
  );

  // DayPicker toggle logic (Pete/Serena)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

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

  const handleToggleCalendar = useCallback(() => {
    setIsCalendarOpen((prev) => !prev);
  }, []);

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
    [onDateChange, selectedDate],
  );

  const calendarDropdownStyle = useMemo(
    () => ({ top: "100%", right: 0 }),
    [],
  );

  // Extend default DayPicker class names
  const defaultNames = getDefaultClassNames();

  const parsedToday = useMemo(() => parseDate(today), [today]);

  let toggleAndCalendar: ReactElement | null = null;
  if (isPete || isSerena) {
    toggleAndCalendar = (
      <div className="relative">
        <button
          ref={toggleRef}
          className="px-3 py-2 border rounded focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main text-sm"
          onClick={handleToggleCalendar}
        >
          {selectedDate ? formatDateForInput(selectedDate) : "Select a date"}
        </button>
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute z-10 mt-2"
            style={calendarDropdownStyle}
          >
            <DayPicker
              mode="single"
              selected={parseDate(selectedDate)}
              onSelect={handleDayPickerSelect}
              {...(isSerena
                ? {
                    fromDate: parsedToday,
                    toDate: parsedToday
                      ? addDays(parsedToday, 1)
                      : undefined,
                  }
                : {})}
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

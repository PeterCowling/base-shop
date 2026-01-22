/**
 * File: /Users/petercowling/reception/src/components/checkins/DateSel.tsx
 */
import {
  memo,
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

import {
  buildQuickDateRange,
  formatDateForInput,
  getWeekdayShortLabel,
  parseDate,
} from "../../utils/dateUtils";

/**
 * Props for the DateSel component.
 */
interface DateSelProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  username?: string;
}

/**
 * Renders a row of quick date-select buttons (Yesterday, Today, +5 days ahead)
 * and, if `username` is "Pete", a DayPicker calendar for custom selection.
 */
function DateSel({
  selectedDate,
  onDateChange,
  username,
}: DateSelProps): ReactElement {
  const isPete = username?.toLowerCase() === "pete";

  const { today, yesterday, nextDays: nextFiveDays } = useMemo(
    () => buildQuickDateRange(5),
    [],
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
          onClick={() => onDateChange(day)}
        >
          {label}
        </button>
      );
    },
    [onDateChange, selectedDate]
  );

  const daySelectors = useMemo(() => {
    return (
      <div className="flex items-center flex-wrap gap-2">
        {renderButton("Yesterday", yesterday)}
        {renderButton("Today", today)}
        {nextFiveDays.map((day) => {
          const shortLabel = getWeekdayShortLabel(day);
          return renderButton(shortLabel, day);
        })}
      </div>
    );
  }, [yesterday, today, nextFiveDays, renderButton]);

  // Pete-only DayPicker
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  const defaultNames = getDefaultClassNames();

  const toggleAndCalendar = useMemo<ReactElement | null>(() => {
    if (!isPete) return null;
    return (
      <div className="relative">
        <button
          ref={toggleRef}
          className="px-3 py-2 border rounded focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main text-sm"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
        >
          {selectedDate ? formatDateForInput(selectedDate) : "Select a date"}
        </button>
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute z-10 mt-2"
            style={{ top: "100%", right: 0 }}
          >
            <DayPicker
              mode="single"
              selected={parseDate(selectedDate)}
              onSelect={(date) => {
                if (date) {
                  const newDate = formatDateForInput(date);
                  if (newDate !== formatDateForInput(selectedDate)) {
                    onDateChange(newDate);
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
  }, [isCalendarOpen, isPete, onDateChange, selectedDate, defaultNames]);

  return (
    <div className="relative pb-5">
      <div className="flex items-center gap-2">
        {daySelectors}
        {toggleAndCalendar}
      </div>
    </div>
  );
}

export default memo(DateSel);

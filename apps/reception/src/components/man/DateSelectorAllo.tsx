/* File: /src/components/checkins/DateSelectorCI.tsx
   Comment: Revised to include the test mode toggle on the far right, 
            only visible if the user is Pete. Test mode state is managed 
            in the parent (Allogharti) and passed as props. This component 
            controls changes to it but does not own the state.
*/

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";

// We'll derive the logged-in user from AuthContext.
import { useAuth } from "../../context/AuthContext";
import {
  buildQuickDateRange,
  formatDateForInput,
  getWeekdayShortLabel,
  parseDate,
} from "../../utils/dateUtils";

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  testMode: boolean;
  onTestModeChange: (val: boolean) => void;
}

export default function DateSelectorCI({
  selectedDate,
  onDateChange,
  testMode,
  onTestModeChange,
}: DateSelectorProps): ReactElement {
  // Check if current user is Pete
  const { user } = useAuth();
  const isPete = user?.user_name === "Pete";

  // Quick-select references
  const { today, yesterday, nextDays: nextFiveDays } = useMemo(
    () => buildQuickDateRange(5),
    [],
  );

  function renderButton(label: string, day: string): ReactElement {
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
  }

  const daySelectors = (
    <>
      {renderButton("Yesterday", yesterday)}
      {renderButton("Today", today)}
      {nextFiveDays.map((day) => {
        const shortLabel = getWeekdayShortLabel(day);
        return renderButton(shortLabel, day);
      })}
    </>
  );

  // DayPicker toggle logic (Pete-only)
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

  // Extend default DayPicker class names
  const defaultNames = getDefaultClassNames();

  let datePickerToggle: ReactElement | null = null;
  if (isPete) {
    datePickerToggle = (
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
  }

  return (
    <div className="relative pb-5">
      {/* A single-row flex: quick-date buttons + daypicker + test-mode toggle */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {daySelectors}
          {datePickerToggle}
        </div>

        {/* Show test mode toggle on far right, but only if user is Pete */}
        {isPete && (
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => onTestModeChange(e.target.checked)}
            />
            <span>Test Mode?</span>
          </label>
        )}
      </div>
    </div>
  );
}

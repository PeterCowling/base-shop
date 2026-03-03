/* File: /src/components/checkins/DateSelectorCI.tsx
   Comment: Revised to include the test mode toggle on the far right, 
            only visible if the user is Pete. Test mode state is managed 
            in the parent (Allogharti) and passed as props. This component 
            controls changes to it but does not own the state.
*/

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

// We'll derive the logged-in user from AuthContext.
import { useAuth } from "../../context/AuthContext";
import { isPrivileged } from "../../lib/roles";
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
  const { user } = useAuth();
  const privileged = isPrivileged(user ?? null);

  // Quick-select references
  const { today, yesterday, nextDays: nextFiveDays } = useMemo(
    () => buildQuickDateRange(5),
    [],
  );

  function renderButton(label: string, day: string): ReactElement {
    const isSelected = selectedDate === day;
    return (
      <Button
        key={day}
        color={isSelected ? "primary" : "default"}
        tone={isSelected ? "solid" : "outline"}
        size="sm"
        onClick={() => onDateChange(day)}
      >
        {label}
      </Button>
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

  let datePickerToggle: ReactElement | null = null;
  if (privileged) {
    datePickerToggle = (
      <div className="relative">
        <Button
          ref={toggleRef}
          color="default"
          tone="outline"
          size="sm"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
        >
          {selectedDate ? formatDateForInput(selectedDate) : "Select a date"}
        </Button>
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
                root: "bg-surface border border-border-strong rounded-lg shadow-lg p-4 text-foreground",
                months: "relative",
                month: "space-y-3",
                month_caption: "flex items-center justify-center h-9",
                caption_label: "text-sm font-semibold text-foreground",
                nav: "absolute top-0 inset-x-0 flex justify-between",
                button_previous: "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
                button_next: "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
                chevron: "w-4 h-4 fill-current",
                month_grid: "border-collapse",
                weekdays: "flex",
                weekday: "flex h-9 w-9 items-center justify-center text-xs font-medium text-muted-foreground",
                weeks: "space-y-1 mt-1",
                week: "flex",
                day: "p-0",
                day_button: "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-foreground hover:bg-surface-2 transition-colors cursor-pointer",
                today: "font-bold text-warning",
                selected: "bg-warning text-primary-fg hover:bg-warning",
                outside: "opacity-30",
                disabled: "opacity-25 cursor-not-allowed",
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
        <Inline wrap={false} gap={2}>
          {daySelectors}
          {datePickerToggle}
        </Inline>

        {/* Show test mode toggle on far right, but only if user is Pete */}
        {privileged && (
          <label className="inline-flex items-center space-x-2">
            <Input compatibilityMode="no-wrapper"
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

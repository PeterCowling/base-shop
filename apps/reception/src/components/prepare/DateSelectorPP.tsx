/* File: src/components/prepare/DateSelectorPP.tsx */
import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

import { Button } from "@acme/design-system/atoms";
import { Cluster, Inline } from "@acme/design-system/primitives";

import { useAuth } from "../../context/AuthContext";
import { isPrivileged } from "../../lib/roles";
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
  username: _username,
}: DateSelectorProps): ReactElement {
  const { user } = useAuth();
  const isPete = isPrivileged(user ?? null);

  const { today: todayLocalStr, yesterday: yesterdayLocalStr, nextDays: nextFiveDays } =
    useMemo(() => buildQuickDateRange(5), []);

  function renderButton(label: string, dayStr: string): ReactElement {
    const isSelected = selectedDate === dayStr;
    return (
      <Button
        key={dayStr}
        onClick={() => onDateChange(dayStr)}
        color={isSelected ? "primary" : "default"}
        tone={isSelected ? "solid" : "outline"}
        size="sm"
      >
        {label}
      </Button>
    );
  }

  const daySelectors = (
    <Cluster gap={2}>
      {renderButton("Yesterday", yesterdayLocalStr)}
      {renderButton("Today", todayLocalStr)}
      {nextFiveDays.map((dayStr) => {
        const shortLabel = getWeekdayShortLabel(dayStr);
        return renderButton(shortLabel, dayStr);
      })}
    </Cluster>
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

  let toggleAndCalendar: ReactElement | null = null;
  if (isPete) {
    toggleAndCalendar = (
      <div className="relative">
        <Button
          ref={toggleRef}
          color="default"
          tone="outline"
          size="sm"
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
      <Inline wrap={false} gap={2}>
        {daySelectors}
        {toggleAndCalendar}
      </Inline>
    </div>
  );
}

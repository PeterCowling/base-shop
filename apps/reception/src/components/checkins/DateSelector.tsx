// src/components/checkins/DateSelectorCI.tsx

import type { ReactElement } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DayPicker } from "react-day-picker";

import { Button } from "@acme/design-system/atoms";
import { Inline } from "@acme/design-system/primitives";

import { useAuth } from "../../context/AuthContext";
import { canAccess, isPrivileged, Permissions } from "../../lib/roles";
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
}

/**
 * DateSelector:
 * - Quick-select for Today and upcoming days.
 *   - Privileged users (owner/developer) see Yesterday and the next five days.
 *   - All others are limited to Today and Tomorrow.
 * - Privileged users see an unrestricted DayPicker.
 * - Admin/manager users see a DayPicker limited to today + tomorrow.
 */
export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps): ReactElement {
  const { user } = useAuth();
  const privileged = isPrivileged(user ?? null);
  const canAccessRestrictedCalendar = canAccess(
    user ?? null,
    Permissions.RESTRICTED_CALENDAR_ACCESS,
  );

  // Quick selectors
  const daysAhead = privileged ? 5 : 1;
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
        <Button
          key={day}
          className={`
            px-4 py-2 border rounded-lg text-sm font-medium w-100px text-center
            transition-colors
            ${
              isSelected
                ? "bg-primary-main text-primary-fg border-primary-main"
                : "bg-surface text-foreground border-border-strong hover:bg-surface-2"
            }
          `}
          onClick={() => handleQuickSelect(day)}
        >
          {label}
        </Button>
      );
    },
    [handleQuickSelect, selectedDate],
  );


  // DayPicker toggle logic (privileged = unrestricted; admin/manager = restricted to tomorrow)
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

  const parsedToday = useMemo(() => parseDate(today), [today]);

  let toggleAndCalendar: ReactElement | null = null;
  if (canAccessRestrictedCalendar) {
    toggleAndCalendar = (
      <div className="relative">
        <Button
          ref={toggleRef}
          className="px-3 py-2 border rounded-lg focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary-main text-sm"
          onClick={handleToggleCalendar}
        >
          {selectedDate ? formatDateForInput(selectedDate) : "Select a date"}
        </Button>
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
              {...(!privileged
                ? {
                    fromDate: parsedToday,
                    toDate: parsedToday
                      ? addDays(parsedToday, 1)
                      : undefined,
                  }
                : {})}
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
                today: "font-bold text-primary-main/100",
                selected: "bg-primary-main/100 text-primary-fg/100 hover:bg-primary-main/100",
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
    <Inline gap={2}>
      {privileged && renderButton("Yesterday", yesterday)}
      {renderButton("Today", today)}
      {nextDays.map((day) => renderButton(getWeekdayShortLabel(day), day))}
      {toggleAndCalendar}
    </Inline>
  );
}

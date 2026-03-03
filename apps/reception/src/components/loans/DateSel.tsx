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
import { DayPicker } from "react-day-picker";

import { Button } from "@acme/design-system/atoms";
import { Cluster, Inline } from "@acme/design-system/primitives";

import { useAuth } from "../../context/AuthContext";
import { isPrivileged } from "../../lib/roles";
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
  username: _username,
}: DateSelProps): ReactElement {
  const { user } = useAuth();
  const privileged = isPrivileged(user ?? null);

  const { today, yesterday, nextDays: nextFiveDays } = useMemo(
    () => buildQuickDateRange(5),
    [],
  );

  const renderButton = useCallback(
    (label: string, day: string): ReactElement => {
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
    },
    [onDateChange, selectedDate]
  );

  const daySelectors = useMemo(() => {
    return (
      <Cluster gap={2}>
        {renderButton("Yesterday", yesterday)}
        {renderButton("Today", today)}
        {nextFiveDays.map((day) => {
          const shortLabel = getWeekdayShortLabel(day);
          return renderButton(shortLabel, day);
        })}
      </Cluster>
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

  const toggleAndCalendar = useMemo<ReactElement | null>(() => {
    if (!privileged) return null;
    return (
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
  }, [isCalendarOpen, privileged, onDateChange, selectedDate]);

  return (
    <div className="relative pb-5">
      <Inline wrap={false} gap={2}>
        {daySelectors}
        {toggleAndCalendar}
      </Inline>
    </div>
  );
}

export default memo(DateSel);

/**
 * File: /Users/petercowling/reception/src/components/checkins/DateSel.tsx
 */
/* eslint-disable ds/no-raw-tailwind-color -- calendar accent colors for DayPicker component [REC-09] */
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

import { Button } from "@acme/design-system/atoms";
import { Cluster, Inline } from "@acme/design-system/primitives";

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

  const defaultNames = getDefaultClassNames();

  const toggleAndCalendar = useMemo<ReactElement | null>(() => {
    if (!isPete) return null;
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
                root: `${defaultNames.root} bg-surface shadow-lg p-5 rounded`,
                today: "border-amber-500",
                selected: "bg-amber-500 border-amber-500 text-primary-fg",
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
      <Inline wrap={false} gap={2}>
        {daySelectors}
        {toggleAndCalendar}
      </Inline>
    </div>
  );
}

export default memo(DateSel);

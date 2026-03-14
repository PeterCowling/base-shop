import type { ReactElement } from "react";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DayPicker } from "react-day-picker";

import { Input } from "@acme/design-system";
import { Button } from "@acme/design-system/atoms";
import { Cluster, Inline, Stack } from "@acme/design-system/primitives";

import { useAuth } from "../../context/AuthContext";
import { canAccess, isPrivileged, Permissions } from "../../lib/roles";
import {
  addDays,
  buildQuickDateRange,
  formatDateForInput,
  getWeekdayShortLabel,
  parseLocalDate,
} from "../../utils/dateUtils";

function formatCalendarLabel(dateStr: string): string {
  if (!dateStr) return "Select a date";
  const d = parseLocalDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

export const DAY_PICKER_CLASS_NAMES_WARNING = {
  root: "bg-surface border border-border-strong rounded-lg shadow-lg p-4 text-foreground",
  months: "relative",
  month: "space-y-3",
  month_caption: "flex items-center justify-center h-9",
  caption_label: "text-sm font-semibold text-foreground",
  nav: "absolute top-0 inset-x-0 flex justify-between",
  button_previous:
    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
  button_next:
    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
  chevron: "w-4 h-4 fill-current",
  month_grid: "border-collapse",
  weekdays: "flex",
  weekday:
    "flex h-9 w-9 items-center justify-center text-xs font-medium text-muted-foreground",
  weeks: "space-y-1 mt-1",
  week: "flex",
  day: "p-0",
  day_button:
    "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-foreground hover:bg-surface-2 transition-colors cursor-pointer",
  today: "font-bold text-warning",
  selected: "bg-warning text-warning-fg hover:bg-warning",
  outside: "opacity-30",
  disabled: "opacity-25 cursor-not-allowed",
} as const;

export const DAY_PICKER_CLASS_NAMES_PRIMARY = {
  root: "bg-surface border border-border-strong rounded-lg shadow-lg p-4 text-foreground",
  months: "relative",
  month: "space-y-3",
  month_caption: "flex items-center justify-center h-9",
  caption_label: "text-sm font-semibold text-foreground",
  nav: "absolute top-0 inset-x-0 flex justify-between",
  button_previous:
    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
  button_next:
    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors",
  chevron: "w-4 h-4 fill-current",
  month_grid: "border-collapse",
  weekdays: "flex",
  weekday:
    "flex h-9 w-9 items-center justify-center text-xs font-medium text-muted-foreground",
  weeks: "space-y-1 mt-1",
  week: "flex",
  day: "p-0",
  day_button:
    "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium text-foreground hover:bg-surface-2 transition-colors cursor-pointer",
  today: "font-bold text-primary-main",
  selected: "bg-primary-main text-primary-fg hover:bg-primary-main",
  outside: "opacity-30",
  disabled: "opacity-25 cursor-not-allowed",
} as const;

export interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  accessMode?:
    | "unrestricted"
    | "privileged-calendar"
    | "role-aware-calendar";
  calendarPlacement?: "popup" | "inline";
  calendarColorVariant?: "warning" | "primary";
  nonPrivQuickDays?: number;
  /**
   * Number of future quick-day shortcut buttons to show.
   * Only applies when accessMode is "unrestricted". Defaults to 5.
   */
  quickDays?: number;
  showYesterday?: boolean;
  testMode?: boolean;
  onTestModeChange?: (val: boolean) => void;
  /** @deprecated - kept for backwards compatibility; not used internally */
  username?: string;
}

function DateSelector({
  selectedDate,
  onDateChange,
  accessMode = "privileged-calendar",
  calendarPlacement = "popup",
  calendarColorVariant = "warning",
  nonPrivQuickDays = 1,
  quickDays: quickDaysProp = 5,
  showYesterday = true,
  testMode,
  onTestModeChange,
  username: _username,
}: DateSelectorProps): ReactElement {
  const { user } = useAuth();

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isInlineCalendar = calendarPlacement === "inline";

  const privilegeState = useMemo(() => {
    if (accessMode === "unrestricted") {
      return {
        privileged: false,
        canUseCalendar: true,
        quickDays: quickDaysProp,
        showYesterdayButton: true,
      };
    }

    const privileged = isPrivileged(user ?? null);

    if (accessMode === "role-aware-calendar") {
      return {
        privileged,
        canUseCalendar: canAccess(
          user ?? null,
          Permissions.RESTRICTED_CALENDAR_ACCESS,
        ),
        quickDays: privileged ? 5 : nonPrivQuickDays,
        showYesterdayButton: privileged,
      };
    }

    return {
      privileged,
      canUseCalendar: privileged,
      quickDays: 5,
      showYesterdayButton: showYesterday,
    };
  }, [accessMode, nonPrivQuickDays, quickDaysProp, showYesterday, user]);

  const { privileged, canUseCalendar, quickDays, showYesterdayButton } =
    privilegeState;

  const { today, yesterday, nextDays } = useMemo(
    () => buildQuickDateRange(quickDays),
    [quickDays],
  );

  const parsedSelectedDate = useMemo(
    () => parseLocalDate(selectedDate),
    [selectedDate],
  );
  const parsedToday = useMemo(() => parseLocalDate(today), [today]);
  const calendarDropdownStyle = useMemo(() => ({ top: "100%", right: 0 }), []);
  const dayPickerClassNames =
    calendarColorVariant === "primary"
      ? DAY_PICKER_CLASS_NAMES_PRIMARY
      : DAY_PICKER_CLASS_NAMES_WARNING;

  const calendarRangeProps = useMemo(() => {
    if (accessMode !== "role-aware-calendar" || privileged) {
      return {};
    }

    return {
      fromDate: parsedToday,
      toDate: parsedToday ? addDays(parsedToday, 1) : undefined,
    };
  }, [accessMode, parsedToday, privileged]);

  const showTestModeToggle = Boolean(
    privileged && testMode !== undefined && onTestModeChange,
  );

  useEffect(() => {
    if (!isCalendarOpen || isInlineCalendar) {
      return undefined;
    }

    function handleClickOutside(event: MouseEvent) {
      if (
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
  }, [isCalendarOpen, isInlineCalendar]);

  const handleQuickSelect = useCallback(
    (day: string) => {
      onDateChange(day);
    },
    [onDateChange],
  );

  const handleToggleCalendar = useCallback(() => {
    setIsCalendarOpen((prev) => !prev);
  }, []);

  const handleDayPickerSelect = useCallback(
    (date?: Date) => {
      if (date) {
        const newDate = formatDateForInput(date);
        if (newDate !== selectedDate) {
          onDateChange(newDate);
        }
      }
      setIsCalendarOpen(false);
    },
    [onDateChange, selectedDate],
  );

  const handleTestModeInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onTestModeChange?.(event.target.checked);
    },
    [onTestModeChange],
  );

  const renderQuickButton = useCallback(
    (label: string, day: string, showDateSub = false): ReactElement => {
      const isSelected = selectedDate === day;
      const dateSub = showDateSub ? day.slice(5).replace("-", "/") : null;

      if (isInlineCalendar) {
        return (
          <Button
            key={day}
            className={`px-4 py-2 border rounded-lg text-sm font-medium text-center transition-colors ${
              isSelected
                ? "bg-primary-main text-primary-fg border-primary-main"
                : "bg-surface text-foreground border-border-strong hover:bg-surface-2"
            }`}
            onClick={() => handleQuickSelect(day)}
          >
            {dateSub ? (
              <span className="flex flex-col items-center leading-tight gap-0.5">
                <span>{label}</span>
                <span className="text-xs opacity-70">{dateSub}</span>
              </span>
            ) : label}
          </Button>
        );
      }

      return (
        <Button
          key={day}
          color={isSelected ? "primary" : "default"}
          tone={isSelected ? "solid" : "outline"}
          size="sm"
          onClick={() => handleQuickSelect(day)}
        >
          {dateSub ? (
            <span className="flex flex-col items-center leading-tight gap-0.5">
              <span>{label}</span>
              <span className="text-xs opacity-70">{dateSub}</span>
            </span>
          ) : label}
        </Button>
      );
    },
    [handleQuickSelect, isInlineCalendar, selectedDate],
  );

  const quickButtons = useMemo(
    () => (
      <>
        {showYesterdayButton ? renderQuickButton("Yesterday", yesterday) : null}
        {renderQuickButton("Today", today)}
        {nextDays.map((day) => renderQuickButton(getWeekdayShortLabel(day), day, true))}
      </>
    ),
    [nextDays, renderQuickButton, showYesterdayButton, today, yesterday],
  );

  const calendarToggle = useMemo((): ReactElement | null => {
    if (!canUseCalendar) {
      return null;
    }

    if (isInlineCalendar) {
      return (
        <Button
          ref={toggleRef}
          aria-label="Open calendar"
          aria-expanded={isCalendarOpen}
          className={`shrink-0 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            isCalendarOpen
              ? "bg-primary-main text-primary-fg border-primary-main"
              : "bg-surface text-foreground border-border-strong hover:bg-surface-2"
          }`}
          onClick={handleToggleCalendar}
        >
          {formatCalendarLabel(selectedDate)}
        </Button>
      );
    }

    return (
      <div className="relative">
        <Button
          ref={toggleRef}
          aria-label="Open calendar"
          aria-expanded={isCalendarOpen}
          color="default"
          tone="outline"
          size="sm"
          onClick={handleToggleCalendar}
        >
          {formatCalendarLabel(selectedDate)}
        </Button>
        {isCalendarOpen ? (
          <div
            ref={calendarRef}
            className="absolute z-10 mt-2"
            style={calendarDropdownStyle}
          >
            <DayPicker
              aria-label="Date picker"
              mode="single"
              selected={parsedSelectedDate}
              onSelect={handleDayPickerSelect}
              classNames={dayPickerClassNames}
              {...calendarRangeProps}
            />
          </div>
        ) : null}
      </div>
    );
  }, [
    calendarDropdownStyle,
    calendarRangeProps,
    canUseCalendar,
    dayPickerClassNames,
    handleDayPickerSelect,
    handleToggleCalendar,
    isCalendarOpen,
    isInlineCalendar,
    parsedSelectedDate,
    selectedDate,
  ]);

  const inlineCalendar = useMemo((): ReactElement | null => {
    if (!isInlineCalendar || !isCalendarOpen || !canUseCalendar) {
      return null;
    }

    return (
      <div className="border-t border-border-strong pt-3 flex justify-end">
        <DayPicker
          aria-label="Date picker"
          mode="single"
          selected={parsedSelectedDate}
          onSelect={handleDayPickerSelect}
          classNames={dayPickerClassNames}
          {...calendarRangeProps}
        />
      </div>
    );
  }, [
    calendarRangeProps,
    canUseCalendar,
    dayPickerClassNames,
    handleDayPickerSelect,
    isCalendarOpen,
    isInlineCalendar,
    parsedSelectedDate,
  ]);

  const testModeToggle = useMemo((): ReactElement | null => {
    if (!showTestModeToggle) {
      return null;
    }

    return (
      <label className="inline-flex items-center space-x-2">
        <Input
          compatibilityMode="no-wrapper"
          type="checkbox"
          checked={testMode}
          onChange={handleTestModeInputChange}
        />
        <span>Test Mode?</span>
      </label>
    );
  }, [handleTestModeInputChange, showTestModeToggle, testMode]);

  if (isInlineCalendar) {
    return (
      <Stack gap={3} className="px-4 py-3 bg-surface-2 rounded-lg border border-border-strong">
        <Cluster justify="between" gap={4}>
          <Cluster gap={2}>{quickButtons}</Cluster>
          <Inline gap={2} alignY="center">
            {calendarToggle}
            {testModeToggle}
          </Inline>
        </Cluster>
        {inlineCalendar}
      </Stack>
    );
  }

  return (
    <div className="relative pb-5">
      {showTestModeToggle ? (
        <Cluster justify="between">
          <Inline wrap={false} gap={2}>
            <Cluster gap={2}>{quickButtons}</Cluster>
            {calendarToggle}
          </Inline>
          {testModeToggle}
        </Cluster>
      ) : (
        <Inline wrap={false} gap={2}>
          <Cluster gap={2}>{quickButtons}</Cluster>
          {calendarToggle}
        </Inline>
      )}
    </div>
  );
}

export default memo(DateSelector);

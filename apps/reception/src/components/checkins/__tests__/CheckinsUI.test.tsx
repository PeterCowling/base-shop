import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var addActivityMock: ReturnType<typeof vi.fn>;
var removeLastActivityMock: ReturnType<typeof vi.fn>;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
vi.mock("../../../hooks/mutations/useActivitiesMutations", () => {
  addActivityMock = vi.fn();
  removeLastActivityMock = vi.fn();
  return {
    default: () => ({
      addActivity: addActivityMock,
      removeLastActivity: removeLastActivityMock,
      loading: false,
    }),
  };
});

vi.mock("react-day-picker", () => ({
  DayPicker: ({
    onSelect,
    classNames,
  }: {
    onSelect?: (d: Date) => void;
    classNames?: { root?: string };
  }) => (
    <div data-testid="daypicker" className={classNames?.root}>
      <button onClick={() => onSelect?.(new Date("2025-01-05"))}>pick</button>
    </div>
  ),
  getDefaultClassNames: () => ({ root: "", chevron: "" }),
}));

/* ------------------------------------------------------------------ */
/*  Components under test                                             */
/* ------------------------------------------------------------------ */
import DateSelector from "../DateSelector";
import StatusButton from "../StatusButton";
import type { Activity } from "../../../schemas/activitySchema";

function formatDateForInput(dateStr: string): string {
  const date = new Date(dateStr);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

const baseBooking = {
  bookingRef: "BR1",
  occupantId: "O1",
  checkInDate: "2025-01-01",
  rooms: [],
  firstName: "A",
  lastName: "B",
  roomBooked: "",
  roomAllocated: "",
  activities: [] as Activity[],
  isFirstForBooking: true,
};

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe("DateSelector", () => {
  beforeEach(() => {
    // Only mock the Date object so userEvent timers still run normally
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-02T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("triggers onDateChange for quick selection", async () => {
    const onDateChange = vi.fn();
    render(
      <DateSelector selectedDate="2025-01-01" onDateChange={onDateChange} />
    );
    const todayBtn = screen.getByRole("button", { name: /today/i });
    await userEvent.click(todayBtn);
    expect(onDateChange).toHaveBeenCalledWith("2025-01-02");
  });

  it("opens calendar for Pete and selects a date", async () => {
    const onDateChange = vi.fn();
    render(
      <DateSelector
        selectedDate="2025-01-01"
        onDateChange={onDateChange}
        username="pete"
      />
    );
    // When a date is already selected the toggle displays that date
    const toggle = screen.getByRole("button", { name: "2025-01-01" });
    await userEvent.click(toggle);
    const pickBtn = screen.getByRole("button", { name: /pick/i });
    const container = screen.getByTestId("daypicker");
    expect(container.className).toContain("dark:bg-darkSurface");
    expect(container.className).toContain("dark:text-darkAccentGreen");
    await userEvent.click(pickBtn);
    const expected = formatDateForInput("2025-01-05");
    expect(onDateChange).toHaveBeenCalledWith(expected);
    expect(screen.queryByRole("button", { name: /pick/i })).not.toBeInTheDocument();
  });

  it("limits non-Pete users to today and tomorrow", () => {
    const onDateChange = vi.fn();
    render(
      <DateSelector
        selectedDate="2025-01-02"
        onDateChange={onDateChange}
        username="alex"
      />
    );
    expect(
      screen.queryByRole("button", { name: /yesterday/i })
    ).not.toBeInTheDocument();
    const tomorrowLabel = new Date("2025-01-03").toLocaleDateString("en-US", {
      weekday: "short",
    });
    expect(screen.getByRole("button", { name: /today/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: tomorrowLabel })
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});

describe("StatusButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cycles status and calls hooks", async () => {
    render(<StatusButton booking={baseBooking} />);
    const btn = screen.getByRole("button");

    await userEvent.click(btn);
    expect(addActivityMock).toHaveBeenCalledWith("O1", 23);

    await userEvent.click(btn);
    expect(addActivityMock).toHaveBeenLastCalledWith("O1", 12);

    await userEvent.click(btn);
    expect(removeLastActivityMock).toHaveBeenCalledWith("O1", 12);
  });
});

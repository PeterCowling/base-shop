import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* ------------------------------------------------------------------ */
/*  Components under test                                             */
/* ------------------------------------------------------------------ */
import type { Activity } from "../../../schemas/activitySchema";
import DateSelector from "../DateSelector";
import StatusButton from "../StatusButton";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var addActivityMock: jest.Mock;
var removeLastActivityMock: jest.Mock;
/* eslint-enable  no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
const useAuthMock = jest.fn();

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

jest.mock("../../../hooks/mutations/useActivitiesMutations", () => {
  addActivityMock = jest.fn();
  removeLastActivityMock = jest.fn();
  return {
    __esModule: true,
    default: () => ({
      addActivity: addActivityMock,
      removeLastActivity: removeLastActivityMock,
      loading: false,
    }),
  };
});

jest.mock("react-day-picker", () => ({
  DayPicker: ({
    onSelect,
    classNames,
  }: {
    onSelect?: (d: Date) => void;
    classNames?: { root?: string };
  }) => (
    <div data-cy="daypicker" className={classNames?.root}>
      <button onClick={() => onSelect?.(new Date("2025-01-05"))}>pick</button>
    </div>
  ),
  getDefaultClassNames: () => ({ root: "", chevron: "" }),
}));

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
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    // Default: staff user — no privileged access, no calendar access
    useAuthMock.mockReturnValue({
      user: { user_name: "alice", roles: ["staff"] },
    });
    // Only mock the Date object so userEvent timers still run normally
    jest.useFakeTimers({ toFake: ["Date"] });
    jest.setSystemTime(new Date("2025-01-02T00:00:00Z"));
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("triggers onDateChange for quick selection", async () => {
    const onDateChange = jest.fn();
    render(
      <DateSelector selectedDate="2025-01-01" onDateChange={onDateChange} />
    );
    const todayBtn = screen.getByRole("button", { name: /today/i });
    await user.click(todayBtn);
    expect(onDateChange).toHaveBeenCalledWith("2025-01-02");
  });

  it("opens calendar for privileged user (owner) and selects a date", async () => {
    useAuthMock.mockReturnValue({
      user: { user_name: "pete", roles: ["owner"] },
    });
    const onDateChange = jest.fn();
    render(
      <DateSelector selectedDate="2025-01-01" onDateChange={onDateChange} />
    );
    // When a date is already selected the toggle displays that date
    const toggle = screen.getByRole("button", { name: "2025-01-01" });
    await user.click(toggle);
    const pickBtn = screen.getByRole("button", { name: /pick/i });
    const container = screen.getByTestId("daypicker");
    expect(container.className).toContain("bg-surface");
    expect(container.className).not.toContain("dark:");
    await user.click(pickBtn);
    const expected = formatDateForInput("2025-01-05");
    expect(onDateChange).toHaveBeenCalledWith(expected);
    expect(screen.queryByRole("button", { name: /pick/i })).not.toBeInTheDocument();
  });

  it("shows restricted DayPicker toggle for admin/manager users", () => {
    useAuthMock.mockReturnValue({
      user: { user_name: "serena", roles: ["admin"] },
    });
    const onDateChange = jest.fn();
    render(
      <DateSelector selectedDate="2025-01-02" onDateChange={onDateChange} />
    );
    // Admin/manager users see the calendar toggle but not the Yesterday button
    expect(
      screen.queryByRole("button", { name: /yesterday/i })
    ).not.toBeInTheDocument();
    // The calendar toggle button should be present (displays selected date)
    expect(
      screen.getByRole("button", { name: "2025-01-02" })
    ).toBeInTheDocument();
  });

  it("limits staff users to today and tomorrow (no calendar toggle)", () => {
    // Default beforeEach mock: staff user
    const onDateChange = jest.fn();
    render(
      <DateSelector selectedDate="2025-01-02" onDateChange={onDateChange} />
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
    // Staff see only Today + Tomorrow (no calendar toggle)
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});

describe("StatusButton", () => {
  let user: ReturnType<typeof userEvent.setup>;
  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
  });

  it("cycles status and calls hooks", async () => {
    render(<StatusButton booking={baseBooking} />);
    const btn = screen.getByRole("button");

    await user.click(btn);
    expect(addActivityMock).toHaveBeenCalledWith("O1", 23);

    await user.click(btn);
    expect(addActivityMock).toHaveBeenLastCalledWith("O1", 12);

    await user.click(btn);
    expect(removeLastActivityMock).toHaveBeenCalledWith("O1", 12);
  });
});

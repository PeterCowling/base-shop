import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { TillShift } from "../../../types/hooks/data/tillShiftData";
import TillShiftHistory from "../TillShiftHistory";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const shiftBase: Omit<TillShift, "shiftId"> = {
  status: "closed",
  openedAt: "2026-02-01T08:00:00.000+00:00",
  openedBy: "Alice",
  openingCash: 100,
  closedAt: "2026-02-01T16:00:00.000+00:00",
  closedBy: "Alice",
  closingCash: 120,
};

const shiftA: TillShift = {
  ...shiftBase,
  id: "shift-a",
  shiftId: "SHIFT-A",
  closeDifference: -5,
};

const shiftB: TillShift = {
  ...shiftBase,
  id: "shift-b",
  shiftId: "SHIFT-B",
  openedBy: "Bob",
  closedBy: "Bob",
  closeDifference: 0,
};

const shiftC: TillShift = {
  ...shiftBase,
  id: "shift-c",
  shiftId: "SHIFT-C",
  closeDifference: 3,
};

const cashCountWithDenom = {
  user: "Alice",
  timestamp: "2026-02-01T16:05:00.000+00:00",
  type: "close" as const,
  shiftId: "SHIFT-A",
  denomBreakdown: {
    "1": 5,
    "10": 2,
  },
};

const cashCountNoDenom = {
  user: "Alice",
  timestamp: "2026-02-01T16:04:00.000+00:00",
  type: "close" as const,
  shiftId: "SHIFT-C",
};

// ---------------------------------------------------------------------------
// Mutable mock state
// ---------------------------------------------------------------------------

let mockShifts: TillShift[] = [];
let mockCashCounts: (typeof cashCountWithDenom | typeof cashCountNoDenom)[] = [];

// useTillShiftsRange is a jest.fn() so we can inspect call args in TC-08
const mockUseTillShiftsRange = jest.fn();

jest.mock("../../../hooks/data/till/useTillShiftsRange", () => ({
  useTillShiftsRange: (...args: Parameters<typeof mockUseTillShiftsRange>) =>
    mockUseTillShiftsRange(...args),
}));

jest.mock("../../../context/TillDataContext", () => ({
  __esModule: true,
  TillDataProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useTillData: () => ({
    cashCounts: mockCashCounts,
    creditSlips: [],
    transactions: [],
    isShiftOpen: false,
    loading: false,
    error: null,
  }),
}));

jest.mock("../../common/ReceptionSkeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="loading-skeleton" />,
}));

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockShifts = [];
  mockCashCounts = [];
  mockUseTillShiftsRange.mockImplementation(() => ({
    shifts: mockShifts,
    loading: false,
    error: null,
  }));
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("TillShiftHistory", () => {
  // TC-01: Renders shifts; only non-zero variance rows show expand affordance
  it("TC-01: renders all shifts, only non-zero variance rows show expand affordance", () => {
    mockShifts = [shiftA, shiftB, shiftC];
    mockCashCounts = [cashCountWithDenom];

    render(<TillShiftHistory />);

    // All three shift IDs appear
    expect(screen.getByText("SHIFT-A")).toBeInTheDocument();
    expect(screen.getByText("SHIFT-B")).toBeInTheDocument();
    expect(screen.getByText("SHIFT-C")).toBeInTheDocument();

    // SHIFT-A and SHIFT-C have non-zero variance → expand buttons present
    expect(
      screen.getByRole("button", { name: /expand denomination breakdown for shift SHIFT-A/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /expand denomination breakdown for shift SHIFT-C/i })
    ).toBeInTheDocument();

    // SHIFT-B has zero variance → no expand button for it
    expect(
      screen.queryByRole("button", { name: /SHIFT-B/i })
    ).not.toBeInTheDocument();
  });

  // TC-02: Staff filter shows only matching shifts
  it("TC-02: typing a staff name filters rows to matching shifts", async () => {
    mockShifts = [shiftA, shiftB, shiftC];
    mockCashCounts = [];

    const user = userEvent.setup();
    render(<TillShiftHistory />);

    const staffInput = screen.getByLabelText(/staff/i);
    await user.type(staffInput, "alice");

    // SHIFT-A and SHIFT-C opened/closed by Alice — still visible
    expect(screen.getByText("SHIFT-A")).toBeInTheDocument();
    expect(screen.getByText("SHIFT-C")).toBeInTheDocument();

    // SHIFT-B opened/closed by Bob — hidden
    expect(screen.queryByText("SHIFT-B")).not.toBeInTheDocument();
  });

  // TC-03: Date inputs are rendered and accept values
  it("TC-03: date-from and date-to inputs are rendered and accept values", async () => {
    mockShifts = [];
    mockCashCounts = [];

    const user = userEvent.setup();
    render(<TillShiftHistory />);

    const fromInput = screen.getByLabelText(/from/i);
    const toInput = screen.getByLabelText(/to/i);

    expect(fromInput).toBeInTheDocument();
    expect(toInput).toBeInTheDocument();

    await user.type(fromInput, "2026-02-01");
    await user.type(toInput, "2026-02-28");

    expect(fromInput).toHaveValue("2026-02-01");
    expect(toInput).toHaveValue("2026-02-28");
  });

  // TC-04: Click a non-zero variance row → denomination sub-row appears
  it("TC-04: clicking a non-zero-variance expand button shows denomination breakdown", async () => {
    mockShifts = [shiftA];
    mockCashCounts = [cashCountWithDenom];

    const user = userEvent.setup();
    render(<TillShiftHistory />);

    const expandBtn = screen.getByRole("button", {
      name: /expand denomination breakdown for shift SHIFT-A/i,
    });

    expect(screen.queryByText("Denomination Breakdown")).not.toBeInTheDocument();

    await user.click(expandBtn);

    expect(screen.getByText("Denomination Breakdown")).toBeInTheDocument();
    // €1 coins with count 5
    expect(screen.getByText("€1 coins")).toBeInTheDocument();
  });

  // TC-05: Click same row again → sub-row collapses
  it("TC-05: clicking the expand button again collapses the denomination sub-row", async () => {
    mockShifts = [shiftA];
    mockCashCounts = [cashCountWithDenom];

    const user = userEvent.setup();
    render(<TillShiftHistory />);

    const expandBtn = screen.getByRole("button", {
      name: /expand denomination breakdown for shift SHIFT-A/i,
    });

    await user.click(expandBtn);
    expect(screen.getByText("Denomination Breakdown")).toBeInTheDocument();

    await user.click(expandBtn);
    expect(screen.queryByText("Denomination Breakdown")).not.toBeInTheDocument();
  });

  // TC-06: Non-zero variance row with no matching cashCount → fallback message
  it("TC-06: non-zero-variance row with no matching cashCount shows fallback message", async () => {
    mockShifts = [shiftC]; // closeDifference: 3, shiftId: SHIFT-C
    mockCashCounts = [cashCountNoDenom]; // shiftId SHIFT-C but no denomBreakdown

    const user = userEvent.setup();
    render(<TillShiftHistory />);

    const expandBtn = screen.getByRole("button", {
      name: /expand denomination breakdown for shift SHIFT-C/i,
    });
    await user.click(expandBtn);

    expect(screen.getByText("No denomination data recorded.")).toBeInTheDocument();
  });

  // TC-07: Zero-variance row is not expandable, no affordance rendered
  it("TC-07: zero-variance row shows no expand affordance", () => {
    mockShifts = [shiftB]; // closeDifference: 0
    mockCashCounts = [];

    render(<TillShiftHistory />);

    expect(screen.getByText("SHIFT-B")).toBeInTheDocument();

    // No expand button for zero-variance shift
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    // No denomination sub-row content
    expect(screen.queryByText("No denomination data recorded.")).not.toBeInTheDocument();
    expect(screen.queryByText("Denomination Breakdown")).not.toBeInTheDocument();
  });

  // TC-08: Both date inputs empty → useTillShiftsRange called with bounded 30-day default range
  it("TC-08: with empty date inputs, hook is called with default 30-day bounded range", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-28T12:00:00.000Z"));

    mockShifts = [];
    mockCashCounts = [];

    // Re-configure the mock with the frozen clock active so the implementation runs under fake time
    mockUseTillShiftsRange.mockImplementation(() => ({
      shifts: mockShifts,
      loading: false,
      error: null,
    }));

    render(<TillShiftHistory />);

    // useTillShiftsRange must have been called
    expect(mockUseTillShiftsRange).toHaveBeenCalled();

    // Get the most recent call arguments
    const lastCallArgs = mockUseTillShiftsRange.mock.calls[
      mockUseTillShiftsRange.mock.calls.length - 1
    ][0] as { startAt?: string; endAt?: string; orderByChild?: string };

    // startAt must be defined (not undefined — never unbounded)
    expect(lastCallArgs.startAt).toBeDefined();
    // 30 days before 2026-02-28 = 2026-01-29
    expect(lastCallArgs.startAt).toMatch(/2026-01-29/);
    expect(lastCallArgs.startAt).toMatch(/T00:00:00/);

    // endAt must be defined
    expect(lastCallArgs.endAt).toBeDefined();
    expect(lastCallArgs.endAt).toMatch(/2026-02-28/);
    expect(lastCallArgs.endAt).toMatch(/T23:59:59/);

    // orderByChild must be closedAt
    expect(lastCallArgs.orderByChild).toBe("closedAt");

    jest.useRealTimers();
  });
});

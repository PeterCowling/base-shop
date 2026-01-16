import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CashCount } from "../../../../types/hooks/data/cashCountData";
import type { CashDiscrepancy } from "../../../../types/hooks/data/cashDiscrepancyData";

/* eslint-disable no-var */
var cashCounts: CashCount[];
var cashDiscrepancies: CashDiscrepancy[];
var addCashCount: ReturnType<typeof vi.fn>;
var addKeycardDiscrepancy: ReturnType<typeof vi.fn>;
var addShiftEvent: ReturnType<typeof vi.fn>;

vi.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "Alice" } }),
}));

vi.mock("../../../../context/TillDataContext", () => ({
  useTillData: () => ({
    transactions: [],
    creditSlips: [],
    cashCounts,
    loading: false,
    error: null,
    isShiftOpen: false,
  }),
}));

vi.mock("../../../data/useBookingsData", () => ({
  default: () => ({ bookings: {} }),
}));

vi.mock("../../../mutations/useCashCountsMutations", () => ({
  useCashCountsMutations: () => ({ addCashCount }),
}));

vi.mock("../../../data/useCashDiscrepanciesData", () => ({
  useCashDiscrepanciesData: () => ({ cashDiscrepancies }),
}));

vi.mock("../../../mutations/useCashDiscrepanciesMutations", () => ({
  useCashDiscrepanciesMutations: () => ({ addCashDiscrepancy: vi.fn() }),
}));

vi.mock("../../../mutations/useCCIrregularitiesMutations", () => ({
  useCCIrregularitiesMutations: () => ({ addCCIrregularity: vi.fn() }),
}));

vi.mock("../../../data/useSafeCountsData", () => ({
  useSafeCountsData: () => ({ safeCounts: [] }),
}));

vi.mock("../../../data/useCashDrawerLimit", () => ({
  useCashDrawerLimit: () => ({ limit: null }),
}));

vi.mock("../../../mutations/useKeycardDiscrepanciesMutations", () => ({
  useKeycardDiscrepanciesMutations: () => ({ addKeycardDiscrepancy }),
}));

vi.mock("../../../mutations/useShiftEventsMutations", () => ({
  useShiftEventsMutations: () => ({ addShiftEvent }),
}));

var showToastMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */
vi.mock("../../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => showToastMock(...args),
}));

beforeEach(() => {
  cashCounts = [];
  cashDiscrepancies = [];
  addCashCount = vi.fn();
  addKeycardDiscrepancy = vi.fn();
  addShiftEvent = vi.fn();
  showToastMock = vi.fn();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTillShifts", () => {
  it("opens a shift", async () => {
    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    act(() => {
      result.current.confirmShiftOpen(100, true, 2, { "50": 2 });
    });

    // Difference is computed against the last close (0) so should equal 100
    expect(addCashCount).toHaveBeenCalledWith(
      "opening",
      100,
      100,
      undefined,
      { "50": 2 },
      2
    );
    expect(addShiftEvent).toHaveBeenCalledWith("open", 100, 2, 100);
    expect(result.current.shiftOpenTime).not.toBeNull();
    expect(result.current.shiftOwner).toBe("Alice");
  });

  it("closes a shift", async () => {
    cashCounts = [
      { user: "Alice", timestamp: "2024-01-01T09:00:00Z", type: "opening", count: 100 },
    ];

    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    await waitFor(() => expect(result.current.shiftOpenTime).not.toBeNull());

    act(() => {
      result.current.confirmShiftClose("close", 100, 0, true, { "50": 2 });
    });

    expect(addCashCount).toHaveBeenCalledWith(
      "close",
      100,
      0,
      undefined,
      { "50": 2 },
      0
    );
    expect(addShiftEvent).toHaveBeenCalledWith("close", 100, 0, 0);
    expect(result.current.shiftOpenTime).toBeNull();
  });

  it("reconciles a shift", async () => {
    cashCounts = [
      { user: "Alice", timestamp: "2024-01-01T09:00:00Z", type: "opening", count: 100 },
    ];

    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    await waitFor(() => expect(result.current.shiftOpenTime).not.toBeNull());

    act(() => {
      result.current.confirmShiftClose("reconcile", 120, 0, true, { "20": 6 });
    });

    expect(addCashCount).toHaveBeenCalledTimes(2);
    expect(addCashCount.mock.calls[0][0]).toBe("reconcile");
    expect(addCashCount.mock.calls[1][0]).toBe("opening");
    expect(addShiftEvent).toHaveBeenCalledWith("reconcile", 120, 0, 20);
    expect(result.current.openingCash).toBe(120);
  });

  it("initializes from existing open shift", async () => {
    cashCounts = [
      {
        user: "Bob",
        timestamp: "2024-01-01T10:00:00Z",
        type: "opening",
        count: 50,
        keycardCount: 3,
      },
    ];

    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    await waitFor(() => expect(result.current.shiftOwner).toBe("Bob"));
    expect(result.current.shiftOpenTime).not.toBeNull();
    expect(result.current.openingCash).toBe(50);
    expect(result.current.openingKeycards).toBe(3);
    expect(result.current.expectedKeycardsAtClose).toBe(3);
  });

  it("warns when monthly discrepancy limit exceeded", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-05T00:00:00Z"));
    cashDiscrepancies = [
      { user: "Alice", timestamp: "2024-01-02T10:00:00Z", amount: 1 },
      { user: "Alice", timestamp: "2024-01-03T10:00:00Z", amount: 1 },
      { user: "Alice", timestamp: "2024-01-04T10:00:00Z", amount: 1 },
    ];

    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    act(() => {
      result.current.confirmShiftOpen(200, true, 0, {});
    });

    expect(showToastMock).toHaveBeenCalledWith(
      "Monthly discrepancy limit exceeded for this user.",
      "warning"
    );
  });

  it("does not warn below monthly discrepancy limit", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-05T00:00:00Z"));
    cashDiscrepancies = [
      { user: "Alice", timestamp: "2024-01-02T10:00:00Z", amount: 1 },
      { user: "Alice", timestamp: "2024-01-03T10:00:00Z", amount: 1 },
    ];

    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    act(() => {
      result.current.confirmShiftOpen(200, true, 0, {});
    });

    const warned = showToastMock.mock.calls.some(
      ([msg]) => msg === "Monthly discrepancy limit exceeded for this user."
    );
    expect(warned).toBe(false);
  });

  it("closing a shift resets state", async () => {
    cashCounts = [
      { user: "Alice", timestamp: "2024-01-01T09:00:00Z", type: "opening", count: 100 },
    ];

    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    await waitFor(() => expect(result.current.shiftOpenTime).not.toBeNull());

    act(() => {
      result.current.confirmShiftClose("close", 120, 1, true, { "100": 1, "20": 1 });
    });

    expect(result.current.shiftOpenTime).toBeNull();
    expect(result.current.shiftOwner).toBeNull();
    expect(result.current.finalCashCount).toBe(120);
    expect(result.current.finalKeycardCount).toBe(1);
  });

  it("logs keycard discrepancy when counts mismatch", async () => {
    const { useTillShifts } = await import("../useTillShifts");

    const { result } = renderHook(() => useTillShifts());

    act(() => {
      result.current.confirmKeycardReconcile(5);
    });

    expect(addKeycardDiscrepancy).toHaveBeenCalledWith(5);
    expect(addCashCount).toHaveBeenCalledWith(
      "reconcile",
      0,
      0,
      undefined,
      undefined,
      5
    );
  });

  it("accepts matching keycard count", async () => {
    const { useTillShifts } = await import("../useTillShifts");

    const { result } = renderHook(() => useTillShifts());

    act(() => {
      result.current.confirmKeycardReconcile(0);
    });

    expect(addKeycardDiscrepancy).not.toHaveBeenCalled();
    expect(addCashCount).toHaveBeenCalledWith(
      "reconcile",
      0,
      0,
      undefined,
      undefined,
      0
    );
  });

  it("blocks returning more keycards than available", async () => {
    const { useTillShifts } = await import("../useTillShifts");
    const { result } = renderHook(() => useTillShifts());

    act(() => {
      result.current.confirmShiftOpen(0, true, 3, {});
    });

    let success = true;
    act(() => {
      success = result.current.returnKeycardsToSafe(5);
    });

    expect(success).toBe(false);
    expect(result.current.openingKeycards).toBe(3);
    expect(addKeycardDiscrepancy).toHaveBeenCalledWith(-2);
    expect(showToastMock).toHaveBeenCalledWith(
      "Cannot return more keycards than available.",
      "error"
    );
  });
});

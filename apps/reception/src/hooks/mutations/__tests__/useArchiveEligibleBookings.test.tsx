import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useArchiveEligibleBookings from "../useArchiveEligibleBookings";

/* eslint-disable no-var */
var mockDatabase: unknown = {};
var getMock: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDatabase,
}));

vi.mock("firebase/database", () => ({
  ref: (...args: unknown[]) => refMock(...args),
  get: (...args: unknown[]) => getMock(...args),
}));

vi.mock("../../utils/dateUtils", () => ({
  getLocalToday: () => "2024-01-04",
}));

function snap<T>(val: T) {
  return {
    exists: () => val !== null && val !== undefined,
    val: () => val,
  };
}

function buildCheckouts() {
  const data: Record<string, Record<string, { reservationCode: string }>> = {};
  data["2024-01-01"] = {};
  for (let i = 1; i <= 30; i++) {
    data["2024-01-01"][`occ${i}`] = { reservationCode: `BR${i}` };
  }
  data["2024-01-02"] = {};
  for (let i = 31; i <= 55; i++) {
    data["2024-01-02"][`occ${i}`] = { reservationCode: `BR${i}` };
  }
  // Future checkout that should be ignored
  data["2024-01-04"] = { occ56: { reservationCode: "BR56" } };
  return data;
}

describe("useArchiveEligibleBookings", () => {
  beforeEach(() => {
    mockDatabase = {};
    getMock = vi.fn();
    refMock = vi.fn((db: unknown, path: string) => path);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("refresh filters by date and limits to 50 records", async () => {
    const checkouts = buildCheckouts();
    getMock.mockImplementation(async (path: string) => {
      if (path === "checkouts") {
        return snap(checkouts);
      }
      if (path.startsWith("bookings/")) {
        return snap({});
      }
      return snap(null);
    });

    const { result } = renderHook(() => useArchiveEligibleBookings());

    await act(async () => {
      const p = result.current.refresh();
      expect(result.current.loading).toBe(true);
      await p;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.bookings.length).toBe(50);
    expect(
      result.current.bookings.every((b) => b.checkOutDate < "2024-01-04")
    ).toBe(true);
    expect(result.current.bookings.some((b) => b.bookingRef === "BR55")).toBe(
      false
    );
  });

  it("sets error when database is not initialized", async () => {
    mockDatabase = null;
    const { result } = renderHook(() => useArchiveEligibleBookings());

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe("Database not initialized.");
    expect(result.current.loading).toBe(false);
    expect(result.current.bookings).toEqual([]);
  });
});

import "@testing-library/jest-dom";
import { renderHook, waitFor } from "@testing-library/react";

import { useCheckoutCountsByRoomForDate } from "../useCheckoutCountsByRoomForDate";

type CheckoutsResult = { checkouts: Record<string, Record<string, unknown>> | null; loading: boolean; error: unknown };
let checkoutsResult: CheckoutsResult;

type GuestResult = { guestByRoom: Record<string, { allocated: string; booked: string }> | null; loading: boolean; error: unknown };
let guestResult: GuestResult;

let italyTime = "10:00";

jest.mock("../../../data/useCheckouts", () => ({
  useCheckouts: () => checkoutsResult,
}));
jest.mock("../useGuestByRoom", () => ({
  useGuestByRoom: () => guestResult,
}));
jest.mock("../../../../utils/dateUtils", async () => {
  const actual = jest.requireActual(
    "../../../../utils/dateUtils"
  );
  return {
    ...actual,
    getItalyLocalTimeHHMM: () => italyTime,
    parseLocalDate: (s: string) => new Date(`${s}T00:00:00Z`),
    addDays: (d: Date, n: number) => new Date(d.getTime() + n * 86400000),
    getLocalYyyyMmDd: (d: Date) => actual.getItalyIsoString(d).slice(0, 10),
  };
});

describe("useCheckoutCountsByRoomForDate", () => {
  it("counts checkouts by room", async () => {
    checkoutsResult = {
      checkouts: { "2024-06-01": { occ1: {}, occ2: {} } },
      loading: false,
      error: null,
    };
    guestResult = {
      guestByRoom: {
        occ1: { allocated: "3", booked: "3" },
        occ2: { allocated: "4", booked: "4" },
      },
      loading: false,
      error: null,
    };
    const { result } = renderHook(() =>
      useCheckoutCountsByRoomForDate("2024-06-01")
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    await waitFor(() =>
      expect(result.current.checkoutCountsByRoom).toEqual({ "3": 1, "4": 1 })
    );
  });

  it("shifts date after midday", () => {
    italyTime = "13:00";
    checkoutsResult = {
      checkouts: { "2024-06-02": { occ1: {} } },
      loading: false,
      error: null,
    };
    guestResult = {
      guestByRoom: { occ1: { allocated: "3", booked: "3" } },
      loading: false,
      error: null,
    };
    const { result } = renderHook(() => useCheckoutCountsByRoomForDate("2024-06-01"));
    expect(result.current.checkoutCountsByRoom).toEqual({ "3": 1 });
  });

  it("propagates loading and error", () => {
    const err = new Error("fail");
    checkoutsResult = { checkouts: null, loading: true, error: err };
    guestResult = { guestByRoom: null, loading: false, error: null };
    const { result } = renderHook(() => useCheckoutCountsByRoomForDate("2024-06-01"));
    expect(result.current.checkoutCountsByRoom).toEqual({});
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(err);
  });
});

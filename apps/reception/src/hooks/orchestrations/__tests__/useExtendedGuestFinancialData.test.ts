import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import useExtendedGuestFinancialData from "../useExtendedGuestFinancialData";

type MockResult = {
  financialsRoom: Record<string, unknown>;
  loading: boolean;
  error: unknown;
};

let mockResult: MockResult;

vi.mock("../../data/useFinancialsRoom", () => ({
  default: () => mockResult,
}));

describe("useExtendedGuestFinancialData", () => {
  it("returns empty array when guests are undefined", () => {
    mockResult = { financialsRoom: {}, loading: false, error: null };

    const { result } = renderHook(() => useExtendedGuestFinancialData(undefined));

    expect(result.current.extendedGuests).toEqual([]);
  });

  it("merges guests with financial data and defaults missing fields", () => {
    mockResult = {
      financialsRoom: {
        BR1: {
          balance: 10,
          totalPaid: 20,
          totalAdjust: 5,
          transactions: {
            t1: {
              occupantId: "occ1",
              bookingRef: "BR1",
              amount: 20,
              nonRefundable: false,
              timestamp: "2024-01-01",
              type: "payment",
            },
          },
        },
        BR2: {},
      },
      loading: false,
      error: null,
    };

    const guests = [
      {
        bookingRef: "BR1",
        guestId: "g1",
        firstName: "A",
        lastName: "B",
        activityLevel: "",
        refundStatus: "",
      },
      {
        bookingRef: "BR2",
        guestId: "g2",
        firstName: "C",
        lastName: "D",
        activityLevel: "",
        refundStatus: "",
      },
    ];

    const { result } = renderHook(() => useExtendedGuestFinancialData(guests));

    expect(result.current.extendedGuests).toEqual([
      {
        ...guests[0],
        balance: 10,
        totalPaid: 20,
        totalAdjust: 5,
        transactions: [
          {
            occupantId: "occ1",
            bookingRef: "BR1",
            amount: 20,
            nonRefundable: false,
            timestamp: "2024-01-01",
            type: "payment",
          },
        ],
      },
      {
        ...guests[1],
        balance: 0,
        totalPaid: 0,
        totalAdjust: 0,
        transactions: [],
      },
    ]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("propagates loading and error states", () => {
    const err = new Error("fail");
    mockResult = { financialsRoom: {}, loading: true, error: err };

    const { result } = renderHook(() => useExtendedGuestFinancialData([]));

    expect(result.current.extendedGuests).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(err);
  });
});


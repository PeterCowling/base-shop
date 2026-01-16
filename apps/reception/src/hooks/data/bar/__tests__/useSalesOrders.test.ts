import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SalesOrder } from "../../../../types/bar/BarTypes";
import useFirebaseSubscription from "../../useFirebaseSubscription";
import { useSalesOrders } from "../useSalesOrders";

vi.mock("../../useFirebaseSubscription");

const mockedSub = vi.mocked(useFirebaseSubscription);

describe("useSalesOrders", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns validated confirmed orders", () => {
    mockedSub.mockReturnValue({
      data: {
        o1: {
          confirmed: true,
          bleepNumber: "1",
          userName: "u",
          time: "10:00",
          paymentMethod: "cash",
          items: [],
        },
        o2: { confirmed: false },
        unconfirmed: {},
      } as unknown as Record<
        string,
        Omit<SalesOrder, "orderKey"> | { unconfirmed?: unknown }
      >,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useSalesOrders());

    expect(result.current.orders).toEqual([
      {
        orderKey: "o1",
        confirmed: true,
        bleepNumber: "1",
        userName: "u",
        time: "10:00",
        paymentMethod: "cash",
        items: [],
      },
    ]);
    expect(result.current.error).toBeNull();
  });

  it("skips invalid orders and sets error", () => {
    mockedSub.mockReturnValue({
      data: {
        o1: {
          confirmed: true,
          bleepNumber: 1,
          userName: "u",
          time: "10:00",
          paymentMethod: "cash",
          items: [],
        },
      } as unknown as Record<
        string,
        Omit<SalesOrder, "orderKey"> | { unconfirmed?: unknown }
      >,
      loading: false,
      error: null,
    });

    const { result } = renderHook(() => useSalesOrders());

    expect(result.current.orders).toEqual([]);
    expect(result.current.error).not.toBeNull();
  });
});

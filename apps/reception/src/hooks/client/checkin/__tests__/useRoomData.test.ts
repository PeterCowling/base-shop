import "@testing-library/jest-dom";

import { renderHook } from "@testing-library/react";

import type { Bookings } from "../../../../types/domains/booking_old";
import useRoomData, { computeOutstandingRoom } from "../useRoomData";

describe("computeOutstandingRoom", () => {
  const compute: typeof computeOutstandingRoom = computeOutstandingRoom;

  it("calculates balance from charges and payments", () => {
    const booking = {
      bookingRef: "BR1",
      occupantId: "occ1",
      financials: {
        transactions: [
          { type: "charge", amount: 100 },
          { type: "payment", amount: 30 },
          { type: "charge", amount: 20 },
        ],
      },
    } as unknown as Bookings;

    expect(compute(booking)).toBe(90);
  });

  it("returns 0 when there are no transactions", () => {
    expect(compute({} as unknown as Bookings)).toBe(0);
  });
});

describe("useRoomData", () => {
  it("updates amount when booking changes", () => {
    const booking1 = {
      bookingRef: "BR1",
      occupantId: "occ1",
      financials: {
        transactions: [{ type: "charge", amount: 50 }],
      },
    } as unknown as Bookings;

    const booking2 = {
      bookingRef: "BR1",
      occupantId: "occ1",
      financials: {
        transactions: [
          { type: "charge", amount: 50 },
          { type: "payment", amount: 20 },
        ],
      },
    } as unknown as Bookings;

    const { result, rerender } = renderHook(({ b }) => useRoomData(b), {
      initialProps: { b: booking1 },
    });

    expect(result.current.amount).toBe(50);

    rerender({ b: booking2 });

    expect(result.current.amount).toBe(30);
  });
});

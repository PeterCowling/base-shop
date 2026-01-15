import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import useBookings from "../useBookingsData";

vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

let callback: ((snap: unknown) => void) | null = null;

vi.mock("firebase/database", () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  query: vi.fn((ref: unknown) => ref),
  orderByKey: vi.fn(() => undefined),
  startAt: vi.fn(() => undefined),
  endAt: vi.fn(() => undefined),
  limitToFirst: vi.fn(() => undefined),
  onValue: vi.fn((_ref: unknown, cb: (snap: unknown) => void) => {
    callback = cb;
    return () => undefined;
  }),
}));

describe("useBookingsData", () => {
  afterEach(() => {
    vi.clearAllMocks();
    callback = null;
  });

  it("returns parsed bookings", () => {
    const { result } = renderHook(() => useBookings());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({
          BOOK1: {
            occ1: {
              checkInDate: "2025-03-20",
              checkOutDate: "2025-03-26",
              leadGuest: true,
              roomNumbers: ["6"],
            },
            __notes: {
              note1: {
                text: "hello",
                timestamp: "2024-01-01T00:00:00.000Z",
                user: "Test",
              },
            },
          },
        }),
      });
    });

    expect(result.current.bookings).toEqual({
      BOOK1: {
        occ1: {
          checkInDate: "2025-03-20",
          checkOutDate: "2025-03-26",
          leadGuest: true,
          roomNumbers: ["6"],
        },
        __notes: {
          note1: {
            text: "hello",
            timestamp: "2024-01-01T00:00:00.000Z",
            user: "Test",
          },
        },
      },
    });
    expect(result.current.error).toBeNull();
  });

  it("sets error on invalid bookings data", () => {
    const { result } = renderHook(() => useBookings());

    act(() => {
      callback?.({
        exists: () => true,
        val: () => ({
          BOOK1: {
            occ1: { checkInDate: 123 },
          },
        }),
      });
    });

    expect(result.current.bookings).toEqual({});
    expect(result.current.error).not.toBeNull();
  });
});

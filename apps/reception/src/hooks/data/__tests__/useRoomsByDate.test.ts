import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useRoomsByDate from "../useRoomsByDate";

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

// --- Hoisted mock state ------------------------------------------------
let callbacks: Array<(snap: unknown) => void> = [];
const unsubscribes: Array<Mock> = [];

jest.mock("firebase/database", () => {
  return {
    ref: jest.fn(() => ({})),
    query: jest.fn((r: unknown) => r),
    orderByKey: jest.fn(() => undefined),
    startAt: jest.fn(() => undefined),
    endAt: jest.fn(() => undefined),
    onValue: jest.fn((_q: unknown, cb: (snap: unknown) => void) => {
      callbacks.push(cb);
      const unsub = jest.fn();
      unsubscribes.push(unsub);
      return unsub;
    }),
  };
});

afterEach(() => {
  jest.clearAllMocks();
  callbacks = [];
  unsubscribes.length = 0;
});

describe("useRoomsByDate", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useRoomsByDate(["2024-01-01"]));

    expect(result.current.loading).toBe(true);
  });

  it("returns merged occupancy data", () => {
    const { result } = renderHook(() =>
      useRoomsByDate(["2024-01-01", "2024-01-02"])
    );

    const snap = {
      exists: () => true,
      val: () => ({
        "2024-01-01": {
          101: {
            b1: {
              guestIds: ["g1"],
              occupantId: "occ1",
              bookingRef: "b1",
              fullName: "Alice",
            },
          },
        },
        "2024-01-02": {
          102: {
            b2: {
              guestIds: ["g2"],
              occupantId: "occ2",
              bookingRef: "b2",
              fullName: "Bob",
            },
          },
        },
        "2024-01-03": { unused: {} },
      }),
    };

    act(() => {
      callbacks[0](snap);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.mergedOccupancyData).toEqual({
      "2024-01-01": {
        101: [
          {
            occupantId: "occ1",
            bookingRef: "b1",
            roomNumber: "101",
            date: "2024-01-01",
            fullName: "Alice",
            startIndex: 0,
            endIndex: 0,
            checkInDate: "2024-01-01",
            checkOutDate: "2024-01-01",
            numberOfGuests: 1,
            color: "#cccccc",
            start: "2024-01-01",
            end: "2024-01-01",
          },
        ],
      },
      "2024-01-02": {
        102: [
          {
            occupantId: "occ2",
            bookingRef: "b2",
            roomNumber: "102",
            date: "2024-01-02",
            fullName: "Bob",
            startIndex: 0,
            endIndex: 0,
            checkInDate: "2024-01-02",
            checkOutDate: "2024-01-02",
            numberOfGuests: 1,
            color: "#cccccc",
            start: "2024-01-02",
            end: "2024-01-02",
          },
        ],
      },
    });
  });

  it("cleans up when the date range changes", () => {
    const { rerender, unmount } = renderHook(
      ({ dates }: { dates: string[] }) => useRoomsByDate(dates),
      {
        initialProps: { dates: ["2024-01-01", "2024-01-02"] },
      }
    );

    expect(unsubscribes).toHaveLength(1);

    rerender({ dates: ["2024-01-02", "2024-01-01"] });
    expect(unsubscribes).toHaveLength(1);
    expect(unsubscribes[0]).not.toHaveBeenCalled();

    rerender({ dates: ["2024-01-03"] });
    expect(unsubscribes).toHaveLength(2);
    expect(unsubscribes[0]).toHaveBeenCalledTimes(1);

    unmount();
    expect(unsubscribes[1]).toHaveBeenCalledTimes(1);
  });
});

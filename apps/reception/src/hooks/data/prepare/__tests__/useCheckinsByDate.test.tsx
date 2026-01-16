/* File: src/hooks/data/prepare/__tests__/useCheckinsByDate.test.tsx */

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for useCheckinsByDate. These tests verify that the hook
 * subscribes and unsubscribes to the correct Firebase paths based on
 * the provided date range, merges guestByRoom data correctly, and
 * surfaces errors when the Firebase subscription reports one.
 */

// Shared state used by our mocks. These variables are updated within tests
// and referenced by the mocked implementations below. Declaring them at
// the top of the module ensures they exist before the mocks execute.
let guestByRoomData: Record<string, { allocated: string; booked: string }> = {};
let guestByRoomError: unknown = null;
let snapshots: Array<(snap: unknown) => void> = [];
let errorCallbacks: Array<(err: unknown) => void> = [];
const unsubscribeFns: Array<() => void> = [];

// Mock the Firebase service hook to return a no‑op database object.
vi.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

// Mock the useFirebaseSubscription hook. Because `vi.mock` calls are hoisted
// to the top of the module, we can't reference a variable that hasn't been
// initialized yet inside the factory. Instead we return a wrapper function
// that delegates to `firebaseSubscriptionMock` when invoked. This allows the
// variable to be assigned after the mock is registered while still providing a
// stable function reference for the module under test.
const firebaseSubscriptionMock = vi.fn((_path: string) => ({
  data: guestByRoomData,
  loading: false,
  error: guestByRoomError,
}));
vi.mock("../../useFirebaseSubscription", () => ({
  __esModule: true,
  // The default export is a function that forwards its arguments to the mock.
  // The mock itself is defined below and will be populated before the hook
  // under test is imported.
  default: (...args: Parameters<typeof firebaseSubscriptionMock>) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    firebaseSubscriptionMock(...args),
}));

// Mock Firebase database functions used by useCheckinsByDate. We track
// callback registrations in arrays so that tests can trigger the
// subscription callbacks on demand.
vi.mock("firebase/database", () => {
  return {
    ref: vi.fn(() => ({})),
    query: vi.fn((r: unknown) => r),
    orderByKey: vi.fn(() => undefined),
    startAt: vi.fn(() => undefined),
    endAt: vi.fn(() => undefined),
    onValue: vi.fn(
      (
        _q: unknown,
        cb: (snap: unknown) => void,
        errCb?: (err: unknown) => void
      ) => {
        snapshots.push(cb);
        if (errCb) errorCallbacks.push(errCb);
        const unsub = vi.fn();
        unsubscribeFns.push(unsub);
        return unsub;
      }
    ),
  };
});

// Import the hook under test after mocks have been registered. Because
// Vitest hoists `vi.mock` calls, the mocked versions above will be used.
import useCheckinsByDate from "../useCheckinsByDate";

// Clean up between each test. Reset mocks and shared state so that tests
// don't leak into one another.
afterEach(() => {
  vi.clearAllMocks();
  guestByRoomData = {};
  guestByRoomError = null;
  snapshots = [];
  errorCallbacks = [];
  unsubscribeFns.length = 0;
});

describe("useCheckinsByDate", () => {
  it("subscribes only when the date range changes", () => {
    const { rerender, unmount } = renderHook(
      ({ dates }: { dates: string[] }) => useCheckinsByDate(dates),
      { initialProps: { dates: ["2024-01-01", "2024-01-02"] } }
    );

    // One subscription should have been created on first render
    expect(unsubscribeFns).toHaveLength(1);

    // Re‑render with the same range (but different order). No new subscription
    rerender({ dates: ["2024-01-02", "2024-01-01"] });
    expect(unsubscribeFns).toHaveLength(1);
    expect(unsubscribeFns[0]).not.toHaveBeenCalled();

    // Re‑render with a different range should create a new subscription and
    // unsubscribe the old one exactly once
    rerender({ dates: ["2024-01-01", "2024-01-03"] });
    expect(unsubscribeFns).toHaveLength(2);
    expect(unsubscribeFns[0]).toHaveBeenCalledTimes(1);

    // Unmounting the hook should unsubscribe the final subscription
    unmount();
    expect(unsubscribeFns[1]).toHaveBeenCalledTimes(1);
  });

  it("merges guestByRoom data with checkins", () => {
    guestByRoomData = { occ1: { allocated: "101", booked: "101" } };
    const { result } = renderHook(() => useCheckinsByDate(["2024-01-01"]));

    // Simulate a snapshot being received from the Firebase onValue callback
    act(() => {
      snapshots[0]({
        exists: () => true,
        val: () => ({
          "2024-01-01": {
            occ1: { reservationCode: "res1", timestamp: "t1" },
          },
        }),
      });
    });

    expect(result.current.checkins).toEqual({
      "2024-01-01": {
        occ1: {
          occupantId: "occ1",
          reservationCode: "res1",
          timestamp: "t1",
          allocated: "101",
          booked: "101",
        },
      },
    });
  });

  it("handles checkins error", () => {
    const { result } = renderHook(() => useCheckinsByDate(["2024-01-01"]));

    // Trigger an error via the error callback registered with onValue
    act(() => {
      errorCallbacks[0]("fail");
    });

    expect(result.current.error).toBe("fail");
  });
});

import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import { useRangeSubscription } from "../useRangeSubscription";

// Use a stable database reference so that `database` does not change between
// renders and trigger spurious re-subscriptions in the effect dep array.
const mockDatabase = {};
jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => mockDatabase,
}));

// --- Hoisted mock state ---
let onValueCallbacks: Array<(snap: unknown) => void> = [];
const unsubscribes: Array<jest.Mock> = [];

jest.mock("firebase/database", () => {
  return {
    ref: jest.fn(() => ({})),
    query: jest.fn((r: unknown) => r),
    orderByKey: jest.fn(() => undefined),
    startAt: jest.fn(() => undefined),
    endAt: jest.fn(() => undefined),
    onValue: jest.fn((_q: unknown, cb: (snap: unknown) => void) => {
      onValueCallbacks.push(cb);
      const unsub = jest.fn();
      unsubscribes.push(unsub);
      return unsub;
    }),
  };
});

afterEach(() => {
  jest.clearAllMocks();
  onValueCallbacks = [];
  unsubscribes.length = 0;
});

describe("useRangeSubscription", () => {
  // TC-12: re-render with a new array reference but the same sorted range key
  // (same start date and end date) does not create a second onValue subscription.
  it("TC-12: same start/end date on re-render (new array reference) does not trigger a new onValue call", () => {
    const onSnapshot = jest.fn();

    const { rerender } = renderHook(
      ({ dates }: { dates: string[] }) =>
        useRangeSubscription("testPath", dates, { onSnapshot }),
      // sortedDates are pre-sorted by callers — range key "2024-01-01--2024-01-02"
      { initialProps: { dates: ["2024-01-01", "2024-01-02"] } }
    );

    expect(onValueCallbacks).toHaveLength(1);

    // New array reference, same sorted content → same rangeKey string → no new subscription.
    rerender({ dates: ["2024-01-01", "2024-01-02"] });
    expect(onValueCallbacks).toHaveLength(1);
    expect(unsubscribes[0]).not.toHaveBeenCalled();
  });

  // TC-13: changed date range creates a new subscription and tears down the old one.
  it("TC-13: changed date range unsubscribes old listener and creates a new one", () => {
    const onSnapshot = jest.fn();

    const { rerender, unmount } = renderHook(
      ({ dates }: { dates: string[] }) =>
        useRangeSubscription("testPath", dates, { onSnapshot }),
      { initialProps: { dates: ["2024-01-01", "2024-01-02"] } }
    );

    expect(unsubscribes).toHaveLength(1);

    // Change the range — new range key.
    rerender({ dates: ["2024-01-03", "2024-01-04"] });
    expect(unsubscribes).toHaveLength(2);
    expect(unsubscribes[0]).toHaveBeenCalledTimes(1);

    // Unmount should clean up the second subscription.
    unmount();
    expect(unsubscribes[1]).toHaveBeenCalledTimes(1);
  });

  // TC-14: unmount unsubscribes the active listener.
  it("TC-14: unmount tears down the active subscription", () => {
    const onSnapshot = jest.fn();

    const { unmount } = renderHook(() =>
      useRangeSubscription("testPath", ["2024-01-01"], { onSnapshot })
    );

    expect(unsubscribes).toHaveLength(1);

    unmount();
    expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
  });

  it("forwards snapshot to onSnapshot callback", () => {
    const onSnapshot = jest.fn();

    renderHook(() =>
      useRangeSubscription("testPath", ["2024-01-01"], { onSnapshot })
    );

    const mockSnap = { exists: () => true, val: () => ({ foo: "bar" }) };
    act(() => {
      onValueCallbacks[0](mockSnap);
    });

    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledWith(mockSnap);
  });

  it("does not subscribe when sortedDates is empty", () => {
    const onSnapshot = jest.fn();

    renderHook(() => useRangeSubscription("testPath", [], { onSnapshot }));

    expect(onValueCallbacks).toHaveLength(0);
  });
});

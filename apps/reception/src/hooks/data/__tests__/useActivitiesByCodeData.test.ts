// src/hooks/data/__tests__/useActivitiesByCodeData.test.ts

import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useActivitiesByCodeData from "../useActivitiesByCodeData";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var refMock: jest.Mock;
var onValueMock: jest.Mock;
var unsubscribeMock: jest.Mock;
var rootCallback: ((snap: unknown) => void) | null;
var rootErrorCallback: ((err: unknown) => void) | null;
/* eslint-enable no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("firebase/database", () => {
  refMock = jest.fn((_db: unknown, path: string) => ({ path }));
  unsubscribeMock = jest.fn();
  rootCallback = null;
  rootErrorCallback = null;
  onValueMock = jest.fn(
    (
      _refObj: { path: string },
      cb: (snap: unknown) => void,
      errCb: (err: unknown) => void
    ) => {
      rootCallback = cb;
      rootErrorCallback = errCb;
      return unsubscribeMock;
    }
  );
  return { ref: refMock, onValue: onValueMock };
});

/* ------------------------------------------------------------------ */
/*  Helper: build a snapshot mock                                     */
/* ------------------------------------------------------------------ */
function makeSnapshot(data: unknown) {
  return {
    exists: () => data !== null && data !== undefined,
    val: () => data,
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe("useActivitiesByCodeData (subtree pattern)", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // Reset module-level tracking
    rootCallback = null;
    rootErrorCallback = null;
    unsubscribeMock?.mockReset();
    onValueMock?.mockClear();
    refMock?.mockClear();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });

  // TC-01: Single onValue call on activitiesByCode root regardless of codes length
  it("TC-01: registers exactly one onValue listener on the activitiesByCode root", () => {
    renderHook(() => useActivitiesByCodeData({ codes: [5, 12, 21] }));

    expect(onValueMock).toHaveBeenCalledTimes(1);
    expect(refMock).toHaveBeenCalledWith({}, "activitiesByCode");
  });

  // TC-01 extended: same for 25 codes (the useEmailProgressData case)
  it("TC-01b: registers exactly one listener even for 25 codes", () => {
    const codes = Array.from({ length: 25 }, (_, i) => i + 1);
    renderHook(() => useActivitiesByCodeData({ codes }));

    expect(onValueMock).toHaveBeenCalledTimes(1);
  });

  // TC-02: Client-side filtering — only requested codes appear in result
  it("TC-02: filters snapshot to only requested codes", async () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [5, 21] })
    );

    // Snapshot contains keys 5, 12, 21 — only 5 and 21 are requested
    act(() => {
      rootCallback?.(
        makeSnapshot({
          "5": { occ1: { act1: { who: "a" } } },
          "12": { occ2: { act2: { who: "b" } } },
          "21": { occ3: { act3: { who: "c" } } },
        })
      );
    });

    expect(result.current.activitiesByCodes).toEqual({
      "5": { occ1: { act1: { who: "a" } } },
      "21": { occ3: { act3: { who: "c" } } },
    });
    expect(result.current.activitiesByCodes["12"]).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  // TC-03: skip: true → no listener opened, loading false, activitiesByCodes empty
  it("TC-03: skip:true prevents subscription and returns empty result", () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [5, 21], skip: true })
    );

    expect(onValueMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.activitiesByCodes).toEqual({});
  });

  // TC-04: Empty codes array → no subscription opened, loading false
  it("TC-04: empty codes array prevents subscription and returns empty result", () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [] })
    );

    expect(onValueMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.activitiesByCodes).toEqual({});
  });

  // TC-05: Sub-node fails schema validation → error state set; other valid codes remain
  it("TC-05: schema validation failure sets error state", async () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [5, 21] })
    );

    act(() => {
      // Code 5: invalid shape (number instead of record), code 21: valid
      rootCallback?.(
        makeSnapshot({
          "5": "not-an-object",
          "21": { occ1: { act1: { who: "x" } } },
        })
      );
    });

    expect(result.current.error).not.toBeNull();
    // Valid code 21 is still loaded
    expect(result.current.activitiesByCodes["21"]).toEqual({
      occ1: { act1: { who: "x" } },
    });
  });

  // TC-06: Identical snapshot delivered twice → same object reference (per-code JSON.stringify dedup)
  it("TC-06: identical snapshot delivered twice does not produce a new object reference", async () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [5] })
    );

    const snapshot = makeSnapshot({
      "5": { occ1: { act1: { who: "a" } } },
    });

    act(() => {
      rootCallback?.(snapshot);
    });

    const firstRef = result.current.activitiesByCodes;

    act(() => {
      // Deliver same data again
      rootCallback?.(snapshot);
    });

    // Same object reference — per-code JSON.stringify comparison prevented update
    expect(result.current.activitiesByCodes).toBe(firstRef);
  });

  // TC-07: Unmount → unsubscribe called exactly once
  it("TC-07: unsubscribes on unmount", () => {
    const { unmount } = renderHook(() =>
      useActivitiesByCodeData({ codes: [5, 21] })
    );

    expect(unsubscribeMock).not.toHaveBeenCalled();
    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  // TC-08: codesKey changes → old listener unsubscribed, new listener registered
  it("TC-08: changing codes triggers re-subscribe", () => {
    let codes = [5];
    const { rerender } = renderHook(() =>
      useActivitiesByCodeData({ codes })
    );

    expect(onValueMock).toHaveBeenCalledTimes(1);
    expect(unsubscribeMock).not.toHaveBeenCalled();

    // Change codes — triggers codesKey change, which re-runs the effect
    codes = [5, 21];
    rerender();

    // Old listener torn down, new one registered
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    expect(onValueMock).toHaveBeenCalledTimes(2);
  });

  // Firebase error callback
  it("handles Firebase listener errors", () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [5] })
    );

    act(() => {
      rootErrorCallback?.("firebase-error");
    });

    expect(result.current.error).toBe("firebase-error");
    expect(result.current.loading).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  // Absent code in subtree → empty occupant map
  it("stores empty object for codes absent from snapshot", async () => {
    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [5, 99] })
    );

    act(() => {
      // Only code 5 is present in the snapshot; code 99 is absent
      rootCallback?.(
        makeSnapshot({
          "5": { occ1: { act1: { who: "a" } } },
        })
      );
    });

    expect(result.current.activitiesByCodes["5"]).toEqual({
      occ1: { act1: { who: "a" } },
    });
    expect(result.current.activitiesByCodes["99"]).toEqual({});
    expect(result.current.loading).toBe(false);
  });
});

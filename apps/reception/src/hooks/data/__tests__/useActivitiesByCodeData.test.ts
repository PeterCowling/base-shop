// src/hooks/data/__tests__/useActivitiesByCodeData.test.ts
/* eslint-env vitest */

import { act, renderHook } from "@testing-library/react";
import type { SpyInstance } from "vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Hoist-safe mock placeholders                                      */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var refMock: ReturnType<typeof vi.fn>;
var onValueMock: ReturnType<typeof vi.fn>;
var unsubscribes: Array<ReturnType<typeof vi.fn>>;
var eventMap: Record<string, { snapshot?: unknown; error?: unknown }>;
var callbacks: Record<string, (snap: unknown) => void>;
var errorCallbacks: Record<string, (err: unknown) => void>;
/* eslint-enable no-var */

/* ------------------------------------------------------------------ */
/*  Module mocks                                                      */
/* ------------------------------------------------------------------ */
vi.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

vi.mock("firebase/database", () => {
  refMock = vi.fn((_db, path: string) => ({ path }));
  unsubscribes = [];
  eventMap = {};
  callbacks = {};
  errorCallbacks = {};
  onValueMock = vi.fn(
    (
      refObj: { path: string },
      cb: (snap: unknown) => void,
      err: (error: unknown) => void
    ) => {
      const unsub = vi.fn();
      unsubscribes.push(unsub);
      const evt = eventMap[refObj.path];
      if (evt) {
        if (evt.snapshot) cb(evt.snapshot);
        if (evt.error) err(evt.error);
      } else {
        callbacks[refObj.path] = cb;
        errorCallbacks[refObj.path] = err;
      }
      return unsub;
    }
  );
  return { ref: refMock, onValue: onValueMock };
});

/* ------------------------------------------------------------------ */
/*  Import under test (after mocks)                                   */
/* ------------------------------------------------------------------ */
import useActivitiesByCodeData from "../useActivitiesByCodeData";

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */
describe("useActivitiesByCodeData", () => {
  let consoleErrorSpy: SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
    eventMap = {};
    unsubscribes = [];
    callbacks = {};
    errorCallbacks = {};
  });

  it("returns parsed activities and updates loading", async () => {
    eventMap = {
      "activitiesByCode/101": {
        snapshot: {
          exists: () => true,
          val: () => ({ occ1: { act1: { who: "a" } } }),
        },
      },
    };

    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [101, 202] })
    );

    await act(async () => {
      await Promise.resolve();
    });

    // At this point only first code loaded
    expect(result.current.loading).toBe(true);

    act(() => {
      callbacks["activitiesByCode/202"]?.({
        exists: () => true,
        val: () => ({ occ2: { act2: { who: "b" } } }),
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.activitiesByCodes).toEqual({
      "101": { occ1: { act1: { who: "a" } } },
      "202": { occ2: { act2: { who: "b" } } },
    });
    expect(result.current.error).toBeNull();
  });

  it("handles firebase errors", async () => {
    eventMap = {
      "activitiesByCode/101": { error: "fail" },
    };

    const { result } = renderHook(() =>
      useActivitiesByCodeData({ codes: [101] })
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBe("fail");
    expect(result.current.loading).toBe(false);
  });

  it("cleans up subscriptions on unmount", () => {
    const { unmount } = renderHook(() =>
      useActivitiesByCodeData({ codes: [101, 202] })
    );

    expect(unsubscribes.every((u) => u.mock.calls.length === 0)).toBe(true);

    unmount();

    unsubscribes.forEach((u) => {
      expect(u).toHaveBeenCalled();
    });
  });
});

// src/hooks/utilities/__tests__/useSharedDailyToggle.test.tsx
/* eslint-env vitest */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ------------------------------------------------------------------ */
/*  Hoist‑safe mocks for firebase/database                            */
/* ------------------------------------------------------------------ */
/* eslint-disable no-var */
var getDatabaseMock: ReturnType<typeof vi.fn>;
var refMock: ReturnType<typeof vi.fn>;
var onValueMock: ReturnType<typeof vi.fn>;
var setMock: ReturnType<typeof vi.fn>;
var offMock: ReturnType<typeof vi.fn>;
var onValueCb:
  | ((snap: import("firebase/database").DataSnapshot) => void)
  | null = null;
/* eslint-enable  no-var */

/**
 * Vitest hoists this `vi.mock` call above all imports, so the mocked
 * implementation is applied before any code under test is evaluated.
 * Declaring the placeholders with `var` avoids the TDZ.
 */
vi.mock("firebase/database", () => {
  getDatabaseMock = vi.fn(() => ({}));
  refMock = vi.fn((_db: unknown, path: string) => ({ path }));
  onValueMock = vi.fn((_ref: unknown, cb: (snap: unknown) => void) => {
    onValueCb = cb as typeof onValueCb;
    return () => {
      /* unsubscribe */
    };
  });
  setMock = vi.fn((_ref: unknown, data: unknown) => {
    // Echo written data back through the listener so the hook updates.
    onValueCb?.({
      val: () => data,
    } as import("firebase/database").DataSnapshot);
    return Promise.resolve();
  });
  offMock = vi.fn();

  return {
    getDatabase: getDatabaseMock,
    ref: refMock,
    onValue: onValueMock,
    set: setMock,
    off: offMock,
  };
});

/* ------------------------------------------------------------------ */
/*  Imports that rely on the mocked firebase module                   */
/* ------------------------------------------------------------------ */
import type { DataSnapshot } from "firebase/database";
import useSharedDailyToggle from "../useSharedDailyToggle";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
const KEY = "toggle";

/* ------------------------------------------------------------------ */
/*  Test suite                                                        */
/* ------------------------------------------------------------------ */
describe("useSharedDailyToggle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
    // Reset mock history before each test
    getDatabaseMock.mockClear();
    refMock.mockClear();
    onValueMock.mockClear();
    setMock.mockClear();
    offMock.mockClear();
    onValueCb = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initial value reflects firebase when date matches today", () => {
    const { result } = renderHook(() => useSharedDailyToggle(KEY));

    // Simulate Firebase returning the current day's value of `true`
    act(() => {
      onValueCb?.({
        val: () => ({ date: "2024-01-01", value: true }),
      } as DataSnapshot);
    });

    expect(result.current[0]).toBe(true);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("value resets when stored date is old", () => {
    const { result } = renderHook(() => useSharedDailyToggle(KEY));

    // Simulate outdated stored value from the previous day
    act(() => {
      onValueCb?.({
        val: () => ({ date: "2023-12-31", value: true }),
      } as DataSnapshot);
    });

    expect(result.current[0]).toBe(false);
    expect(setMock).toHaveBeenCalledWith(
      { path: `sharedToggles/${KEY}` },
      { date: "2024-01-01", value: false }
    );
  });

  it("calling setter writes value with today's date", async () => {
    const { result } = renderHook(() => useSharedDailyToggle(KEY));

    // Listener sees no stored value initially
    act(() => {
      onValueCb?.({ val: () => null } as DataSnapshot);
    });

    await act(async () => {
      await result.current[1](true);
    });

    expect(setMock).toHaveBeenLastCalledWith(
      { path: `sharedToggles/${KEY}` },
      { date: "2024-01-01", value: true }
    );
  });

  it("midnight timer triggers reset", async () => {
    const { result } = renderHook(() => useSharedDailyToggle(KEY));

    // Start with a stored `true` value for the current day
    act(() => {
      onValueCb?.({
        val: () => ({ date: "2024-01-01", value: true }),
      } as DataSnapshot);
    });
    expect(result.current[0]).toBe(true);

    // Advance to the next day (12 h to midnight + 1 s)
    await act(async () => {
      vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1000);
      await Promise.resolve();
    });

    expect(result.current[0]).toBe(false);
    expect(setMock).toHaveBeenLastCalledWith(
      { path: `sharedToggles/${KEY}` },
      { date: "2024-01-02", value: false }
    );
  });
});

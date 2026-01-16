import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import useDailyResetToggle from "../useDailyResetToggle";

const KEY = "test-toggle";

// Simple localStorage mock
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((k: string) => (k in storage ? storage[k] : null)),
  setItem: vi.fn((k: string, v: string) => {
    storage[k] = v;
  }),
  removeItem: vi.fn((k: string) => {
    delete storage[k];
  }),
  clear: vi.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  }),
};

describe("useDailyResetToggle", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    (global as Record<string, unknown>).localStorage = localStorageMock;

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00").getTime());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resets value at midnight", () => {
    const { result } = renderHook(() => useDailyResetToggle(KEY));

    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1000);
    });

    expect(result.current[0]).toBe(false);
  });

  it("ignores corrupted stored data", () => {
    storage[KEY] = "not-json";
    const { result } = renderHook(() => useDailyResetToggle(KEY));
    expect(result.current[0]).toBe(false);
  });
});

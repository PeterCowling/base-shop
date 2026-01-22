import "@testing-library/jest-dom";

import { act, renderHook } from "@testing-library/react";

import useDailyResetToggle from "../useDailyResetToggle";

const KEY = "test-toggle";

// Simple localStorage mock
const storage: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((k: string) => (k in storage ? storage[k] : null)),
  setItem: jest.fn((k: string, v: string) => {
    storage[k] = v;
  }),
  removeItem: jest.fn((k: string) => {
    delete storage[k];
  }),
  clear: jest.fn(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
  }),
};

describe("useDailyResetToggle", () => {
  beforeEach(() => {
    Object.keys(storage).forEach((k) => delete storage[k]);
    (global as Record<string, unknown>).localStorage = localStorageMock;

    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00").getTime());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resets value at midnight", () => {
    const { result } = renderHook(() => useDailyResetToggle(KEY));

    act(() => {
      result.current[1](true);
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      jest.advanceTimersByTime(12 * 60 * 60 * 1000 + 1000);
    });

    expect(result.current[0]).toBe(false);
  });

  it("ignores corrupted stored data", () => {
    storage[KEY] = "not-json";
    const { result } = renderHook(() => useDailyResetToggle(KEY));
    expect(result.current[0]).toBe(false);
  });
});

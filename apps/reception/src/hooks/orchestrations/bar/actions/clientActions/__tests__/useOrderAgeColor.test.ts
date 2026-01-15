import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useOrderAgeColor } from "../useOrderAgeColor";

describe("useOrderAgeColor", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns color based on order age", () => {
    vi.useFakeTimers();
    // Current time 07:05
    vi.setSystemTime(new Date("2024-01-01T07:05:00Z"));
    const { result } = renderHook(() => useOrderAgeColor("07:00"));
    expect(result.current).toBe("bg-success-main");

    // Move time forward to 07:08 (8 minutes age)
    vi.setSystemTime(new Date("2024-01-01T07:08:00Z"));
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current).toBe("bg-warning-main");

    // Move time forward to 07:13 (13 minutes age)
    vi.setSystemTime(new Date("2024-01-01T07:13:00Z"));
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current).toBe("bg-error-main");
  });
});

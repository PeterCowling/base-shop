import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { scheduleDailyReset } from "../scheduleDailyReset";

// Ensure consistent timezone
process.env.TZ = "UTC";

describe("scheduleDailyReset", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes callback at midnight and reschedules", () => {
    const cb = vi.fn();
    const timer = scheduleDailyReset(cb);

    // first midnight
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1000);
    expect(cb).toHaveBeenCalledTimes(1);

    // next midnight (24h later)
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(cb).toHaveBeenCalledTimes(2);

    clearTimeout(timer);
  });
});

import "@testing-library/jest-dom";

import { scheduleDailyReset } from "../scheduleDailyReset";

// Ensure consistent timezone
process.env.TZ = "UTC";

describe("scheduleDailyReset", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("invokes callback at midnight and reschedules", () => {
    const cb = jest.fn();
    const timer = scheduleDailyReset(cb);

    // first midnight
    jest.advanceTimersByTime(12 * 60 * 60 * 1000 + 1000);
    expect(cb).toHaveBeenCalledTimes(1);

    // next midnight (24h later)
    jest.advanceTimersByTime(24 * 60 * 60 * 1000);
    expect(cb).toHaveBeenCalledTimes(2);

    clearTimeout(timer);
  });
});

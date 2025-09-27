import { formatDuration, getTimeRemaining } from "../src";

describe("formatDuration", () => {
  test("formats durations with only seconds", () => {
    expect(formatDuration(45 * 1000)).toBe("45s");
  });

  test("formats durations including minutes", () => {
    const ms = (3 * 60 + 15) * 1000; // 3m 15s
    expect(formatDuration(ms)).toBe("3m 15s");
  });

  test("formats durations including hours", () => {
    const ms = (2 * 3600 + 5 * 60 + 30) * 1000; // 2h 5m 30s
    expect(formatDuration(ms)).toBe("2h 5m 30s");
  });

  test("formats durations including days", () => {
    const ms = (1 * 86400 + 2 * 3600 + 3 * 60 + 4) * 1000;
    expect(formatDuration(ms)).toBe("1d 2h 3m 4s");
  });

  test("formats durations spanning multiple days", () => {
    const ms = (2 * 86400 + 5 * 3600 + 6 * 60 + 7) * 1000; // 2d 5h 6m 7s
    expect(formatDuration(ms)).toBe("2d 5h 6m 7s");
  });

  test("returns 0s for zero duration", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  test("clamps negative milliseconds to 0s", () => {
    expect(formatDuration(-5000)).toBe("0s");
  });

  test("clamps durations from past targets to 0s", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    const target = new Date("2024-12-30T00:00:00Z");
    expect(formatDuration(getTimeRemaining(target, now))).toBe("0s");
  });
});


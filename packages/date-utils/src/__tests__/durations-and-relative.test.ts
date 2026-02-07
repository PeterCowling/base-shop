import { formatDuration, formatRelative,getTimeRemaining, parseDateSafe } from "../index";

describe("getTimeRemaining and formatDuration", () => {
  const base = new Date("2025-01-01T00:00:00Z");
  it("handles zero duration", () => {
    const remaining = getTimeRemaining(new Date("2025-01-01T00:00:00Z"), base);
    expect(remaining).toBe(0);
    expect(formatDuration(remaining)).toBe("0s");
  });
  it("handles seconds duration", () => {
    const target = new Date("2025-01-01T00:00:05Z");
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(5000);
    expect(formatDuration(remaining)).toBe("5s");
  });
  it("returns zero for past targets", () => {
    const target = new Date("2024-12-31T23:59:55Z");
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(0);
  });
  it("formats negative durations as zero", () => {
    expect(formatDuration(-5000)).toBe("0s");
  });
  it("handles hour duration", () => {
    const target = new Date("2025-01-01T03:00:00Z");
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(3 * 60 * 60 * 1000);
    expect(formatDuration(remaining)).toBe("3h 0m 0s");
  });
  it("handles minute duration", () => {
    const target = new Date("2025-01-01T00:05:00Z");
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(5 * 60 * 1000);
    expect(formatDuration(remaining)).toBe("5m 0s");
  });
  it("handles day duration", () => {
    const target = new Date("2025-01-03T00:00:00Z");
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(2 * 24 * 60 * 60 * 1000);
    expect(formatDuration(remaining)).toBe("2d 0h 0m 0s");
  });
  it("formats durations just under a day", () => {
    expect(formatDuration(24 * 60 * 60 * 1000 - 1000)).toBe("23h 59m 59s");
  });
  it("formats combined day, hour, minute and second durations", () => {
    const ms =
      1 * 24 * 60 * 60 * 1000 +
      2 * 60 * 60 * 1000 +
      3 * 60 * 1000 +
      4 * 1000;
    expect(formatDuration(ms)).toBe("1d 2h 3m 4s");
  });
  it("formats hour, minute and second durations without days", () => {
    const ms = 1 * 60 * 60 * 1000 + 1 * 60 * 1000 + 1 * 1000;
    expect(formatDuration(ms)).toBe("1h 1m 1s");
  });
});

describe("parseDateSafe and formatRelative", () => {
  it("falls back to now when value is undefined", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    jest.useFakeTimers().setSystemTime(now);
    expect(parseDateSafe().toISOString()).toBe("2025-01-01T00:00:00.000Z");
    jest.useRealTimers();
  });

  it("falls back to now when given a numeric string", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    jest.useFakeTimers().setSystemTime(now);
    expect(parseDateSafe("1735689600000").toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
    jest.useRealTimers();
  });

  it("handles invalid date input", () => {
    const d = parseDateSafe("not-a-date");
    expect(d).toBeInstanceOf(Date);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it("parses numeric timestamps", () => {
    const ts = Date.UTC(2025, 0, 1);
    const d = parseDateSafe(ts);
    expect(d.getTime()).toBe(ts);
  });

  it("clones Date instances", () => {
    const original = new Date("2025-01-01T00:00:00Z");
    const d = parseDateSafe(original);
    expect(d).not.toBe(original);
    expect(d.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("DST edge (US example) does not crash", () => {
    jest.useFakeTimers().setSystemTime(new Date("2024-03-10T01:55:00-08:00"));
    const s = formatRelative(new Date("2024-03-10T03:05:00-07:00"));
    expect(typeof s).toBe("string");
    jest.useRealTimers();
  });
});

import {
  calculateRentalDays,
  formatDuration,
  formatTimestamp,
  getTimeRemaining,
  isoDateInNDays,
  nowIso,
  parseTargetDate,
} from "../../index";

process.env.TZ = "Europe/Rome";

describe("calculateRentalDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("handles future return dates", () => {
    expect(calculateRentalDays("2025-01-04")).toBe(3);
  });
  it("throws for past return dates", () => {
    expect(() => calculateRentalDays("2024-12-25")).toThrow(
      "returnDate must be in the future",
    );
  });
  it("defaults to 1 when return date missing", () => {
    expect(calculateRentalDays()).toBe(1);
  });
  it("throws on invalid date strings", () => {
    expect(() => calculateRentalDays("not-a-date")).toThrow("Invalid returnDate");
  });
  it("counts leap days", () => {
    jest.setSystemTime(new Date("2024-02-28T00:00:00Z"));
    expect(calculateRentalDays("2024-03-01")).toBe(2);
  });
  it("throws on invalid ISO strings", () => {
    expect(() => calculateRentalDays("2025-02-30")).toThrow("Invalid returnDate");
  });
});

describe("parseTargetDate", () => {
  it("parses ISO strings with explicit offset", () => {
    expect(parseTargetDate("2025-01-01T00:00:00Z")?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
  it("assumes UTC when timezone omitted", () => {
    expect(parseTargetDate("2025-01-01T00:00:00")?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
  it("interprets plain dates in local time", () => {
    expect(parseTargetDate("2025-01-01")?.toISOString()).toBe(
      "2024-12-31T23:00:00.000Z"
    );
  });
  it("parses strings with timezone", () => {
    expect(
      parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-01-01T05:00:00.000Z");
  });
  it("returns null when target date missing", () => {
    expect(parseTargetDate()).toBeNull();
  });
  it("normalizes start and end of day with timezone", () => {
    const start = parseTargetDate(
      "2025-01-01T00:00:00",
      "America/New_York"
    )!;
    const end = parseTargetDate(
      "2025-01-01T23:59:59",
      "America/New_York"
    )!;
    expect(start.toISOString()).toBe("2025-01-01T05:00:00.000Z");
    expect(end.toISOString()).toBe("2025-01-02T04:59:59.000Z");
    expect(end.getTime() - start.getTime()).toBe(86_399_000);
  });
  it("handles DST boundaries", () => {
    const before = parseTargetDate("2025-03-30T01:30:00", "Europe/Rome")!;
    const after = parseTargetDate("2025-03-30T03:30:00", "Europe/Rome")!;
    const diffHours = (after.getTime() - before.getTime()) / 3_600_000;
    expect(diffHours).toBe(1);
  });
  it("returns null for invalid date strings", () => {
    expect(parseTargetDate("invalid")).toBeNull();
  });
  it("returns null for invalid timezones", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "Invalid/Zone")).toBeNull();
  });
  it("clamps past dates to zero", () => {
    const target = parseTargetDate("2024-12-31T23:00:00Z")!;
    const now = new Date("2025-01-01T00:00:00Z");
    expect(getTimeRemaining(target, now)).toBe(0);
  });
});

describe("getTimeRemaining", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("returns positive milliseconds for future target", () => {
    const target = new Date("2025-01-01T00:00:10Z");
    expect(getTimeRemaining(target)).toBe(10000);
  });
  it("returns zero for past targets", () => {
    const target = new Date("2024-12-31T23:59:50Z");
    expect(getTimeRemaining(target)).toBe(0);
  });
  it("returns zero when target equals now", () => {
    const target = new Date("2025-01-01T00:00:00Z");
    expect(getTimeRemaining(target)).toBe(0);
  });
  it("accounts for DST when spanning days", () => {
    const now = parseTargetDate("2025-03-09T00:00:00", "America/New_York")!;
    const target = parseTargetDate("2025-03-10T00:00:00", "America/New_York")!;
    jest.setSystemTime(now);
    expect(getTimeRemaining(target)).toBe(23 * 60 * 60 * 1000);
  });
});

describe("formatDuration", () => {
  it("formats zero duration", () => {
    expect(formatDuration(0)).toBe("0s");
  });
  it("formats negative durations as zero", () => {
    expect(formatDuration(-5000)).toBe("0s");
  });
  it("formats multi-day durations", () => {
    expect(formatDuration(90061000)).toBe("1d 1h 1m 1s");
  });
  it("formats exactly one day", () => {
    expect(formatDuration(24 * 60 * 60 * 1000)).toBe("1d 0h 0m 0s");
  });
});

describe("isoDateInNDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("handles large positive offsets", () => {
    const base = new Date("2025-01-01T00:00:00Z");
    base.setUTCDate(base.getUTCDate() + 1000);
    const expected = base.toISOString().slice(0, 10);
    expect(isoDateInNDays(1000)).toBe(expected);
  });
  it("handles large negative offsets", () => {
    const base = new Date("2025-01-01T00:00:00Z");
    base.setUTCDate(base.getUTCDate() - 1000);
    const expected = base.toISOString().slice(0, 10);
    expect(isoDateInNDays(-1000)).toBe(expected);
  });
});

describe("nowIso", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("returns current time in ISO format", () => {
    expect(nowIso()).toBe("2025-01-01T00:00:00.000Z");
  });
});

describe("formatTimestamp", () => {
  it("formats valid ISO timestamp", () => {
    const ts = "2025-01-01T05:06:07Z";
    const expected = new Date(ts).toLocaleString("en-US");
    expect(formatTimestamp(ts, "en-US")).toBe(expected);
  });
  it("returns input on invalid timestamp", () => {
    expect(formatTimestamp("not-a-date", "en-US")).toBe("not-a-date");
  });
});


import {
  calculateRentalDays,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
  isoDateInNDays,
  nowIso,
  formatTimestamp,
} from "./index";

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
  it("floors past return dates to 1", () => {
    expect(calculateRentalDays("2024-12-25")).toBe(1);
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
  it("parses strings with timezone", () => {
    expect(
      parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-01-01T05:00:00.000Z");
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
  it("parses past dates resulting in negative deltas", () => {
    const target = parseTargetDate("2024-12-31T23:00:00Z")!;
    const now = new Date("2025-01-01T00:00:00Z");
    expect(getTimeRemaining(target, now)).toBeLessThan(0);
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
  it("returns negative milliseconds for past target", () => {
    const target = new Date("2024-12-31T23:59:50Z");
    expect(getTimeRemaining(target)).toBe(-10000);
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


import {
  calculateRentalDays,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
  isoDateInNDays,
} from "./index";

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
});

describe("parseTargetDate", () => {
  it("parses ISO strings without timezone", () => {
    expect(parseTargetDate("2025-01-01T00:00:00Z")?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });
  it("parses strings with timezone", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()).toBe("2025-01-01T05:00:00.000Z");
  });
  it("returns null for invalid date strings", () => {
    expect(parseTargetDate("invalid")).toBeNull();
  });
  it("returns null for invalid timezones", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "Invalid/Zone")).toBeNull();
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


import {
  isoDateInNDays,
  calculateRentalDays,
  formatTimestamp,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from "../index";

describe("isoDateInNDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("returns ISO date string N days ahead", () => {
    expect(isoDateInNDays(3)).toBe("2025-01-04");
  });
});

describe("calculateRentalDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });
  it("computes positive day difference", () => {
    expect(calculateRentalDays("2025-01-03")).toBe(2);
  });
  it("throws on invalid date", () => {
    expect(() => calculateRentalDays("not-a-date")).toThrow("Invalid returnDate");
  });
});

describe("formatTimestamp", () => {
  it("formats valid ISO timestamp", () => {
    const ts = "2025-01-01T05:06:07Z";
    const formatted = formatTimestamp(ts, "en-US");
    expect(formatted).toContain("2025");
    expect(formatted).not.toBe(ts);
  });
  it("returns input for invalid timestamp", () => {
    expect(formatTimestamp("bad")).toBe("bad");
  });
});

describe("parseTargetDate", () => {
  it("parses ISO string", () => {
    expect(parseTargetDate("2025-01-01T00:00:00Z")?.toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
  });
  it("parses with timezone", () => {
    expect(
      parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-01-01T05:00:00.000Z");
  });
  it("returns null for invalid input", () => {
    expect(parseTargetDate("invalid")).toBeNull();
  });
});

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
  it("handles day duration", () => {
    const target = new Date("2025-01-03T00:00:00Z");
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(2 * 24 * 60 * 60 * 1000);
    expect(formatDuration(remaining)).toBe("2d 0h 0m 0s");
  });
});


import {
  nowIso,
  isoDateInNDays,
  calculateRentalDays,
  formatTimestamp,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from "../index";

describe("nowIso", () => {
  it("returns a valid ISO string", () => {
    const iso = nowIso();
    expect(new Date(iso).toISOString()).toBe(iso);
  });
});

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
  it("returns ISO date string N days behind", () => {
    expect(isoDateInNDays(-3)).toBe("2024-12-29");
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
  it("returns 1 for past return dates", () => {
    expect(calculateRentalDays("2024-12-31")).toBe(1);
  });
  it("defaults to 1 when return date missing", () => {
    expect(calculateRentalDays()).toBe(1);
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
  it("returns input for invalid timestamp with locale", () => {
    expect(formatTimestamp("bad", "en-US")).toBe("bad");
  });
  it("localizes ISO timestamp for given locale", () => {
    const ts = "2025-01-01T05:06:07Z";
    const expected = new Date(ts).toLocaleString("de-DE");
    expect(formatTimestamp(ts, "de-DE")).toBe(expected);
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
  it("returns null when target date is missing", () => {
    expect(parseTargetDate()).toBeNull();
  });
  it("returns null for invalid input with timezone", () => {
    expect(parseTargetDate("bad", "America/New_York")).toBeNull();
  });
  it("parses ISO string with timezone offset", () => {
    expect(parseTargetDate("2025-01-01T00:00:00-05:00")?.toISOString()).toBe(
      "2025-01-01T05:00:00.000Z"
    );
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
  it("returns negative for past targets", () => {
    const target = new Date("2024-12-31T23:59:55Z");
    const remaining = getTimeRemaining(target, base);
    expect(remaining).toBe(-5000);
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
});

describe("DST transitions", () => {
  it("accounts for spring forward in New York", () => {
    const before = parseTargetDate("2025-03-09T00:30:00", "America/New_York")!;
    const after = parseTargetDate("2025-03-10T00:30:00", "America/New_York")!;
    const diffHours = (after.getTime() - before.getTime()) / 3600000;
    expect(diffHours).toBe(23);
  });

  it("accounts for fall back in New York", () => {
    const before = parseTargetDate("2025-11-02T00:30:00", "America/New_York")!;
    const after = parseTargetDate("2025-11-03T00:30:00", "America/New_York")!;
    const diffHours = (after.getTime() - before.getTime()) / 3600000;
    expect(diffHours).toBe(25);
  });
});

describe("leap year handling", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-02-28T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("isoDateInNDays spans leap day", () => {
    expect(isoDateInNDays(1)).toBe("2024-02-29");
    expect(isoDateInNDays(2)).toBe("2024-03-01");
  });

  it("calculateRentalDays counts leap day", () => {
    expect(calculateRentalDays("2024-03-01")).toBe(2);
  });
});

describe("invalid timezone handling", () => {
  it("parseTargetDate returns null for bad timezone", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "Not/A_Zone")).toBeNull();
  });
});

describe("locale formatting consistency", () => {
  it("formatTimestamp round-trips across locales", () => {
    const ts = "2025-03-03T12:34:56Z";
    const us = formatTimestamp(ts, "en-US");
    const de = formatTimestamp(ts, "de-DE");
    expect(us).not.toBe(de);
    expect(new Date(us).toISOString()).toBe("2025-03-03T12:34:56.000Z");
    expect(new Date(de).toISOString()).toBe("2025-03-03T12:34:56.000Z");
  });
});

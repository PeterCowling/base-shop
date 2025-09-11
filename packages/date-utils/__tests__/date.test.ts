import {
  parseISO,
  format,
  addDays,
  calculateRentalDays,
  isoDateInNDays,
  formatTimestamp,
  formatDate,
  nowIso,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from "../src";

describe("nowIso", () => {
  test("returns a valid ISO 8601 string near current time", () => {
    const isoString = nowIso();

    expect(new Date(isoString).toISOString()).toBe(isoString);

    const timestamp = Date.parse(isoString);
    expect(Math.abs(Date.now() - timestamp)).toBeLessThanOrEqual(1000);
  });
});

describe("parseISO", () => {
  test("parses valid YYYY-MM-DD string", () => {
    const d = parseISO("2025-01-02");
    expect(d).toBeInstanceOf(Date);
    expect(format(d, "yyyy-MM-dd")).toBe("2025-01-02");
  });

  test("returns Invalid Date for invalid input", () => {
    expect(Number.isNaN(parseISO("2025-99-99").getTime())).toBe(true);
  });
});

describe("exported helpers", () => {
  test("addDays and format combine", () => {
    const d = addDays(parseISO("2025-01-01"), 1);
    expect(format(d, "yyyy-MM-dd")).toBe("2025-01-02");
  });
});

describe("calculateRentalDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("computes positive day difference", () => {
    expect(calculateRentalDays("2025-01-03")).toBe(2);
  });

  test("returns one day for same-day rentals", () => {
    expect(calculateRentalDays("2025-01-01")).toBe(1);
  });

  test("throws when return date is before today", () => {
    expect(() => calculateRentalDays("2024-12-31")).toThrow(
      "returnDate must be in the future",
    );
  });

  test("defaults to one day when returnDate is missing", () => {
    expect(calculateRentalDays()).toBe(1);
  });

  test("throws on invalid date", () => {
    expect(() => calculateRentalDays("invalid")).toThrow();
  });
});

describe("isoDateInNDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns ISO date string N days ahead", () => {
    expect(isoDateInNDays(7)).toBe("2025-01-08");
  });

  test("returns today's date when N is zero", () => {
    expect(isoDateInNDays(0)).toBe("2025-01-01");
  });

  test("handles negative offsets", () => {
    expect(isoDateInNDays(-1)).toBe("2024-12-31");
  });
});

describe("formatTimestamp", () => {
  test("formats ISO timestamp", () => {
    const ts = "2025-01-01T05:06:07Z";
    const formatted = formatTimestamp(ts, "en-US");
    expect(formatted).toContain("2025");
    expect(formatted).not.toBe(ts);
  });

  test("returns input for invalid timestamp", () => {
    expect(formatTimestamp("nope")).toBe("nope");
  });
  test("returns input for invalid timestamp with locale", () => {
    expect(formatTimestamp("nope", "en-US")).toBe("nope");
  });
  test("localizes ISO timestamp for given locale", () => {
    const ts = "2025-01-01T05:06:07Z";
    const expected = new Date(ts).toLocaleString("de-DE");
    expect(formatTimestamp(ts, "de-DE")).toBe(expected);
  });
});

describe("formatDate", () => {
  test("formats dates without timezone", () => {
    expect(formatDate("2025-03-03T05:06:07Z", "yyyy-MM-dd")).toBe(
      "2025-03-03"
    );
  });

  test("formats dates for a timezone", () => {
    const d = new Date("2025-03-03T05:06:07Z");
    expect(formatDate(d, "HH:mm", "America/New_York")).toBe("00:06");
  });

  test("throws on invalid format pattern", () => {
    expect(() => formatDate("2025-03-03T00:00:00Z", "YYYY-MM-dd")).toThrow(
      RangeError
    );
  });

  test("throws RangeError for unsupported YYYY token", () => {
    const call = () => formatDate("2025-03-03T00:00:00Z", "YYYY");
    expect(call).toThrow(RangeError);
    expect(call).toThrow("Invalid format pattern");
  });
});

describe("parseTargetDate", () => {
  test("returns Date for valid input without timezone", () => {
    const result = parseTargetDate("2025-01-01T00:00:00");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  test("parses with timezone", () => {
    expect(
      parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-01-01T05:00:00.000Z");
  });

  test("returns null for invalid input", () => {
    expect(parseTargetDate("invalid")).toBeNull();
  });

  test("returns null when targetDate is undefined", () => {
    expect(parseTargetDate()).toBeNull();
  });

  test("returns null for invalid timezone", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "Not/A_Zone")).toBeNull();
  });

  test("parses date-only and zoned strings", () => {
    expect(parseTargetDate("2025-01-01")?.toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
    expect(parseTargetDate("2025-01-01T00:00:00Z")?.toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
    expect(
      parseTargetDate("2025-01-01T00:00:00+02:00")?.toISOString()
    ).toBe("2024-12-31T22:00:00.000Z");
  });

  test("parses past dates", () => {
    expect(
      parseTargetDate("1999-12-31T23:59:59")?.toISOString()
    ).toBe("1999-12-31T23:59:59.000Z");
  });

  test("returns null for impossible dates", () => {
    expect(parseTargetDate("2025-02-30T00:00:00")).toBeNull();
  });

  test('handles "today" with timezone', () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
    expect(
      parseTargetDate("today", "America/New_York")?.toISOString()
    ).toBe("2025-06-15T04:00:00.000Z");
    jest.useRealTimers();
  });

  test('parses "today" and "tomorrow" keywords', () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
    expect(parseTargetDate("today")?.toISOString()).toBe(
      "2025-06-15T00:00:00.000Z",
    );
    expect(parseTargetDate("tomorrow")?.toISOString()).toBe(
      "2025-06-16T00:00:00.000Z",
    );
    jest.useRealTimers();
  });
});

describe("getTimeRemaining", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns positive ms for future date", () => {
    const target = new Date("2025-01-02T01:02:03Z");
    expect(getTimeRemaining(target)).toBe(
      (24 * 3600 + 3600 + 120 + 3) * 1000
    );
  });

  test("handles targets later on the same day", () => {
    const target = new Date("2025-01-01T12:00:00Z");
    expect(getTimeRemaining(target)).toBe(12 * 3600 * 1000);
  });

  test("handles targets at the next-day boundary", () => {
    const target = new Date("2025-01-02T00:00:00Z");
    expect(getTimeRemaining(target)).toBe(24 * 3600 * 1000);
  });

  test("returns zero for past dates", () => {
    const target = new Date("2024-12-31T23:59:59Z");
    expect(getTimeRemaining(target)).toBe(0);
  });

  test("returns zero when target is more than a day in the past", () => {
    const target = new Date("2024-12-30T00:00:00Z");
    expect(getTimeRemaining(target)).toBe(0);
  });

  test("returns zero for identical times", () => {
    const target = new Date("2025-01-01T00:00:00Z");
    expect(getTimeRemaining(target, target)).toBe(0);
  });
});

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
describe("DST boundaries", () => {
  describe("spring forward in New York", () => {
    beforeEach(() => {
      const systemTime = parseTargetDate(
        "2025-03-08T00:30:00",
        "America/New_York"
      )!;
      jest.useFakeTimers().setSystemTime(systemTime);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("parseTargetDate yields 23-hour span", () => {
      const before = parseTargetDate(
        "2025-03-09T00:30:00",
        "America/New_York"
      )!;
      const after = parseTargetDate(
        "2025-03-10T00:30:00",
        "America/New_York"
      )!;
      const diffHours = (after.getTime() - before.getTime()) / 3600000;
      expect(diffHours).toBe(23);
    });

    test("date helpers cross the missing hour", () => {
      expect(isoDateInNDays(1)).toBe("2025-03-09");
      expect(isoDateInNDays(2)).toBe("2025-03-10");
      expect(calculateRentalDays("2025-03-10")).toBe(2);
    });
  });

  describe("fall back in New York", () => {
    beforeEach(() => {
      const systemTime = parseTargetDate(
        "2025-11-01T00:30:00",
        "America/New_York"
      )!;
      jest.useFakeTimers().setSystemTime(systemTime);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test("parseTargetDate yields 25-hour span", () => {
      const before = parseTargetDate(
        "2025-11-02T00:30:00",
        "America/New_York"
      )!;
      const after = parseTargetDate(
        "2025-11-03T00:30:00",
        "America/New_York"
      )!;
      const diffHours = (after.getTime() - before.getTime()) / 3600000;
      expect(diffHours).toBe(25);
    });

    test("date helpers cross the repeated hour", () => {
      expect(isoDateInNDays(1)).toBe("2025-11-02");
      expect(isoDateInNDays(2)).toBe("2025-11-03");
      expect(calculateRentalDays("2025-11-03")).toBe(2);
    });
  });
});

describe("leap year handling", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2024-02-28T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("isoDateInNDays spans leap day", () => {
    expect(isoDateInNDays(1)).toBe("2024-02-29");
    expect(isoDateInNDays(2)).toBe("2024-03-01");
  });

  test("calculateRentalDays counts leap day", () => {
    expect(calculateRentalDays("2024-03-01")).toBe(2);
  });
});

describe("locale formatting consistency", () => {
  test("formatTimestamp round-trips across locales", () => {
    const ts = "2025-03-03T12:34:56Z";
    const us = formatTimestamp(ts, "en-US");
    const de = formatTimestamp(ts, "de-DE");
    expect(us).not.toBe(de);
    expect(new Date(us).toISOString()).toBe("2025-03-03T12:34:56.000Z");
    expect(new Date(de).toISOString()).toBe("2025-03-03T12:34:56.000Z");
  });
});

import {
  nowIso,
  isoDateInNDays,
  calculateRentalDays,
  formatTimestamp,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
  parseISO,
  format,
  fromZonedTime,
  startOfDay,
  parseDate,
  formatDate,
  parseDateSafe,
  formatRelative,
} from "../index";

describe("parseISO and format", () => {
  it("parses and formats a valid date", () => {
    const d = parseISO("2025-06-05");
    expect(format(d, "yyyy-MM-dd")).toBe("2025-06-05");
  });

  it("returns Invalid Date for bad input", () => {
    expect(Number.isNaN(parseISO("not-a-date").getTime())).toBe(true);
  });
});

describe("fromZonedTime", () => {
  it("converts zoned time to UTC", () => {
    const d = fromZonedTime("2025-01-01 00:00:00", "America/New_York");
    expect(d.toISOString()).toBe("2025-01-01T05:00:00.000Z");
  });

  it("handles invalid timezones", () => {
    const d = fromZonedTime("2025-01-01 00:00:00", "Invalid/Zone");
    expect(Number.isNaN(d.getTime())).toBe(true);
  });
});

describe("startOfDay", () => {
  it("returns midnight UTC when no timezone", () => {
    const d = startOfDay("2025-03-03T15:30:00Z");
    expect(d.toISOString()).toBe("2025-03-03T00:00:00.000Z");
  });

  it("adjusts for timezone offsets and DST", () => {
    const d = startOfDay("2025-03-10T12:00:00Z", "America/New_York");
    // After DST, midnight local is 04:00 UTC
    expect(d.toISOString()).toBe("2025-03-10T04:00:00.000Z");
  });

  it("handles DST fall back in New York", () => {
    const dstEnd = new Date("2025-11-02T12:00:00Z");
    expect(startOfDay(dstEnd, "America/New_York").toISOString()).toBe(
      "2025-11-02T04:00:00.000Z"
    );
    const before = new Date("2025-11-01T12:00:00Z");
    expect(startOfDay(before, "America/New_York").toISOString()).toBe(
      "2025-11-01T04:00:00.000Z"
    );
  });
});

describe("parseDate", () => {
  it("parses ISO strings", () => {
    expect(parseDate("2025-03-03T00:00:00Z")?.toISOString()).toBe(
      "2025-03-03T00:00:00.000Z"
    );
  });

  it("parses with timezone", () => {
    expect(
      parseDate("2025-03-03T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-03-03T05:00:00.000Z");
  });

  it("returns null for invalid input", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });

  it("returns null when timezone parsing yields NaN", () => {
    expect(parseDate("2025-03-03T00:00:00", "Not/A_Zone")).toBeNull();
  });

  it("returns null when timezone parsing throws", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("date-fns-tz", () => ({
        fromZonedTime: () => {
          throw new Error("boom");
        },
      }));
      const { parseDate: mocked } = await import("../index");
      expect(
        mocked("2025-01-01T00:00:00", "America/New_York")
      ).toBeNull();
    });
  });
});

describe("formatDate", () => {
  it("formats dates without timezone", () => {
    expect(formatDate("2025-03-03T05:06:07Z", "yyyy-MM-dd")).toBe(
      "2025-03-03"
    );
  });

  it("formats dates for a timezone", () => {
    const d = new Date("2025-03-03T05:06:07Z");
    expect(formatDate(d, "HH:mm", "America/New_York")).toBe("00:06");
  });
});

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
  it("returns today's date when offset is zero", () => {
    expect(isoDateInNDays(0)).toBe("2025-01-01");
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
  it("handles same-day and partial-day returns", () => {
    jest.setSystemTime(new Date("2025-01-01T00:00:00Z"));
    expect(calculateRentalDays("2025-01-01")).toBe(1);
    expect(calculateRentalDays("2025-01-02T12:00:00")).toBe(2);
  });
  it("throws for past return dates", () => {
    expect(() => calculateRentalDays("2024-12-31")).toThrow(
      "returnDate must be in the future",
    );
  });
  it("defaults to 1 when return date missing", () => {
    expect(calculateRentalDays()).toBe(1);
  });
  it("throws on invalid date", () => {
    expect(() => calculateRentalDays("not-a-date")).toThrow("Invalid returnDate");
  });
  it("throws on impossible calendar dates", () => {
    expect(() => calculateRentalDays("2025-02-30")).toThrow("Invalid returnDate");
  });
});

describe("formatTimestamp", () => {
  it("formats valid ISO timestamp", () => {
    const ts = "2025-01-01T05:06:07Z";
    const formatted = formatTimestamp(ts, "en-US");
    expect(formatted).toContain("2025");
    expect(formatted).not.toBe(ts);
  });
  it("returns original string for invalid timestamp", () => {
    const bad = "not-a-date";
    expect(formatTimestamp(bad)).toBe(bad);
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
  it("defaults to UTC when no timezone or offset provided", () => {
    expect(parseTargetDate("2025-01-01T00:00:00")?.toISOString()).toBe(
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
  it('handles "today" and "tomorrow" keywords', () => {
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

describe("parseTargetDate error handling", () => {
  it("returns null when timezone parsing throws", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("date-fns-tz", () => ({
        fromZonedTime: () => {
          throw new Error("boom");
        },
      }));
      const { parseTargetDate: mocked } = await import("../index");
      expect(
        mocked("2025-01-01T00:00:00", "America/New_York")
      ).toBeNull();
    });
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

describe("parseDateSafe and formatRelative", () => {
  it("handles invalid date input", () => {
    const d = parseDateSafe("not-a-date");
    expect(d).toBeInstanceOf(Date);
    expect(isNaN(d.getTime())).toBe(false);
  });

  it("DST edge (US example) does not crash", () => {
    jest.useFakeTimers().setSystemTime(new Date("2024-03-10T01:55:00-08:00"));
    const s = formatRelative(new Date("2024-03-10T03:05:00-07:00"));
    expect(typeof s).toBe("string");
    jest.useRealTimers();
  });
});

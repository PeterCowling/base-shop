import {
  parseISO,
  format,
  addDays,
  calculateRentalDays,
  isoDateInNDays,
  formatTimestamp,
  nowIso,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from "@acme/date-utils";

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

  test("floors past dates to one day", () => {
    expect(calculateRentalDays("2024-12-31")).toBe(1);
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
});

describe("parseTargetDate", () => {
  test("parses ISO string", () => {
    expect(parseTargetDate("2025-01-01T00:00:00Z")?.toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
  });

  test("parses with timezone", () => {
    expect(
      parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-01-01T05:00:00.000Z");
  });

  test("returns null for invalid input", () => {
    expect(parseTargetDate("invalid")).toBeNull();
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

  test("returns negative ms for past date", () => {
    const target = new Date("2024-12-31T23:59:59Z");
    expect(getTimeRemaining(target)).toBe(-1000);
  });
});

describe("formatDuration", () => {
  test("formats multi-unit durations", () => {
    expect(formatDuration((24 * 3600 + 3600 + 120 + 3) * 1000)).toBe(
      "1d 1h 2m 3s"
    );
  });

  test("formats seconds-only durations", () => {
    expect(formatDuration(45 * 1000)).toBe("45s");
  });
});
describe("DST transitions", () => {
  test("accounts for spring forward in New York", () => {
    const before = parseTargetDate("2025-03-09T00:30:00", "America/New_York")!;
    const after = parseTargetDate("2025-03-10T00:30:00", "America/New_York")!;
    const diffHours = (after.getTime() - before.getTime()) / 3600000;
    expect(diffHours).toBe(23);
  });

  test("accounts for fall back in New York", () => {
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

  test("isoDateInNDays spans leap day", () => {
    expect(isoDateInNDays(1)).toBe("2024-02-29");
    expect(isoDateInNDays(2)).toBe("2024-03-01");
  });

  test("calculateRentalDays counts leap day", () => {
    expect(calculateRentalDays("2024-03-01")).toBe(2);
  });
});

describe("invalid timezone handling", () => {
  test("parseTargetDate returns null for bad timezone", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "Not/A_Zone")).toBeNull();
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

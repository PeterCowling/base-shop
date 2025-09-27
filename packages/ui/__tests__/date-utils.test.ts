import {
  isoDateInNDays,
  calculateRentalDays,
  formatTimestamp,
  startOfDay,
  parseDate,
  formatDate,
  parseTargetDate,
  getTimeRemaining,
  formatDuration,
} from "@acme/date-utils";

describe("isoDateInNDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("handles positive, zero and negative offsets", () => {
    expect(isoDateInNDays(5)).toBe("2025-01-06");
    expect(isoDateInNDays(0)).toBe("2025-01-01");
    expect(isoDateInNDays(-1)).toBe("2024-12-31");
  });
});

describe("calculateRentalDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns 1 when return date is undefined", () => {
    expect(calculateRentalDays()).toBe(1);
  });

  it("throws for past dates", () => {
    expect(() => calculateRentalDays("2024-12-31")).toThrow(
      "returnDate must be in the future"
    );
  });

  it("returns 1 when date equals today", () => {
    expect(calculateRentalDays("2025-01-01")).toBe(1);
  });

  it("returns correct diff for future dates", () => {
    expect(calculateRentalDays("2025-01-04")).toBe(3);
  });
});

describe("format date/time strings", () => {
  it("parses ISO and numeric epoch strings", () => {
    const iso = "2025-01-01T05:06:07Z";
    const epoch = Date.UTC(2025, 0, 1, 5, 6, 7).toString();
    expect(formatTimestamp(iso, "en-US")).toBe(
      new Date(iso).toLocaleString("en-US")
    );
    expect(formatTimestamp(epoch, "en-US")).toBe(
      new Date(Number(epoch)).toLocaleString("en-US")
    );
  });

  it("returns original string for invalid inputs", () => {
    expect(formatTimestamp("not-a-date")).toBe("not-a-date");
  });
});

describe("startOfDay", () => {
  it("uses dfStartOfDay when no timezone", () => {
    const d = startOfDay("2025-03-10T12:00:00Z");
    expect(d.toISOString()).toBe("2025-03-10T00:00:00.000Z");
  });

  it("uses formatInTimeZone when timezone provided", () => {
    const d = startOfDay("2025-03-10T12:00:00Z", "Europe/Rome");
    expect(d.toISOString()).toBe("2025-03-09T23:00:00.000Z");
  });
});

describe("parseDate", () => {
  it("parses valid ISO without timezone", () => {
    expect(parseDate("2025-03-03T00:00:00Z")?.toISOString()).toBe(
      "2025-03-03T00:00:00.000Z"
    );
  });

  it("parses with timezone", () => {
    expect(parseDate("2025-03-03T00:00:00", "Europe/Rome")?.toISOString()).toBe(
      "2025-03-02T23:00:00.000Z"
    );
  });

  it("returns null on errors", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });
});

describe("formatDate", () => {
  it("formats without timezone", () => {
    expect(formatDate("2025-03-03T05:06:07Z", "yyyy-MM-dd")).toBe("2025-03-03");
  });

  it("routes to formatInTimeZone when timezone provided", () => {
    expect(formatDate("2025-03-03T05:06:07Z", "HH:mm", "Europe/Rome")).toBe(
      "06:06"
    );
  });
});

describe("parseTargetDate", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns null when undefined", () => {
    expect(parseTargetDate()).toBeNull();
  });

  it("handles today and tomorrow keywords", () => {
    expect(parseTargetDate("today")?.toISOString()).toBe(
      "2025-06-15T00:00:00.000Z"
    );
    expect(parseTargetDate("tomorrow")?.toISOString()).toBe(
      "2025-06-16T00:00:00.000Z"
    );
  });

  it("respects timezone for keywords", () => {
    expect(parseTargetDate("today", "Europe/Rome")?.toISOString()).toBe(
      "2025-06-14T22:00:00.000Z"
    );
  });

  it("parses strings with and without timezone", () => {
    expect(parseTargetDate("2023-01-01T00:00")?.toISOString()).toBe(
      "2023-01-01T00:00:00.000Z"
    );
    expect(
      parseTargetDate("2023-01-01T00:00", "Europe/Rome")?.toISOString()
    ).toBe("2022-12-31T23:00:00.000Z");
    expect(parseTargetDate("2023-01-01T00:00Z")?.toISOString()).toBe(
      "2023-01-01T00:00:00.000Z"
    );
  });

  it("returns null for invalid strings", () => {
    expect(parseTargetDate("bad input")).toBeNull();
  });
});

describe("getTimeRemaining", () => {
  it("never returns negative values", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    const past = new Date("2024-12-31T23:59:59Z");
    expect(getTimeRemaining(past, now)).toBe(0);
  });
});

describe("formatDuration", () => {
  it("handles zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("handles sub-minute durations", () => {
    expect(formatDuration(45 * 1000)).toBe("45s");
  });

  it("handles sub-hour durations", () => {
    const ms = 2 * 60 * 1000 + 5 * 1000;
    expect(formatDuration(ms)).toBe("2m 5s");
  });

  it("handles multi-day durations", () => {
    const ms =
      1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 3 * 60 * 1000 + 4 * 1000;
    expect(formatDuration(ms)).toBe("1d 2h 3m 4s");
  });
});

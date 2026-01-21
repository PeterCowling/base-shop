import {
  addDays,
  calculateRentalDays,
  format,
  formatDuration,
  formatTimestamp,
  fromZonedTime,
  getTimeRemaining,
  isoDateInNDays,
  nowIso,
  parseTargetDate,
} from "@acme/date-utils";

describe("date-utils", () => {
  it("nowIso returns ISO 8601 string", () => {
    const iso = nowIso();
    expect(iso).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
  });

  describe("isoDateInNDays", () => {
    it.each([0, 1, -1])("returns expected date for %s days", (days) => {
      const expected = format(addDays(new Date(), days), "yyyy-MM-dd");
      expect(isoDateInNDays(days)).toBe(expected);
    });
  });

  describe("calculateRentalDays", () => {
    const base = new Date("2020-01-01T00:00:00.000Z");
    let spy: jest.SpyInstance<number, []>;
    beforeEach(() => {
      spy = jest.spyOn(Date, "now").mockReturnValue(base.getTime());
    });
    afterEach(() => {
      spy.mockRestore();
    });

    it("returns 1 when no argument provided", () => {
      expect(calculateRentalDays()).toBe(1);
    });

    it("returns days for future date", () => {
      const future = addDays(base, 2).toISOString();
      expect(calculateRentalDays(future)).toBe(2);
    });

    it("returns 1 for same-day return", () => {
      const sameDay = base.toISOString();
      expect(calculateRentalDays(sameDay)).toBe(1);
    });

    it("throws for past date", () => {
      const past = addDays(base, -1).toISOString();
      expect(() => calculateRentalDays(past)).toThrow(
        "returnDate must be in the future",
      );
    });

    it("throws for invalid date", () => {
      expect(() => calculateRentalDays("abc")).toThrow("Invalid returnDate");
    });
  });

  describe("formatTimestamp", () => {
    it("formats valid ISO timestamp", () => {
      const ts = "2020-01-01T00:00:00.000Z";
      expect(formatTimestamp(ts)).toBe(new Date(ts).toLocaleString());
    });

    it("localizes timestamp for given locale", () => {
      const ts = "2020-01-01T00:00:00.000Z";
      expect(formatTimestamp(ts, "de-DE")).toBe(
        new Date(ts).toLocaleString("de-DE")
      );
    });

    it("returns original string for invalid timestamp", () => {
      expect(formatTimestamp("invalid")).toBe("invalid");
    });

    it("returns original string for invalid timestamp with locale", () => {
      expect(formatTimestamp("invalid", "en-US")).toBe("invalid");
    });
  });

  describe("parseTargetDate", () => {
    it("returns null without argument", () => {
      expect(parseTargetDate()).toBeNull();
    });

    it("appends Z for ISO without timezone", () => {
      const result = parseTargetDate("2020-01-01T00:00:00");
      expect(result?.toISOString()).toBe("2020-01-01T00:00:00.000Z");
    });

    it("parses with explicit timezone", () => {
      const ts = "2020-01-01T12:00:00";
      const expected = fromZonedTime(ts, "Europe/Rome");
      const result = parseTargetDate(ts, "Europe/Rome");
      expect(result?.toISOString()).toBe(expected.toISOString());
    });

    it("returns null for invalid date", () => {
      expect(parseTargetDate("bad")).toBeNull();
    });

    it('handles "today" and "tomorrow"', () => {
      jest.useFakeTimers().setSystemTime(new Date("2020-01-01T10:00:00.000Z"));
      expect(parseTargetDate("today")?.toISOString()).toBe(
        "2020-01-01T00:00:00.000Z"
      );
      expect(parseTargetDate("tomorrow")?.toISOString()).toBe(
        "2020-01-02T00:00:00.000Z"
      );
      jest.useRealTimers();
    });
  });

  describe("getTimeRemaining", () => {
    it("returns difference in ms for future target", () => {
      const now = new Date("2020-01-01T00:00:00.000Z");
      const target = new Date(now.getTime() + 1000);
      expect(getTimeRemaining(target, now)).toBe(1000);
    });

    it("clamps negative durations to zero", () => {
      const now = new Date("2020-01-02T00:00:00.000Z");
      const past = new Date("2020-01-01T00:00:00.000Z");
      expect(getTimeRemaining(past, now)).toBe(0);
    });
  });

  describe("formatDuration", () => {
    it.each([
      [500, "0s"],
      [90_000, "1m 30s"],
      [3_661_000, "1h 1m 1s"],
      [90_061_000, "1d 1h 1m 1s"],
    ])("formats %d ms", (ms, expected) => {
      expect(formatDuration(ms)).toBe(expected);
    });

    it("returns 0s for zero milliseconds", () => {
      expect(formatDuration(0)).toBe("0s");
    });

    it("clamps negative durations to 0s", () => {
      expect(formatDuration(-1000)).toBe("0s");
    });
  });
});

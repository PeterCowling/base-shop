import { calculateRentalDays, formatTimestamp, parseDate, parseDateSafe, formatDate, startOfDay, getTimeRemaining, formatDuration } from "../src";
import { fromZonedTime } from "date-fns-tz";

describe("additional date-utils coverage", () => {
  describe("calculateRentalDays variations", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date("2024-06-01T00:00:00Z"));
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("defaults to 1 when returnDate missing", () => {
      expect(calculateRentalDays()).toBe(1);
    });

    it("returns 1 when returnDate is today", () => {
      expect(calculateRentalDays("2024-06-01")).toBe(1);
    });

    it("throws when returnDate is in the past", () => {
      expect(() => calculateRentalDays("2024-05-31")).toThrow(
        "returnDate must be in the future",
      );
    });
  });

  describe("formatTimestamp", () => {
    it("formats numeric timestamp", () => {
      const ts = Date.UTC(2024, 0, 1).toString();
      expect(formatTimestamp(ts)).toContain("2024");
    });

    it("returns original string on invalid input", () => {
      expect(formatTimestamp("not-a-date")).toBe("not-a-date");
    });
  });

  describe("startOfDay", () => {
    it("handles ISO string without timezone", () => {
      const start = startOfDay("2024-03-15T12:34:00Z");
      expect(start.toISOString()).toBe("2024-03-15T00:00:00.000Z");
    });
  });

  describe("parseDate", () => {
    it("parses ISO string with timezone", () => {
      const d = parseDate("2024-03-15T12:00:00", "UTC");
      expect(d?.toISOString()).toBe("2024-03-15T12:00:00.000Z");
    });

    it("returns null for invalid input", () => {
      expect(parseDate("bad-date")).toBeNull();
    });
  });

  describe("parseDateSafe", () => {
    it("returns new Date for invalid string", () => {
      jest.useFakeTimers().setSystemTime(new Date("2024-06-01T00:00:00Z"));
      const d = parseDateSafe("bad-date");
      expect(d.toISOString()).toBe("2024-06-01T00:00:00.000Z");
      jest.useRealTimers();
    });

    it("handles numeric timestamp", () => {
      const ts = Date.UTC(2024, 0, 1);
      expect(parseDateSafe(ts).toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });
  });

  describe("formatDate", () => {
    it("supports timezone", () => {
      const zoned = fromZonedTime("2024-03-15T00:00:00", "UTC");
      expect(formatDate(zoned, "yyyy-MM-dd", "UTC")).toBe("2024-03-15");
    });

    it("throws on invalid pattern", () => {
      expect(() => formatDate(new Date(), "YYYY")).toThrow(RangeError);
    });
  });

  describe("getTimeRemaining", () => {
    it("returns zero when target passed", () => {
      const now = new Date("2024-01-01T00:00:05Z");
      const target = new Date("2024-01-01T00:00:00Z");
      expect(getTimeRemaining(target, now)).toBe(0);
    });

    it("returns positive difference for future target", () => {
      const now = new Date("2024-01-01T00:00:00Z");
      const target = new Date("2024-01-01T00:00:10Z");
      expect(getTimeRemaining(target, now)).toBe(10000);
    });
  });

  describe("formatDuration", () => {
    it("formats multi-unit durations", () => {
      const ms = ((1 * 24 + 2) * 3600 + 3 * 60 + 4) * 1000; // 1d 2h 3m 4s
      expect(formatDuration(ms)).toBe("1d 2h 3m 4s");
    });

    it("formats sub-minute durations", () => {
      expect(formatDuration(500)).toBe("0s");
    });
  });
});


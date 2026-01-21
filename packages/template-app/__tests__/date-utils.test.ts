import {
  calculateRentalDays,
  formatDuration,
  formatTimestamp,
  getTimeRemaining,
  isoDateInNDays,
  nowIso,
  parseTargetDate,
} from "@acme/date-utils";

describe("date-utils integration", () => {
  describe("nowIso", () => {
    it("returns current time in ISO format", () => {
      jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
      expect(nowIso()).toBe("2025-01-01T00:00:00.000Z");
      jest.useRealTimers();
    });
  });

  describe("isoDateInNDays", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
    });
    afterEach(() => {
      jest.useRealTimers();
    });
    it("handles positive offsets", () => {
      expect(isoDateInNDays(5)).toBe("2025-01-06");
    });
    it("handles zero offset", () => {
      expect(isoDateInNDays(0)).toBe("2025-01-01");
    });
    it("handles negative offsets", () => {
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
    it("throws for past return dates", () => {
      expect(() => calculateRentalDays("2024-12-31")).toThrow(
        "returnDate must be in the future",
      );
    });
    it("returns minimum of 1 day for same-day return", () => {
      expect(calculateRentalDays("2025-01-01")).toBe(1);
    });
    it("computes multi-day rentals", () => {
      expect(calculateRentalDays("2025-01-04")).toBe(3);
    });
  });

  describe("formatTimestamp", () => {
    it("formats ISO timestamps", () => {
      expect(formatTimestamp("2025-01-01T05:06:07Z", "en-US")).toContain(
        "2025",
      );
    });
    it("formats epoch millisecond strings", () => {
      const epoch = String(Date.UTC(2025, 0, 1));
      expect(formatTimestamp(epoch)).toContain("2025");
    });
    it("falls back on invalid input", () => {
      expect(formatTimestamp("bad-input")).toBe("bad-input");
    });
  });

  describe("parseTargetDate", () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it("parses \"today\"", () => {
      expect(parseTargetDate("today")?.toISOString()).toBe(
        "2025-06-15T00:00:00.000Z",
      );
    });

    it("parses \"tomorrow\"", () => {
      expect(parseTargetDate("tomorrow")?.toISOString()).toBe(
        "2025-06-16T00:00:00.000Z",
      );
    });

    it("honors timezones", () => {
      expect(
        parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString(),
      ).toBe("2025-01-01T05:00:00.000Z");
    });

    it("returns null for invalid input", () => {
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
    it("returns milliseconds for future targets", () => {
      const target = new Date("2025-01-02T01:02:03Z");
      const ms = getTimeRemaining(target);
      expect(ms).toBe((24 * 3600 + 3600 + 120 + 3) * 1000);
    });
    it("returns zero for past targets", () => {
      const target = new Date("2024-12-31T23:59:59Z");
      expect(getTimeRemaining(target)).toBe(0);
    });
  });

  describe("formatDuration", () => {
    it("formats short durations", () => {
      expect(formatDuration(65 * 1000)).toBe("1m 5s");
    });
    it("formats long durations", () => {
      const ms = (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
      expect(formatDuration(ms)).toBe("2d 3h 4m 5s");
    });
  });
});

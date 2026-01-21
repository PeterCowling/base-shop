
import "@testing-library/jest-dom";
import {
  findTimestampForCode,
  sliceDateRange,
  getNineDatesStartingFromYesterday,
  toEpochMillis,
  timeToMinutes,
  formatEnGbDateTimeFromIso,
  formatItalyDateFromIso,
  formatItalyDateTimeFromIso,
  formatDdMm,
  extractItalyDate,
  formatMonthNameDay,
  getItalyTimestampCompact,
} from "../dateUtils";

process.env.TZ = "UTC";

describe("extra dateUtils", () => {
  describe("getNineDatesStartingFromYesterday", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-10T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns 9 dates starting from yesterday", () => {
      const result = getNineDatesStartingFromYesterday();
      expect(result).toHaveLength(9);
      expect(result[0]).toBe("2024-06-09");
      for (let i = 1; i < 9; i += 1) {
        const prev = new Date(result[i - 1]);
        const current = new Date(result[i]);
        expect(current.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
      }
    });
  });

  describe("sliceDateRange", () => {
    it("returns subset between indexes", () => {
      const range = sliceDateRange(["a", "b", "c"], 1, 2);
      expect(range).toEqual(["b", "c"]);
    });

    it("returns empty when startIndex > endIndex", () => {
      expect(sliceDateRange(["a", "b"], 2, 1)).toEqual([]);
  });
  });

  describe("findTimestampForCode", () => {
    interface Activity {
      code: number;
      timestamp: string;
    }
    const activities: Activity[] = [
      { code: 1, timestamp: "2024-06-01T10:00:00Z" },
      { code: 2, timestamp: "2024-06-02T12:00:00Z" },
      { code: 1, timestamp: "2024-06-01T08:00:00Z" },
    ];

    it("returns earliest timestamp for code", () => {
      const ts = findTimestampForCode(activities, 1);
      expect(ts).toBe("2024-06-01T08:00:00.000Z");
    });

    it("returns null when no activities match", () => {
      expect(findTimestampForCode(activities, 3)).toBeNull();
    });
  });

  describe("new helpers", () => {
    it("toEpochMillis converts ISO to ms", () => {
      expect(toEpochMillis("2024-06-10T00:00:00Z")).toBe(
        new Date("2024-06-10T00:00:00Z").getTime(),
      );
    });

    it("timeToMinutes parses HH:MM", () => {
      expect(timeToMinutes("02:30")).toBe(150);
    });

    it("formatEnGbDateTimeFromIso formats", () => {
      const iso = "2024-06-10T12:34:56Z";
      expect(formatEnGbDateTimeFromIso(iso)).toContain("10/06/2024");
    });

    it("formatItalyDateFromIso formats date", () => {
      expect(formatItalyDateFromIso("2024-06-10T00:00:00Z")).toBe("10/06/2024");
    });

    it("formatItalyDateTimeFromIso includes time", () => {
      expect(formatItalyDateTimeFromIso("2024-06-10T10:00:00Z")).toBe(
        "10/06/2024, 12:00",
      );
    });

    it("formatDdMm handles ISO", () => {
      expect(formatDdMm("2024-06-10")).toBe("10/06");
    });

    it("formatDdMm returns empty string for falsy input", () => {
      expect(formatDdMm("")).toBe("");
      expect(formatDdMm(null)).toBe("");
      expect(formatDdMm(undefined)).toBe("");
    });

    it("formatDdMm returns empty string for invalid date", () => {
      expect(formatDdMm("invalid")).toBe("");
    });

    it("extractItalyDate returns local date", () => {
      expect(extractItalyDate("2024-06-10T22:00:00Z")).toBe("2024-06-11");
    });

    it("formatMonthNameDay returns parts", () => {
      const { day, month } = formatMonthNameDay(
        new Date("2024-06-10T00:00:00Z"),
      );
      expect(day).toBe("10");
      expect(month.length).toBeGreaterThan(0);
    });

    it("getItalyTimestampCompact length", () => {
      expect(getItalyTimestampCompact(new Date()).length).toBe(17);
    });
  });
});

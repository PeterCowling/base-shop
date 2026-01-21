
import "@testing-library/jest-dom";
import {
  addDays,
  subDays,
  computeHoursElapsed,
  computeNightsRange,
  formatDate,
  formatDdMmYyyy,
  formatItalyDate,
  formatItalyDateTime,
  formatDateForInput,
  formatDisplayDate,
  getWeekdayShortLabel,
  getDatesSurroundingDate,
  getDateRange,
  buildQuickDateRange,
  getItalyIsoString,
  getCurrentDateInRome,
  getItalyLocalDateParts,
  getItalyLocalDateMMDD,
  getItalyLocalTimeHHMM,
  msUntilNextMidnight,
  parseHHMMToDate,
  minutesSinceHHMM,
  getLocalToday,
  getLocalYyyyMmDd,
  getNextDay,
  getYesterday,
  endOfDayLocal,
  startOfDayIso,
  endOfDayIso,
  isDateWithinRange,
  isOnOrBefore,
  isValidDateParts,
  isToday,
  isWeekend,
  parseLocalDate,
  parseYMD,
  sameItalyDate,
  createDaysRange,
  dateRangesOverlap,
  sortByDateAsc,
  generateDateRange,
  startOfMonthLocal,
  getCurrentIsoTimestamp,
} from "../dateUtils";
import { LOCALES } from "../../components/roomgrid/constants/locales";

// Ensure consistent timezone for date calculations
process.env.TZ = "UTC";

describe("dateUtils", () => {
  describe("addDays", () => {
    it("adds days without mutating original date", () => {
      const base = new Date("2020-01-01T00:00:00Z");
      const result = addDays(base, 5);
      expect(result.toISOString()).toBe("2020-01-06T00:00:00.000Z");
      expect(base.toISOString()).toBe("2020-01-01T00:00:00.000Z");
    });
  });

  describe("subDays", () => {
    it("subtracts days without mutating original date", () => {
      const base = new Date("2020-01-06T00:00:00Z");
      const result = subDays(base, 5);
      expect(result.toISOString()).toBe("2020-01-01T00:00:00.000Z");
      expect(base.toISOString()).toBe("2020-01-06T00:00:00.000Z");
    });
  });

  describe("getDateRange", () => {
    it("returns successive days after start", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      const result = getDateRange(start, 3).map((d) => d.toISOString());
      expect(result).toEqual([
        "2024-01-02T00:00:00.000Z",
        "2024-01-03T00:00:00.000Z",
        "2024-01-04T00:00:00.000Z",
      ]);
      // Ensure original date not mutated
      expect(start.toISOString()).toBe("2024-01-01T00:00:00.000Z");
    });

    it("handles non-positive day counts", () => {
      const start = new Date("2024-01-01T00:00:00Z");
      expect(getDateRange(start, 0)).toEqual([]);
    });
  });

  describe("buildQuickDateRange", () => {
    it("returns yesterday, today and upcoming days", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-16T12:00:00Z"));

      const { today, yesterday, nextDays } = buildQuickDateRange(2);
      expect(today).toBe("2024-06-16");
      expect(yesterday).toBe("2024-06-15");
      expect(nextDays).toEqual(["2024-06-17", "2024-06-18"]);

      jest.useRealTimers();
    });
  });

  describe("parseYMD", () => {
    it("parses YYYY-MM-DD into timestamp", () => {
      const ts = parseYMD("2020-02-03");
      expect(ts).toBe(new Date(2020, 1, 3).getTime());
    });
  });

  describe("isValidDateParts", () => {
    it("returns true for real dates", () => {
      expect(isValidDateParts("2024", "02", "29")).toBe(true);
    });

    it("returns false for impossible dates", () => {
      expect(isValidDateParts("2023", "02", "29")).toBe(false);
    });
  });

  describe("formatDate", () => {
    it("formats Date to YYYY-MM-DD", () => {
      const date = new Date(Date.UTC(2020, 1, 3, 12));
      expect(formatDate(date)).toBe("2020-02-03");
    });
  });

  describe("formatDdMmYyyy", () => {
    it("formats Date to DD/MM/YYYY", () => {
      const date = new Date(Date.UTC(2020, 1, 3, 12));
      expect(formatDdMmYyyy(date)).toBe("03/02/2020");
    });
  });

  describe("formatItalyDate", () => {
    it("formats using Rome timezone", () => {
      const date = new Date("2024-06-16T23:30:00Z");
      expect(formatItalyDate(date)).toBe("17/06/2024");
    });
  });

  describe("formatItalyDateTime", () => {
    it("includes time in Rome timezone", () => {
      const date = new Date("2024-06-16T21:15:00Z");
      expect(formatItalyDateTime(date)).toBe("16/06/2024, 23:15");
    });
  });

  describe("getNextDay", () => {
    it("returns next day string", () => {
      expect(getNextDay("2020-02-03")).toBe("2020-02-04");
    });
  });

  describe("getYesterday", () => {
    it("returns Date for previous day", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-16T12:00:00Z"));
      const result = getYesterday();
      expect(result.toISOString()).toBe("2024-06-15T12:00:00.000Z");
      jest.useRealTimers();
    });
  });

  describe("isWeekend", () => {
    it("detects Saturdays and Sundays", () => {
      expect(isWeekend("2024-06-15")).toBe(true); // Saturday
      expect(isWeekend("2024-06-16")).toBe(true); // Sunday
      expect(isWeekend("2024-06-17")).toBe(false); // Monday
    });
  });

  describe("isToday", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-16T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("checks if a date is today", () => {
      expect(isToday("2024-06-16")).toBe(true);
      expect(isToday("2024-06-15")).toBe(false);
    });
  });

  describe("computeNightsRange", () => {
    it("creates array of nights between check-in and check-out", () => {
      const nights = computeNightsRange("2020-02-01", "2020-02-04");
      expect(nights).toEqual(["2020-02-01", "2020-02-02", "2020-02-03"]);
    });

    it("returns empty array for invalid range", () => {
      expect(computeNightsRange("2020-02-04", "2020-02-01")).toEqual([]);
    });
  });

  describe("isDateWithinRange", () => {
    it("checks if date is inside the given range", () => {
      expect(isDateWithinRange("2020-02-02", "2020-02-01", "2020-02-04")).toBe(
        true
      );
      expect(isDateWithinRange("2020-02-04", "2020-02-01", "2020-02-04")).toBe(
        false
      );
      expect(isDateWithinRange("2020-02-02", undefined, "2020-02-04")).toBe(
        false
      );
    });
  });

  describe("createDaysRange", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-16T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("builds range with metadata", () => {
      const days = createDaysRange({
        start: "2024-06-15",
        end: "2024-06-17",
        locale: LOCALES.en,
      });
      expect(days).toEqual([
        { value: "2024-06-15", date: 15, day: "Sa", isWeekend: true, isToday: false },
        { value: "2024-06-16", date: 16, day: "Su", isWeekend: true, isToday: true },
        { value: "2024-06-17", date: 17, day: "Mo", isWeekend: false, isToday: false },
      ]);
    });

    it("returns empty for inverted range", () => {
      expect(
        createDaysRange({
          start: "2024-06-17",
          end: "2024-06-15",
          locale: LOCALES.en,
        })
      ).toEqual([]);
    });
  });

  describe("dateRangesOverlap", () => {
    it("detects overlapping ranges", () => {
      expect(
        dateRangesOverlap("2025-01-01", "2025-01-05", "2025-01-04", "2025-01-06")
      ).toBe(true);
      expect(
        dateRangesOverlap("2025-01-01", "2025-01-05", "2025-01-05", "2025-01-06")
      ).toBe(false);
    });
  });

  describe("sortByDateAsc", () => {
    it("sorts items in ascending order", () => {
      const arr = [
        { d: "2020-02-03" },
        { d: "2020-02-01" },
        { d: "2020-02-02" },
      ];
      sortByDateAsc(arr, (i) => i.d);
      expect(arr.map((i) => i.d)).toEqual([
        "2020-02-01",
        "2020-02-02",
        "2020-02-03",
      ]);
    });
  });

  describe("generateDateRange", () => {
    it("builds inclusive range", () => {
      expect(generateDateRange("2020-02-01", "2020-02-03")).toEqual([
        "2020-02-01",
        "2020-02-02",
        "2020-02-03",
      ]);
    });

    it("returns empty for invalid range", () => {
      expect(generateDateRange("2020-02-03", "2020-02-01")).toEqual([]);
    });
  });

  describe("computeHoursElapsed", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2020-02-02T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("computes elapsed hours from timestamp to now", () => {
      expect(computeHoursElapsed("2020-02-01T06:00:00Z")).toBeCloseTo(30);
    });

    it("returns null for null or invalid timestamp", () => {
      expect(computeHoursElapsed(null)).toBeNull();
      expect(computeHoursElapsed("bad-date")).toBeNull();
    });
  });

  describe("sameItalyDate", () => {
    it("returns true for timestamps on the same Italian date", () => {
      const a = "2024-06-01T22:00:00Z"; // 2024-06-02 in Italy
      expect(sameItalyDate(a, "2024-06-02")).toBe(true);
    });

    it("returns false for timestamps on different Italian dates", () => {
      const a = "2024-06-01T22:00:00Z";
      expect(sameItalyDate(a, "2024-06-01")).toBe(false);
    });
  });

  describe("formatDateForInput", () => {
    it("normalizes ISO date for input fields", () => {
      expect(formatDateForInput("2020-02-01T12:00:00Z")).toBe("2020-02-01");
      expect(formatDateForInput("2020-02-01T23:30:00Z")).toBe("2020-02-02");
    });

    it("returns empty string for invalid input", () => {
      expect(formatDateForInput("")).toBe("");
      expect(formatDateForInput("not-a-date")).toBe("");
    });
  });

  describe("Italian timezone helpers", () => {
    it("generates ISO string from Intl parts", () => {
      const spy = jest.spyOn(Intl, "DateTimeFormat").mockImplementation(
        () =>
          ({
            formatToParts: () => [
              { type: "day", value: "05" },
              { type: "month", value: "06" },
              { type: "year", value: "2024" },
              { type: "hour", value: "09" },
              { type: "minute", value: "08" },
              { type: "second", value: "07" },
            ],
          } as unknown as Intl.DateTimeFormat)
      );

      const iso = getItalyIsoString();
      expect(iso).toBe("2024-06-05T09:08:07.000+00:00");
      expect(spy).toHaveBeenCalledWith(
        "en-GB",
        expect.objectContaining({ timeZone: "Europe/Rome" })
      );
      spy.mockRestore();
    });

    it("formats HH:MM from Intl parts", () => {
      const spy = jest.spyOn(Intl, "DateTimeFormat").mockImplementation(
        () =>
          ({
            formatToParts: () => [
              { type: "hour", value: "18" },
              { type: "minute", value: "07" },
            ],
          } as unknown as Intl.DateTimeFormat)
      );

      const time = getItalyLocalTimeHHMM();
      expect(time).toBe("18:07");
      expect(spy).toHaveBeenCalledWith(
        "en-GB",
        expect.objectContaining({ timeZone: "Europe/Rome" })
      );
      spy.mockRestore();
    });
  });

  describe("getItalyLocalDateMMDD", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2020-06-02T22:30:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns today's date in Italy", () => {
      expect(getItalyLocalDateMMDD()).toBe("0603");
    });
  });

  describe("getCurrentDateInRome", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2020-06-02T22:30:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns a Date object in Italian local time", () => {
      const d = getCurrentDateInRome();
      expect(d.getHours()).toBe(0);
      expect(d.getDate()).toBe(3);
    });
  });

  describe("getItalyLocalDateParts", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2020-06-02T22:30:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns month name and day for Italy", () => {
      expect(getItalyLocalDateParts()).toEqual({
        monthName: "June",
        day: "3",
      });
    });

    it("applies day offsets", () => {
      expect(getItalyLocalDateParts(1)).toEqual({
        monthName: "June",
        day: "4",
      });
    });
  });

  describe("getDatesSurroundingDate", () => {
    it("computes surrounding range with defaults", () => {
      expect(getDatesSurroundingDate("2020-01-10")).toEqual([
        "2020-01-09",
        "2020-01-10",
        "2020-01-11",
        "2020-01-12",
        "2020-01-13",
        "2020-01-14",
        "2020-01-15",
      ]);
    });

    it("computes surrounding range with custom values", () => {
      expect(getDatesSurroundingDate("2020-01-10", 2, 2)).toEqual([
        "2020-01-08",
        "2020-01-09",
        "2020-01-10",
        "2020-01-11",
        "2020-01-12",
      ]);
    });
  });

  describe("local date helpers", () => {
    it("formats date as YYYY-MM-DD", () => {
      const d = new Date(Date.UTC(2020, 4, 2, 12));
      expect(getLocalYyyyMmDd(d)).toBe("2020-05-02");
    });

    it("parses YYYY-MM-DD to local midnight", () => {
      const d = parseLocalDate("2020-05-02");
      expect(d).toBeDefined();
      if (d) {
        expect(d.getFullYear()).toBe(2020);
        expect(d.getMonth()).toBe(4);
        expect(d.getDate()).toBe(2);
        expect(d.getHours()).toBe(0);
        expect(d.getMinutes()).toBe(0);
      }
    });

    it("returns undefined for bad input", () => {
      expect(parseLocalDate("")).toBeUndefined();
    });

    it("returns today's local date", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2020-05-02T12:34:00Z"));
      expect(getLocalToday()).toBe("2020-05-02");
      jest.useRealTimers();
    });

    it("formats display date as DD-MM", () => {
      expect(formatDisplayDate("2020-05-02")).toBe("02-05");
      expect(formatDisplayDate("bad")).toBe("");
    });
  });

  describe("getWeekdayShortLabel", () => {
    it("returns short weekday label for default locale", () => {
      expect(getWeekdayShortLabel("2024-06-16")).toBe("Sun");
    });

    it("supports custom locale", () => {
      expect(getWeekdayShortLabel("2024-06-16", "it-IT")).toBe("dom");
    });

    it("returns empty string for invalid date", () => {
      expect(getWeekdayShortLabel("invalid")).toBe("");
    });
  });

  describe("startOfMonthLocal", () => {
    it("returns first day of the month at local midnight", () => {
      const input = new Date("2024-06-15T12:34:56Z");
      const result = startOfMonthLocal(input);
      expect(result.toISOString()).toBe("2024-06-01T00:00:00.000Z");
    });
  });

  describe("getCurrentIsoTimestamp", () => {
    beforeAll(() => {
      jest.useFakeTimers();
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("returns ISO string for current time", () => {
      const expected = "2024-06-16T12:00:00.000Z";
      jest.setSystemTime(new Date(expected));
      expect(getCurrentIsoTimestamp()).toBe(expected);
    });

    it("produces a valid ISO string", () => {
      const expected = "2024-06-16T12:00:00.000Z";
      jest.setSystemTime(new Date(expected));
      const ts = getCurrentIsoTimestamp();
      expect(new Date(ts).toISOString()).toBe(ts);
    });
  });
});

// Additional tests migrated from dateUtils2.test.ts

describe("dateUtils2", () => {
  describe("computeNightsRange", () => {
    it("handles normal stay", () => {
      const range = computeNightsRange("2024-06-01", "2024-06-04");
      expect(range).toEqual(["2024-06-01", "2024-06-02", "2024-06-03"]);
    });

    it("returns empty for inverted range", () => {
      expect(computeNightsRange("2024-06-04", "2024-06-01")).toEqual([]);
    });

    it("returns empty when dates missing", () => {
      expect(computeNightsRange(undefined, "2024-06-02")).toEqual([]);
      expect(computeNightsRange("2024-06-01", undefined)).toEqual([]);
    });
  });

  describe("computeHoursElapsed", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-10T12:00:00Z"));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it("calculates elapsed hours for valid timestamp", () => {
      expect(computeHoursElapsed("2024-06-10T00:00:00Z")).toBeCloseTo(12);
    });

    it("returns 0 for future timestamp", () => {
      expect(computeHoursElapsed("2024-06-11T00:00:00Z")).toBe(0);
    });

    it("returns null for invalid or null", () => {
      expect(computeHoursElapsed("bad")).toBeNull();
      expect(computeHoursElapsed(null)).toBeNull();
    });
  });

  describe("getDatesSurroundingDate", () => {
    it("handles zero days before and after", () => {
      expect(getDatesSurroundingDate("2024-12-31", 0, 0)).toEqual([
        "2024-12-31",
      ]);
    });

    it("crosses year boundaries", () => {
      expect(getDatesSurroundingDate("2024-12-31", 1, 1)).toEqual([
        "2024-12-30",
        "2024-12-31",
        "2025-01-01",
      ]);
    });
  });

  describe("formatDateForInput", () => {
    it("returns same day for plain date", () => {
      expect(formatDateForInput("2024-06-15")).toBe("2024-06-15");
    });

    it("handles ISO near midnight", () => {
      expect(formatDateForInput("2024-06-15T23:30:00Z")).toBe("2024-06-16");
    });

    it("returns empty for invalid", () => {
      expect(formatDateForInput("not-a-date")).toBe("");
    });

    it("accepts Date objects", () => {
      const date = new Date("2024-06-15T23:30:00Z");
      expect(formatDateForInput(date)).toBe("2024-06-16");
    });

    it("accepts timestamps", () => {
      const ts = Date.parse("2024-06-15T00:00:00Z");
      expect(formatDateForInput(ts)).toBe("2024-06-15");
    });
  });

  describe("local date helpers", () => {
    it("parses YYYY-MM-DD at local midnight", () => {
      const d = parseLocalDate("2024-06-15");
      expect(d).toBeDefined();
      if (d) {
        expect(d.getHours()).toBe(0);
        expect(d.getFullYear()).toBe(2024);
        expect(d.getMonth()).toBe(5);
        expect(d.getDate()).toBe(15);
      }
    });

    it("returns undefined on bad input", () => {
      expect(parseLocalDate("")).toBeUndefined();
    });

    it("formats display date", () => {
      expect(formatDisplayDate("2024-06-15")).toBe("15-06");
      expect(formatDisplayDate("bad")).toBe("");
    });
  });

  describe("msUntilNextMidnight", () => {
    it("calculates milliseconds until next midnight", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01T22:00:00Z"));
      expect(msUntilNextMidnight()).toBe(2 * 60 * 60 * 1000);
      jest.useRealTimers();
    });
  });

  describe("parseHHMMToDate and minutesSinceHHMM", () => {
    it("parses time string and computes minutes", () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-01T08:00:00Z"));
      const d = parseHHMMToDate("07:30");
      expect(d?.toISOString()).toBe("2024-01-01T07:30:00.000Z");
      expect(minutesSinceHHMM("07:00")).toBe(60);
      jest.useRealTimers();
    });
  });

  describe("endOfDayLocal, startOfDayIso, endOfDayIso, isOnOrBefore", () => {
    it("provides day boundary helpers", () => {
      const date = new Date("2024-01-01T10:00:00Z");
      expect(endOfDayLocal(date).toISOString()).toBe(
        "2024-01-01T23:59:59.999Z",
      );
      expect(startOfDayIso(date)).toBe("2024-01-01T00:00:00.000+00:00");
      expect(endOfDayIso(date)).toBe("2024-01-01T23:59:59.999+00:00");
      expect(
        isOnOrBefore(
          "2024-01-01T10:00:00Z",
          new Date("2024-01-01T12:00:00Z"),
        ),
      ).toBe(true);
    });
  });
});

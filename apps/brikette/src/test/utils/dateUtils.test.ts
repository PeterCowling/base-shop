
import "@testing-library/jest-dom";

import { addDays, formatDate, formatDisplayDate, getDatePlusTwoDays, getToday, getTodayIso, parseIsoToLocalDate, safeParseIso } from "@/utils/dateUtils";

describe("dateUtils", () => {
  describe("getToday", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-05-01T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns a Date at local midnight today", () => {
      const today = getToday();

      expect(today).toBeInstanceOf(Date);
      expect(today.getHours()).toBe(0);
      expect(today.getMinutes()).toBe(0);
      expect(today.getSeconds()).toBe(0);
      expect(today.getMilliseconds()).toBe(0);
      expect(today.getFullYear()).toBe(2024);
      expect(today.getMonth()).toBe(4);
      expect(today.getDate()).toBe(1);
    });
  });

  describe("getTodayIso", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-05-01T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("returns YYYY-MM-DD", () => {
      expect(getTodayIso()).toBe("2024-05-01");
    });
  });

  describe("addDays", () => {
    it("adds days to a valid date", () => {
      expect(addDays("2024-05-01", 3)).toBe("2024-05-04");
    });

    it("subtracts days when negative", () => {
      expect(addDays("2024-05-01", -2)).toBe("2024-04-29");
    });

    it("crosses month boundaries correctly", () => {
      expect(addDays("2024-01-30", 5)).toBe("2024-02-04");
    });

    it("crosses year boundaries correctly", () => {
      expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    });

    it("returns consistent YYYY-MM-DD output regardless of input format", () => {
      expect(addDays("2024-05-01T00:00:00Z", 1)).toBe("2024-05-02");
    });

    it("throws on invalid date strings", () => {
      expect(() => addDays("not-a-date", 1)).toThrow("Invalid date string: not-a-date");
    });
  });

  describe("getDatePlusTwoDays", () => {
    it("returns a date exactly two days later", () => {
      expect(getDatePlusTwoDays("2024-05-01")).toBe("2024-05-03");
    });

    it("uses the same validation as addDays", () => {
      expect(() => getDatePlusTwoDays("bad-date")).toThrow("Invalid date string: bad-date");
    });
  });

  // TC-02 (from TASK-08 plan)
  describe("parseIsoToLocalDate", () => {
    it("TC-02: parses YYYY-MM-DD into correct local-time Date", () => {
      const d = parseIsoToLocalDate("2026-03-15");
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(2); // 0-indexed March
      expect(d.getDate()).toBe(15);
    });

    it("constructs date at local midnight (not UTC)", () => {
      const d = parseIsoToLocalDate("2026-01-01");
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
    });
  });

  describe("safeParseIso", () => {
    it("returns a valid Date for a well-formed ISO string", () => {
      const d = safeParseIso("2026-03-15");
      expect(d).toBeInstanceOf(Date);
      expect(d?.getDate()).toBe(15);
    });

    it("returns undefined for an empty string", () => {
      expect(safeParseIso("")).toBeUndefined();
    });

    it("returns undefined for a non-date string", () => {
      expect(safeParseIso("not-a-date")).toBeUndefined();
    });
  });

  // TC-03 (from TASK-08 plan)
  describe("formatDisplayDate", () => {
    it("TC-03: formats a Date as 'DD Mon'", () => {
      expect(formatDisplayDate(new Date(2026, 2, 3))).toBe("03 Mar");
    });

    it("formats single-digit days with leading zero", () => {
      expect(formatDisplayDate(new Date(2026, 0, 7))).toBe("07 Jan");
    });

    it("formats December correctly", () => {
      expect(formatDisplayDate(new Date(2026, 11, 31))).toBe("31 Dec");
    });
  });

  // TC-04 (from TASK-08 plan): round-trip ISO string
  describe("round-trip parseIsoToLocalDate → formatDate", () => {
    it("TC-04: parses and re-formats to the original ISO string", () => {
      const iso = "2026-03-15";
      expect(formatDate(parseIsoToLocalDate(iso))).toBe(iso);
    });

    it("handles end-of-year boundary", () => {
      const iso = "2025-12-31";
      expect(formatDate(parseIsoToLocalDate(iso))).toBe(iso);
    });
  });
});
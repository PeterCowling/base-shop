
import "@testing-library/jest-dom";

import { addDays, getDatePlusTwoDays, getToday, getTodayIso } from "@/utils/dateUtils";

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
});
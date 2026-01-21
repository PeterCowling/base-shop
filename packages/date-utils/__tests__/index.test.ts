import { formatInTimeZone } from "date-fns-tz";

import { calculateRentalDays,isoDateInNDays, startOfDay } from "../src";

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
});

describe("timezone conversions", () => {
  test("startOfDay respects provided timezone", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const start = startOfDay(date, "America/New_York");
    const formatted = formatInTimeZone(
      start,
      "America/New_York",
      "yyyy-MM-dd'T'HH:mm:ssXXX"
    );
    expect(formatted).toBe("2024-01-15T00:00:00-05:00");
  });
});

describe("invalid date inputs throwing errors", () => {
  test("calculateRentalDays throws on invalid date", () => {
    expect(() => calculateRentalDays("not-a-date")).toThrow("Invalid returnDate");
  });
});

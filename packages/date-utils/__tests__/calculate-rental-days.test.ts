import { calculateRentalDays } from "../src";

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

  test("returns one day for same-day rentals", () => {
    expect(calculateRentalDays("2025-01-01")).toBe(1);
  });

  test("throws when return date is before today", () => {
    expect(() => calculateRentalDays("2024-12-31")).toThrow(
      "returnDate must be in the future",
    );
  });

  test("defaults to one day when returnDate is missing", () => {
    expect(calculateRentalDays()).toBe(1);
  });

  test("throws on invalid date", () => {
    expect(() => calculateRentalDays("invalid")).toThrow();
  });
});


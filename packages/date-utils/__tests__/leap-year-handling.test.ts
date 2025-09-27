import { isoDateInNDays, calculateRentalDays } from "../src";

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

  test("calculateRentalDays counts leap day", () => {
    expect(calculateRentalDays("2024-03-01")).toBe(2);
  });
});


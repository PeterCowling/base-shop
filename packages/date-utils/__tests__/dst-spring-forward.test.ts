import { calculateRentalDays,isoDateInNDays, parseTargetDate } from "../src";

describe("DST boundaries — spring forward in New York", () => {
  beforeEach(() => {
    const systemTime = parseTargetDate(
      "2025-03-08T00:30:00",
      "America/New_York"
    )!;
    jest.useFakeTimers().setSystemTime(systemTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("parseTargetDate yields 23-hour span", () => {
    const before = parseTargetDate(
      "2025-03-09T00:30:00",
      "America/New_York"
    )!;
    const after = parseTargetDate(
      "2025-03-10T00:30:00",
      "America/New_York"
    )!;
    const diffHours = (after.getTime() - before.getTime()) / 3600000;
    expect(diffHours).toBe(23);
  });

  test("date helpers cross the missing hour", () => {
    expect(isoDateInNDays(1)).toBe("2025-03-09");
    expect(isoDateInNDays(2)).toBe("2025-03-10");
    expect(calculateRentalDays("2025-03-10")).toBe(2);
  });
});


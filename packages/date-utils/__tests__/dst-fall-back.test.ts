import { parseTargetDate, isoDateInNDays, calculateRentalDays } from "../src";

describe("DST boundaries — fall back in New York", () => {
  beforeEach(() => {
    const systemTime = parseTargetDate(
      "2025-11-01T00:30:00",
      "America/New_York"
    )!;
    jest.useFakeTimers().setSystemTime(systemTime);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("parseTargetDate yields 25-hour span", () => {
    const before = parseTargetDate(
      "2025-11-02T00:30:00",
      "America/New_York"
    )!;
    const after = parseTargetDate(
      "2025-11-03T00:30:00",
      "America/New_York"
    )!;
    const diffHours = (after.getTime() - before.getTime()) / 3600000;
    expect(diffHours).toBe(25);
  });

  test("date helpers cross the repeated hour", () => {
    expect(isoDateInNDays(1)).toBe("2025-11-02");
    expect(isoDateInNDays(2)).toBe("2025-11-03");
    expect(calculateRentalDays("2025-11-03")).toBe(2);
  });
});


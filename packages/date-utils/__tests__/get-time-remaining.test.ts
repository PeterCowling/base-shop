import { getTimeRemaining } from "../src";

describe("getTimeRemaining", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns positive ms for future date", () => {
    const target = new Date("2025-01-02T01:02:03Z");
    expect(getTimeRemaining(target)).toBe(
      (24 * 3600 + 3600 + 120 + 3) * 1000
    );
  });

  test("handles targets later on the same day", () => {
    const target = new Date("2025-01-01T12:00:00Z");
    expect(getTimeRemaining(target)).toBe(12 * 3600 * 1000);
  });

  test("handles targets at the next-day boundary", () => {
    const target = new Date("2025-01-02T00:00:00Z");
    expect(getTimeRemaining(target)).toBe(24 * 3600 * 1000);
  });

  test("returns zero for past dates", () => {
    const target = new Date("2024-12-31T23:59:59Z");
    expect(getTimeRemaining(target)).toBe(0);
  });

  test("returns zero when target is more than a day in the past", () => {
    const target = new Date("2024-12-30T00:00:00Z");
    expect(getTimeRemaining(target)).toBe(0);
  });

  test("returns zero for identical times", () => {
    const target = new Date("2025-01-01T00:00:00Z");
    expect(getTimeRemaining(target, target)).toBe(0);
  });
});


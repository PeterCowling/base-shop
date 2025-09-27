import { parseTargetDate } from "../src";

describe("parseTargetDate", () => {
  test("returns Date for valid input without timezone", () => {
    const result = parseTargetDate("2025-01-01T00:00:00");
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  test("parses with timezone", () => {
    expect(
      parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-01-01T05:00:00.000Z");
  });

  test("returns null for invalid input", () => {
    expect(parseTargetDate("invalid")).toBeNull();
  });

  test("returns null when targetDate is undefined", () => {
    expect(parseTargetDate()).toBeNull();
  });

  test("returns null for invalid timezone", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "Not/A_Zone")).toBeNull();
  });

  test("parses date-only and zoned strings", () => {
    expect(parseTargetDate("2025-01-01")?.toISOString()).toBe(
      new Date(2025, 0, 1).toISOString()
    );
    expect(parseTargetDate("2025-01-01T00:00:00Z")?.toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
    expect(
      parseTargetDate("2025-01-01T00:00:00+02:00")?.toISOString()
    ).toBe("2024-12-31T22:00:00.000Z");
  });

  test("parses past dates", () => {
    expect(
      parseTargetDate("1999-12-31T23:59:59")?.toISOString()
    ).toBe("1999-12-31T23:59:59.000Z");
  });

  test("returns null for impossible dates", () => {
    expect(parseTargetDate("2025-02-30T00:00:00")).toBeNull();
  });

  test('handles "today" with timezone', () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
    expect(
      parseTargetDate("today", "America/New_York")?.toISOString()
    ).toBe("2025-06-15T04:00:00.000Z");
    jest.useRealTimers();
  });

  test('parses "today" and "tomorrow" keywords', () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
    expect(parseTargetDate("today")?.toISOString()).toBe(
      "2025-06-15T00:00:00.000Z",
    );
    expect(parseTargetDate("tomorrow")?.toISOString()).toBe(
      "2025-06-16T00:00:00.000Z",
    );
    jest.useRealTimers();
  });
});


import { parseTargetDate } from "../src";

describe("parseTargetDate boundary cases", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-01T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("handles end and start of day without timezone", () => {
    expect(parseTargetDate("2025-06-01T23:59:59")?.toISOString()).toBe(
      "2025-06-01T23:59:59.000Z",
    );
    expect(parseTargetDate("2025-06-02T00:00:00")?.toISOString()).toBe(
      "2025-06-02T00:00:00.000Z",
    );
  });

  test("converts boundary times in America/New_York", () => {
    expect(
      parseTargetDate("2025-06-01T23:59:59", "America/New_York")?.toISOString(),
    ).toBe("2025-06-02T03:59:59.000Z");
    expect(
      parseTargetDate("2025-06-02T00:00:00", "America/New_York")?.toISOString(),
    ).toBe("2025-06-02T04:00:00.000Z");
  });

  test("handles boundary times in UTC", () => {
    expect(
      parseTargetDate("2025-06-01T23:59:59", "UTC")?.toISOString(),
    ).toBe("2025-06-01T23:59:59.000Z");
    expect(
      parseTargetDate("2025-06-02T00:00:00", "UTC")?.toISOString(),
    ).toBe("2025-06-02T00:00:00.000Z");
  });
});


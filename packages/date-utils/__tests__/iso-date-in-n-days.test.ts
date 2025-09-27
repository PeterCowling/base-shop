import { isoDateInNDays } from "../src";

describe("isoDateInNDays", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date("2025-01-01T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns ISO date string N days ahead", () => {
    expect(isoDateInNDays(7)).toBe("2025-01-08");
  });

  test("returns today's date when N is zero", () => {
    expect(isoDateInNDays(0)).toBe("2025-01-01");
  });

  test("handles negative offsets", () => {
    expect(isoDateInNDays(-1)).toBe("2024-12-31");
  });
});


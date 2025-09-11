import { parseTargetDate } from "../src";

describe("parseTargetDate respects TZ", () => {
  const originalTZ = process.env.TZ;

  beforeEach(() => {
    process.env.TZ = "America/New_York";
  });

  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  test("valid date string", () => {
    expect(parseTargetDate("2025-01-05")?.toISOString()).toBe(
      "2025-01-05T05:00:00.000Z"
    );
  });

  test("invalid calendar date", () => {
    expect(parseTargetDate("2025-02-30")).toBeNull();
  });

  test("malformed date string", () => {
    expect(parseTargetDate("2025-01")).toBeNull();
  });
});

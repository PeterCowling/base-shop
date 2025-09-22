import { parseTargetDate } from "../index";

describe("parseTargetDate", () => {
  it("parses ISO string", () => {
    expect(parseTargetDate("2025-01-01T00:00:00Z")?.toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
  });
  it("defaults to UTC when no timezone or offset provided", () => {
    expect(parseTargetDate("2025-01-01T00:00:00")?.toISOString()).toBe(
      "2025-01-01T00:00:00.000Z"
    );
  });
  it("parses with timezone", () => {
    expect(
      parseTargetDate("2025-01-01T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-01-01T05:00:00.000Z");
  });
  it("returns null for invalid input", () => {
    expect(parseTargetDate("invalid")).toBeNull();
  });
  it("returns null when target date is missing", () => {
    expect(parseTargetDate()).toBeNull();
  });
  it("returns null for invalid input with timezone", () => {
    expect(parseTargetDate("bad", "America/New_York")).toBeNull();
  });
  it("parses ISO string with timezone offset", () => {
    expect(parseTargetDate("2025-01-01T00:00:00-05:00")?.toISOString()).toBe(
      "2025-01-01T05:00:00.000Z"
    );
  });
  it('handles "today" and "tomorrow" keywords', () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
    expect(parseTargetDate("today")?.toISOString()).toBe(
      "2025-06-15T00:00:00.000Z",
    );
    expect(parseTargetDate("tomorrow")?.toISOString()).toBe(
      "2025-06-16T00:00:00.000Z",
    );
    jest.useRealTimers();
  });

  it('handles "yesterday" keyword', () => {
    jest.useFakeTimers().setSystemTime(new Date("2025-06-15T10:00:00Z"));
    expect(parseTargetDate("yesterday")?.toISOString()).toBe(
      "2025-06-14T00:00:00.000Z",
    );
    jest.useRealTimers();
  });

  it("validates date strings against process.env.TZ", () => {
    const prev = process.env.TZ;
    process.env.TZ = "UTC";
    expect(parseTargetDate("2025-02-29")).toBeNull();
    process.env.TZ = prev;
  });

  it("returns null when date string lacks three segments", () => {
    expect(parseTargetDate("2025-01")).toBeNull();
  });

  describe("process.env.TZ handling", () => {
    const prev = process.env.TZ;
    beforeAll(() => {
      process.env.TZ = "America/New_York";
    });
    afterAll(() => {
      process.env.TZ = prev;
    });
    it("parses valid local date", () => {
      expect(parseTargetDate("2025-01-05")?.toISOString()).toBe(
        "2025-01-05T05:00:00.000Z"
      );
    });
    it("returns null for invalid local date", () => {
      expect(parseTargetDate("2025-02-30")).toBeNull();
    });
  });
});

describe("invalid timezone handling", () => {
  it("parseTargetDate returns null for bad timezone", () => {
    expect(parseTargetDate("2025-01-01T00:00:00", "Not/A_Zone")).toBeNull();
  });
});

describe("parseTargetDate error handling", () => {
  it("returns null when timezone parsing throws", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("date-fns-tz", () => ({
        fromZonedTime: () => {
          throw new Error("boom");
        },
      }));
      const { parseTargetDate: mocked } = await import("../index");
      expect(
        mocked("2025-01-01T00:00:00", "America/New_York")
      ).toBeNull();
    });
  });

  it("returns null when timezone parsing yields NaN", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("date-fns-tz", () => ({
        fromZonedTime: () => new Date(NaN),
      }));
      const { parseTargetDate: mocked } = await import("../index");
      expect(
        mocked("2025-01-01T00:00:00", "America/New_York")
      ).toBeNull();
    });
  });
});

describe("DST transitions", () => {
  it("accounts for spring forward in New York", () => {
    const before = parseTargetDate("2025-03-09T00:30:00", "America/New_York")!;
    const after = parseTargetDate("2025-03-10T00:30:00", "America/New_York")!;
    const diffHours = (after.getTime() - before.getTime()) / 3600000;
    expect(diffHours).toBe(23);
  });

  it("accounts for fall back in New York", () => {
    const before = parseTargetDate("2025-11-02T00:30:00", "America/New_York")!;
    const after = parseTargetDate("2025-11-03T00:30:00", "America/New_York")!;
    const diffHours = (after.getTime() - before.getTime()) / 3600000;
    expect(diffHours).toBe(25);
  });
});


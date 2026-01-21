import {
  format,
  formatDate,
  fromZonedTime,
  parseDate,
  parseISO,
  startOfDay,
} from "../index";

describe("parseISO and format", () => {
  it("parses and formats a valid date", () => {
    const d = parseISO("2025-06-05");
    expect(format(d, "yyyy-MM-dd")).toBe("2025-06-05");
  });

  it("returns Invalid Date for bad input", () => {
    expect(Number.isNaN(parseISO("not-a-date").getTime())).toBe(true);
  });
});

describe("fromZonedTime", () => {
  it("converts zoned time to UTC", () => {
    const d = fromZonedTime("2025-01-01 00:00:00", "America/New_York");
    expect(d.toISOString()).toBe("2025-01-01T05:00:00.000Z");
  });

  it("handles invalid timezones", () => {
    const d = fromZonedTime("2025-01-01 00:00:00", "Invalid/Zone");
    expect(Number.isNaN(d.getTime())).toBe(true);
  });
});

describe("startOfDay", () => {
  it("returns midnight UTC when no timezone", () => {
    const d = startOfDay("2025-03-03T15:30:00Z");
    expect(d.toISOString()).toBe("2025-03-03T00:00:00.000Z");
  });

  it("handles Date objects without timezone", () => {
    const d = new Date(2025, 2, 10, 12);
    expect(startOfDay(d).toISOString()).toBe("2025-03-10T00:00:00.000Z");
  });

  it("adjusts for timezone offsets and DST", () => {
    const d = startOfDay("2025-03-10T12:00:00Z", "America/New_York");
    // After DST, midnight local is 04:00 UTC
    expect(d.toISOString()).toBe("2025-03-10T04:00:00.000Z");
  });

  it("handles DST fall back in New York", () => {
    const dstEnd = new Date("2025-11-02T12:00:00Z");
    expect(startOfDay(dstEnd, "America/New_York").toISOString()).toBe(
      "2025-11-02T04:00:00.000Z"
    );
    const before = new Date("2025-11-01T12:00:00Z");
    expect(startOfDay(before, "America/New_York").toISOString()).toBe(
      "2025-11-01T04:00:00.000Z"
    );
  });
});

describe("parseDate", () => {
  it("parses ISO strings", () => {
    expect(parseDate("2025-03-03T00:00:00Z")?.toISOString()).toBe(
      "2025-03-03T00:00:00.000Z"
    );
  });

  it("parses with timezone", () => {
    expect(
      parseDate("2025-03-03T00:00:00", "America/New_York")?.toISOString()
    ).toBe("2025-03-03T05:00:00.000Z");
  });

  it("returns null for invalid input", () => {
    expect(parseDate("not-a-date")).toBeNull();
  });

  it("returns null when timezone parsing yields NaN", () => {
    expect(parseDate("2025-03-03T00:00:00", "Not/A_Zone")).toBeNull();
  });

  it("returns null when timezone parsing throws", async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock("date-fns-tz", () => ({
        fromZonedTime: () => {
          throw new Error("boom");
        },
      }));
      const { parseDate: mocked } = await import("../index");
      expect(
        mocked("2025-01-01T00:00:00", "America/New_York")
      ).toBeNull();
    });
  });
});

describe("formatDate", () => {
  it("formats dates without timezone", () => {
    expect(formatDate("2025-03-03T05:06:07Z", "yyyy-MM-dd")).toBe(
      "2025-03-03"
    );
  });

  it("formats dates for a timezone", () => {
    const d = new Date("2025-03-03T05:06:07Z");
    expect(formatDate(d, "HH:mm", "America/New_York")).toBe("00:06");
  });

  it("throws for forbidden Y or D tokens", () => {
    expect(() => formatDate("2025-03-03T05:06:07Z", "YYYY")).toThrow(RangeError);
    expect(() => formatDate("2025-03-03T05:06:07Z", "DD")).toThrow(RangeError);
  });
});


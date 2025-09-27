import { formatDate } from "../src";

describe("formatDate", () => {
  test("formats dates without timezone", () => {
    expect(formatDate("2025-03-03T05:06:07Z", "yyyy-MM-dd")).toBe(
      "2025-03-03"
    );
  });

  test("formats dates for a timezone", () => {
    const d = new Date("2025-03-03T05:06:07Z");
    expect(formatDate(d, "HH:mm", "America/New_York")).toBe("00:06");
  });

  test("throws on invalid format pattern", () => {
    expect(() => formatDate("2025-03-03T00:00:00Z", "YYYY-MM-dd")).toThrow(
      RangeError
    );
  });

  test("throws RangeError for unsupported YYYY token", () => {
    const call = () => formatDate("2025-03-03T00:00:00Z", "YYYY");
    expect(call).toThrow(RangeError);
    expect(call).toThrow("Invalid format pattern");
  });
});


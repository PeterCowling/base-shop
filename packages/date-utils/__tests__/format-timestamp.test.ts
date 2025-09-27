import { formatTimestamp } from "../src";

describe("formatTimestamp", () => {
  test("formats ISO timestamp", () => {
    const ts = "2025-01-01T05:06:07Z";
    const formatted = formatTimestamp(ts, "en-US");
    expect(formatted).toContain("2025");
    expect(formatted).not.toBe(ts);
  });

  test("returns input for invalid timestamp", () => {
    expect(formatTimestamp("nope")).toBe("nope");
  });

  test("returns input for invalid timestamp with locale", () => {
    expect(formatTimestamp("nope", "en-US")).toBe("nope");
  });

  test("localizes ISO timestamp for given locale", () => {
    const ts = "2025-01-01T05:06:07Z";
    const expected = new Date(ts).toLocaleString("de-DE");
    expect(formatTimestamp(ts, "de-DE")).toBe(expected);
  });
});


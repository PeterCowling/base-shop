import { formatTimestamp } from "../index";

describe("formatTimestamp", () => {
  it("formats valid ISO timestamp", () => {
    const ts = "2025-01-01T05:06:07Z";
    const formatted = formatTimestamp(ts, "en-US");
    expect(formatted).toContain("2025");
    expect(formatted).not.toBe(ts);
  });
  it("returns original string for invalid timestamp", () => {
    const bad = "not-a-date";
    expect(formatTimestamp(bad)).toBe(bad);
  });
  it("returns input for invalid timestamp with locale", () => {
    expect(formatTimestamp("bad", "en-US")).toBe("bad");
  });
  it("localizes ISO timestamp for given locale", () => {
    const ts = "2025-01-01T05:06:07Z";
    const expected = new Date(ts).toLocaleString("de-DE");
    expect(formatTimestamp(ts, "de-DE")).toBe(expected);
  });
});

describe("locale formatting consistency", () => {
  it("formatTimestamp round-trips across locales", () => {
    const ts = "2025-03-03T12:34:56Z";
    const us = formatTimestamp(ts, "en-US");
    const de = formatTimestamp(ts, "de-DE");
    expect(us).not.toBe(de);
    expect(new Date(us).toISOString()).toBe("2025-03-03T12:34:56.000Z");
    expect(new Date(de).toISOString()).toBe("2025-03-03T12:34:56.000Z");
  });

  it("formats numeric string timestamps", () => {
    const ts = String(Date.UTC(2025, 0, 2, 3, 4, 5));
    const expected = new Date(Number(ts)).toLocaleString("en-US");
    expect(formatTimestamp(ts, "en-US")).toBe(expected);
  });
});


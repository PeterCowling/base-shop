import { formatTimestamp } from "../src";

describe("locale formatting consistency", () => {
  test("formatTimestamp round-trips across locales", () => {
    const ts = "2025-03-03T12:34:56Z";
    const us = formatTimestamp(ts, "en-US");
    const de = formatTimestamp(ts, "de-DE");
    expect(us).not.toBe(de);
    expect(new Date(us).toISOString()).toBe("2025-03-03T12:34:56.000Z");
    expect(new Date(de).toISOString()).toBe("2025-03-03T12:34:56.000Z");
  });
});


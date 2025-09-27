import { nowIso } from "../src";

describe("nowIso", () => {
  test("returns a valid ISO 8601 string near current time", () => {
    const isoString = nowIso();

    expect(new Date(isoString).toISOString()).toBe(isoString);

    const timestamp = Date.parse(isoString);
    expect(Math.abs(Date.now() - timestamp)).toBeLessThanOrEqual(1000);
  });
});


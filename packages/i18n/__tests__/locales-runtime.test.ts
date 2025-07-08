import { LOCALES } from "@acme/i18n";

describe("LOCALES runtime export", () => {
  it("should be a non-empty array", () => {
    expect(Array.isArray(LOCALES)).toBe(true);
    expect(LOCALES.length).toBeGreaterThan(0);
  });
});

import { hasProviderErrorFields } from "../error";

describe("hasProviderErrorFields", () => {
  it("returns true for plain objects", () => {
    expect(hasProviderErrorFields({})).toBe(true);
    expect(hasProviderErrorFields({ message: "test" })).toBe(true);
  });

  it("returns false for primitives", () => {
    for (const value of [null, undefined, 0, "", false]) {
      expect(hasProviderErrorFields(value)).toBe(false);
    }
  });
});

import { assertLocales } from "@acme/i18n";

describe("assertLocales", () => {
  it("throws on non-array values", () => {
    expect(() => assertLocales(undefined as any)).toThrow(
      "LOCALES must be a non-empty array"
    );
  });

  it("throws on empty arrays", () => {
    expect(() => assertLocales([] as any)).toThrow(
      "LOCALES must be a non-empty array"
    );
  });

  it("does not throw on non-empty arrays", () => {
    expect(() => assertLocales(["en"])).not.toThrow();
  });
});

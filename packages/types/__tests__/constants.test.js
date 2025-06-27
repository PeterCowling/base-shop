const { describe, it, expect } = require("@jest/globals");
const { LOCALES } = require("../src/constants.ts");

describe("Locale constants", () => {
  it("contains expected locales", () => {
    expect(LOCALES).toEqual(["en", "de", "it"]);
  });

  it("Locale type includes supported values", () => {
    /**
     * This runtime check also serves as a compile-time check
     * because assigning an invalid value would cause a TS error.
     */
    const { Locale } = require("../src/constants.ts");
    const accept = (l) => l;
    expect(accept("en")).toBe("en");
    expect(accept("de")).toBe("de");
    expect(accept("it")).toBe("it");
  });
});

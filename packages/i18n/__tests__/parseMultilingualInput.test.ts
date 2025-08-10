import { parseMultilingualInput } from "@acme/i18n";

describe("parseMultilingualInput", () => {
  const locales = ["en", "de", "it"] as const;

  it("detects field and locale from name", () => {
    expect(parseMultilingualInput("title_en", locales)).toEqual({
      field: "title",
      locale: "en",
    });
    expect(parseMultilingualInput("desc_de", locales)).toEqual({
      field: "desc",
      locale: "de",
    });
  });

  it("returns null for invalid input", () => {
    expect(parseMultilingualInput("foo_en", locales)).toBeNull();
  });
});

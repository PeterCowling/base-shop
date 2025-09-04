import { parseMultilingualInput } from "../parseMultilingualInput";

describe("parseMultilingualInput", () => {
  const locales = ["en", "de", "it"] as const;

  it("detects field and locale from name", () => {
    expect(parseMultilingualInput("title_en", locales)).toEqual({
      field: "title",
      locale: "en",
    });
    expect(parseMultilingualInput("desc_it", locales)).toEqual({
      field: "desc",
      locale: "it",
    });
  });

  it("returns null for invalid input", () => {
    expect(parseMultilingualInput("title_fr", locales)).toBeNull();
    expect(parseMultilingualInput("foo_en", locales)).toBeNull();
    expect(parseMultilingualInput("title_EN", locales)).toBeNull();
    expect(parseMultilingualInput(" title_en", locales)).toBeNull();
    expect(parseMultilingualInput("title_en ", locales)).toBeNull();
  });
});

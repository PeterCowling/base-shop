import { parseMultilingualInput } from "../parseMultilingualInput";

describe("parseMultilingualInput", () => {
  const locales = ["en", "de", "it"] as const;

  it("detects field and locale from name", () => {
    const tokens = [
      { name: "title_en", expected: { field: "title", locale: "en" } },
      { name: "desc_de", expected: { field: "desc", locale: "de" } },
    ];

    for (const { name, expected } of tokens) {
      expect(parseMultilingualInput(name, locales)).toEqual(expected);
    }
  });

  it("returns null for invalid input", () => {
    expect(parseMultilingualInput("title_es", locales)).toBeNull();
    expect(parseMultilingualInput("foo_en", locales)).toBeNull();
    expect(parseMultilingualInput("foo", locales)).toBeNull();
    expect(parseMultilingualInput("title", locales)).toBeNull();
    expect(parseMultilingualInput("title_EN", locales)).toBeNull();
    expect(parseMultilingualInput(" title_en", locales)).toBeNull();
    expect(parseMultilingualInput("title_en ", locales)).toBeNull();
    expect(parseMultilingualInput("title__en", locales)).toBeNull();
    expect(parseMultilingualInput("title-en", locales)).toBeNull();
    expect(
      parseMultilingualInput({ en: "x", it: "y" } as any, locales)
    ).toBeNull();
    expect(parseMultilingualInput(null as any, locales)).toBeNull();
    expect(parseMultilingualInput(undefined as any, locales)).toBeNull();
  });

  it("returns null when locale not in provided list", () => {
    const partialLocales = ["en", "it"] as const;
    expect(parseMultilingualInput("title_fr", partialLocales)).toBeNull();
  });
});
